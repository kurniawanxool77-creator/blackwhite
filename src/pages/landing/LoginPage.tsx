import { Link, Navigate, useSearchParams } from "react-router-dom";
import { GoogleSignInButton } from "@/components/auth/AuthButtons";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { OrDivider } from "@/components/auth/OrDivider";
import { UserLoginForm } from "@/components/auth/UserLoginForm";
import { PageLoader } from "@/src/components/RouteState";
import { useAuth } from "@/src/lib/auth-client";

export function LoginPage() {
  const { loading, user, site, googleEnabled } = useAuth();
  const [searchParams] = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = rawCallback.startsWith("/") ? rawCallback : "/dashboard";

  if (loading) return <PageLoader />;
  if (user?.role === "user") return <Navigate to={callbackUrl} replace />;

  return (
    <AuthSplit image={site.loginImage || site.heroImage} caption={site.name}>
      <div className="card p-6 sm:p-8">
        <h1 className="text-xl font-bold text-gray-900">Masuk peserta</h1>
        <p className="mt-1 text-sm text-gray-600">Lihat tiket QR, materi pembelajaran, dan sertifikat Anda.</p>

        {googleEnabled && (
          <div className="mt-5">
            <GoogleSignInButton callbackUrl={callbackUrl} />
            <OrDivider />
          </div>
        )}

        <div className={googleEnabled ? "" : "mt-5"}>
          <UserLoginForm callbackUrl={callbackUrl} />
        </div>

        <p className="mt-5 text-center text-sm text-gray-600">
          Belum punya akun?{" "}
          <Link to="/daftar" className="font-medium text-brand hover:underline">Daftar di sini</Link>
        </p>
      </div>
    </AuthSplit>
  );
}
