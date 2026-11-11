import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/AuthButtons";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { OrDivider } from "@/components/auth/OrDivider";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getSession } from "@/lib/auth";
import { getSite } from "@/lib/site";
import { safeCallback } from "@/lib/url";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Daftar" };

export default async function RegisterPage({ searchParams }: PageProps<"/daftar">) {
  const target = safeCallback((await searchParams).callbackUrl);
  const [session, site] = await Promise.all([getSession(), getSite()]);
  if (session?.user.role === "user") redirect(target);

  return (
    <AuthSplit image={site.loginImage || site.heroImage} caption={site.tagline}>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Daftar akun peserta</h1>
      <p className="mt-1 mb-6 text-sm text-gray-600">Satu akun untuk mendaftar semua pelatihan dan menyimpan QR tiket Anda.</p>
      <RegisterForm callbackUrl={target} />
      <OrDivider />
      <GoogleSignInButton callbackUrl={target} label="Daftar dengan Google" />
      <p className="mt-6 text-center text-sm text-gray-600">
        Sudah punya akun?{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(target)}`} className="font-semibold text-gray-900 hover:underline">
          Masuk
        </Link>
      </p>
    </AuthSplit>
  );
}
