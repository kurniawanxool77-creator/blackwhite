import type { Admin } from "@prisma/client";
import { adminProfile } from "@/lib/profile";
import { getSite } from "@/lib/site";
import { PanelFrame, type PanelLink } from "./PanelFrame";

type Props = { admin: Admin; links: PanelLink[]; children: React.ReactNode };

export async function PanelShell({ admin, links, children }: Props) {
  const [site, profile] = await Promise.all([getSite(), adminProfile(admin)]);
  return (
    <PanelFrame siteName={site.name} links={links} profile={profile}>
      {children}
    </PanelFrame>
  );
}
