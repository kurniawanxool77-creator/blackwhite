import { redirect } from "next/navigation";
import { LoginCard } from "@/components/auth/LoginCard";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic"; // nama brand dibaca dari database
// Alamat rahasia pemilik: jangan diindeks mesin pencari.
export const metadata = { robots: { index: false, follow: false } };

export default async function SuperadminLoginPage() {
  const session = await getSession();
  if (session?.user.role === "superadmin") {
    redirect("/superadmin/dashboard");
  }
  return <LoginCard portal="superadmin" />;
}

