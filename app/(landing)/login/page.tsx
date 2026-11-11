import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/AuthButtons";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { OrDivider } from "@/components/auth/OrDivider";
import { UserLoginForm } from "@/components/auth/UserLoginForm";
import { getSession } from "@/lib/auth";
import { getSite } from "@/lib/site";
import { safeCallback } from "@/lib/url";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const target = safeCallback((await searchParams).callbackUrl);
  const [session, site] = await Promise.all([getSession(), getSite()]);
  if (session?.user.role === "user") redirect(target);

  return (
    <AuthSplit image={site.loginImage || site.heroImage} caption={site.tagline}>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Masuk</h1>
      <p className="mt-1 mb-6 text-sm text-gray-600">Untuk daftar pelatihan dan lihat tiket.</p>
      <UserLoginForm callbackUrl={target} />
      <OrDivider />
      <GoogleSignInButton callbackUrl={target} />
      <p className="mt-6 text-center text-sm text-gray-600">
        Belum punya akun?{" "}
        <Link href={`/daftar?callbackUrl=${encodeURIComponent(target)}`} className="font-semibold text-green-700 hover:underline">
          Daftar sekarang
        </Link>
      </p>
      <p className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
        Panitia? <Link href="/admin" className="hover:text-gray-900 hover:underline">Login panitia</Link>
      </p>
    </AuthSplit>
  );
}
