import { useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useParams as useRRParams,
  useSearchParams as useRRSearchParams,
} from "react-router-dom";
import { triggerRevalidate } from "../lib/rpc";

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, { replace: true }),
      back: () => navigate(-1),
      prefetch: () => {},
      refresh: () => triggerRevalidate(),
    }),
    [navigate],
  );
}

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  const [params] = useRRSearchParams();
  return params;
}

export function useParams<T extends Record<string, string | string[] | undefined> = Record<string, string>>() {
  return useRRParams() as unknown as T;
}

export function notFound(): never {
  throw new Error("NOT_FOUND");
}

export function redirect(url: string): never {
  if (typeof window !== "undefined") window.location.replace(url);
  throw new Error(`REDIRECT:${url}`);
}

