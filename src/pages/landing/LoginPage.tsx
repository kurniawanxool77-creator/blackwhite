import { Link, Navigate, useSearchParams } from "react-router-dom";
import { GoogleSignInButton } from "@/components/auth/AuthButtons";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { OrDivider } from "@/components/auth/OrDivider";
import { UserLoginForm } from "@/components/auth/UserLoginForm";
import { PageLoader } from "@/src/components/RouteState";
import { useAuth } from "@/src/lib/auth-client";

const OAUTH_ERRORS: Record<string, string> = {
  GoogleNotConfigured: "Login Google belum dikonfigurasi di server.",
  OAuthCancelled: "Login dengan Google dibatalkan.",
  OAuthState: "Sesi login Google kedaluwarsa atau tidak valid. Silakan coba lagi.",
  OAuthToken: "Gagal menukar token login Google. Periksa Authorized redirect URI & Client Secret.",
  OAuthProfile: "Gagal mengambil profil akun Google Anda.",
  OAuthEmail: "Akun Google tidak menyertakan alamat email.",
};

export function LoginPage() {
  const { loading, user, site, googleEnabled } = useAuth();
  const [searchParams] = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/dashboard";
  const errCode = searchParams.get("error");
  const oauthError = errCode ? (OAUTH_ERRORS[errCode] ?? "Login dengan Google gagal. Silakan coba lagi.") : null;

  if (loading) return <PageLoader />;
  if (user?.role === "user") return <Navigate to={callbackUrl} replace />;

  return (
    <AuthSplit image={site.loginImage || site.heroImage} caption={site.tagline}>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Masuk</h1>
      <p className="mt-1 mb-6 text-sm text-gray-600">Untuk daftar event dan lihat tiket.</p>
      {oauthError && <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{oauthError}</p>}
      <UserLoginForm callbackUrl={callbackUrl} />
      {googleEnabled && (
        <>
          <OrDivider />
          <GoogleSignInButton callbackUrl={callbackUrl} />
        </>
      )}
      <p className="mt-6 text-center text-sm text-gray-600">
        Belum punya akun?{" "}
        <Link to={`/daftar?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-gray-900 hover:underline">
          Daftar sekarang
        </Link>
      </p>
      <p className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
        Panitia? <Link to="/admin" className="hover:text-gray-900 hover:underline">Login panitia</Link>
      </p>
    </AuthSplit>
  );
}
