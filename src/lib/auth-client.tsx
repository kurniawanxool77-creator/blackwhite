import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { ProfileInfo } from "@/lib/profile";
import { DEFAULT_SITE, type Site } from "@/lib/site-defaults";
import { setRpcNavigator, triggerRevalidate } from "./rpc";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "scanner" | "superadmin";
};

type AuthContextValue = {
  loading: boolean;
  user: SessionUser | null;
  profile: ProfileInfo | null;
  site: Site;
  googleEnabled: boolean;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  loading: true,
  user: null,
  profile: null,
  site: DEFAULT_SITE,
  googleEnabled: false,
  refreshSession: async () => {},
});

let refreshGlobalSession: (() => Promise<void>) | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [site, setSite] = useState<Site>(DEFAULT_SITE);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const applySnapshot = useCallback((sessJson: { user: SessionUser | null; profile: ProfileInfo | null; googleEnabled?: boolean } | null, siteJson: Site | null) => {
    if (sessJson) {
      setUser(sessJson.user ?? null);
      setProfile(sessJson.profile ?? null);
      setGoogleEnabled(Boolean(sessJson.googleEnabled));
    }
    if (siteJson) setSite(siteJson);
    setLoading(false);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const [sessRes, siteRes] = await Promise.all([
        fetch("/api/auth/session", { cache: "no-store" }),
        fetch("/api/public/site", { cache: "no-store" }),
      ]);
      const sessJson = sessRes.ok ? ((await sessRes.json()) as { user: SessionUser | null; profile: ProfileInfo | null; googleEnabled?: boolean }) : null;
      const siteJson = siteRes.ok ? ((await siteRes.json()) as Site) : null;
      applySnapshot(sessJson, siteJson);
    } catch {
      setLoading(false);
    }
  }, [applySnapshot]);

  useEffect(() => {
    setRpcNavigator((to, opts) => navigate(to, opts));
    refreshGlobalSession = refreshSession;
    let active = true;
    Promise.all([
      fetch("/api/auth/session", { cache: "no-store" }),
      fetch("/api/public/site", { cache: "no-store" }),
    ])
      .then(async ([sessRes, siteRes]) => {
        if (!active) return;
        const sessJson = sessRes.ok ? ((await sessRes.json()) as { user: SessionUser | null; profile: ProfileInfo | null; googleEnabled?: boolean }) : null;
        const siteJson = siteRes.ok ? ((await siteRes.json()) as Site) : null;
        if (active) applySnapshot(sessJson, siteJson);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    const onRev = () => {
      void refreshSession();
    };
    window.addEventListener("bw:revalidate", onRev);
    return () => {
      active = false;
      setRpcNavigator(null);
      window.removeEventListener("bw:revalidate", onRev);
    };
  }, [navigate, refreshSession, applySnapshot]);

  return (
    <AuthContext.Provider value={{ loading, user, profile, site, googleEnabled, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function signIn(
  provider: "google" | "user" | "admin" | string,
  options?: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  if (provider === "google") {
    const cb = typeof options?.callbackUrl === "string" ? options.callbackUrl : "/dashboard";
    window.location.href = `/api/auth/google?callbackUrl=${encodeURIComponent(cb)}`;
    return { ok: true };
  }

  const endpoint = provider === "admin" ? "/api/auth/login/admin" : "/api/auth/login/user";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: options?.email ?? "",
      password: options?.password ?? "",
      portal: options?.portal ?? "admin",
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: body.error || "Login gagal." };
  }
  await refreshGlobalSession?.();
  triggerRevalidate();
  return { ok: true };
}

export async function signOut(options?: { callbackUrl?: string }) {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Tetap bersihkan state lokal meskipun koneksi terputus
  }
  await refreshGlobalSession?.();
  triggerRevalidate();
  if (options?.callbackUrl) {
    window.location.assign(options.callbackUrl);
  }
}
