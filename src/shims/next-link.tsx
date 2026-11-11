import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Link as RouterLink } from "react-router-dom";

type HrefObject = { pathname?: string; search?: string; hash?: string };
type LinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string | HrefObject;
  prefetch?: boolean;
  replace?: boolean;
};

function normalizeHref(href: string | HrefObject): string {
  if (typeof href === "string") return href;
  return `${href.pathname ?? ""}${href.search ?? ""}${href.hash ?? ""}` || "/";
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ href, prefetch: _p, replace, target, ...rest }, ref) => {
  const to = normalizeHref(href);
  const external =
    target === "_blank" ||
    to.startsWith("http://") ||
    to.startsWith("https://") ||
    to.startsWith("mailto:") ||
    to.startsWith("tel:") ||
    to.startsWith("#") ||
    to.startsWith("/media/") ||
    to.startsWith("/superadmin/qr/") ||
    (to.startsWith("/superadmin/events/") && to.endsWith("/export"));

  if (external) {
    return <a ref={ref} href={to} target={target} {...rest} />;
  }
  return <RouterLink ref={ref} to={to} replace={replace} {...rest} />;
});

Link.displayName = "Link";
export default Link;
