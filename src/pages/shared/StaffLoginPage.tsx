import { Navigate } from "react-router-dom";
import { LoginCard } from "@/components/auth/LoginCard";
import { PageLoader } from "@/src/components/RouteState";
import { useAuth } from "@/src/lib/auth-client";

export function StaffLoginPage({ portal }: { portal: "admin" | "superadmin" }) {
  const { loading, user, site } = useAuth();

  if (loading) return <PageLoader />;
  if (portal === "admin" && user?.role === "scanner") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (portal === "superadmin" && user?.role === "superadmin") {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  return <LoginCard portal={portal} siteName={site.name} />;
}

