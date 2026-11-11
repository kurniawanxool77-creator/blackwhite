import { redirect } from "next/navigation";
import { LoginCard } from "@/components/auth/LoginCard";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session?.user.role === "scanner") {
    redirect("/admin/dashboard");
  }
  return <LoginCard portal="admin" />;
}
