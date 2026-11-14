import { Link, Navigate, useSearchParams } from "react-router-dom";
import { GoogleSignInButton } from "@/components/auth/AuthButtons";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { OrDivider } from "@/components/auth/OrDivider";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { PageLoader } from "@/src/components/RouteState";
import { useAuth } from "@/src/lib/auth-client";

export function RegisterPage() {
  const { loading, user, site, googleEnabled } = useAuth();
  const [searchParams] = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/dashboard";

  if (loading) return <PageLoader />;
  if (user?.role === "user") return <Navigate to={callbackUrl} replace />;

  return (
    <AuthSplit image={site.loginImage || site.heroImage} caption={site.tagline}>
      <div className="mb-4">
        <Link to="/" className="inline-block" aria-label={site.name}>
          <img src={site.logoImage || "/logo.png"} alt={site.name} className="h-8 w-auto object-contain" />
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Daftar akun peserta</h1>
      <p className="mt-1 mb-6 text-sm text-gray-600">Satu akun untuk mendaftar semua event dan menyimpan QR tiket Anda.</p>
      <RegisterForm callbackUrl={callbackUrl} />
      {googleEnabled && (
        <>
          <OrDivider />
          <GoogleSignInButton callbackUrl={callbackUrl} label="Daftar dengan Google" />
        </>
      )}
      <p className="mt-6 text-center text-sm text-gray-600">
        Sudah punya akun?{" "}
        <Link to={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-gray-900 hover:underline">
          Masuk
        </Link>
      </p>
    </AuthSplit>
  );
}
