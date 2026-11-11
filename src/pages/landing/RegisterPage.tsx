import { Link, Navigate } from "react-router-dom";
import { GoogleSignInButton } from "@/components/auth/AuthButtons";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { OrDivider } from "@/components/auth/OrDivider";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { PageLoader } from "@/src/components/RouteState";
import { useAuth } from "@/src/lib/auth-client";

export function RegisterPage() {
  const { loading, user, site, googleEnabled } = useAuth();

  if (loading) return <PageLoader />;
  if (user?.role === "user") return <Navigate to="/dashboard" replace />;

  return (
    <AuthSplit image={site.loginImage || site.heroImage} caption={site.name}>
      <div className="card p-6 sm:p-8">
        <h1 className="text-xl font-bold text-gray-900">Buat akun peserta</h1>
        <p className="mt-1 text-sm text-gray-600">Satu akun untuk semua pelatihan, tiket QR, dan sertifikat.</p>

        {googleEnabled && (
          <div className="mt-5">
            <GoogleSignInButton callbackUrl="/dashboard" />
            <OrDivider />
          </div>
        )}

        <div className={googleEnabled ? "" : "mt-5"}>
          <RegisterForm callbackUrl="/dashboard" />
        </div>

        <p className="mt-5 text-center text-sm text-gray-600">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-medium text-brand hover:underline">Masuk</Link>
        </p>
      </div>
    </AuthSplit>
  );
}
