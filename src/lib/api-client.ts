import { useCallback, useEffect, useState } from "react";
import { LIVE_EVENT } from "@/components/ui/LiveSync";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function reviveDates(_key: string, value: unknown): unknown {
  return typeof value === "string" && ISO_DATE_RE.test(value) ? new Date(value) : value;
}

export type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: number | null;
  refresh: () => void;
};

export function useApiData<T>(url: string | null): ApiState<T> {
  const [state, setState] = useState<{
    loadedUrl: string | null;
    data: T | null;
    error: string | null;
    status: number | null;
  }>({ loadedUrl: null, data: null, error: null, status: null });
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const onRev = () => setTick((t) => t + 1);
    window.addEventListener("bw:revalidate", onRev);
    window.addEventListener(LIVE_EVENT, onRev);
    return () => {
      window.removeEventListener("bw:revalidate", onRev);
      window.removeEventListener(LIVE_EVENT, onRev);
    };
  }, []);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();

    fetch(url, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const text = await res.text();
        let body: unknown = {};
        if (text) {
          try {
            body = JSON.parse(text, reviveDates);
          } catch {
            body = {};
          }
        }
        if (!res.ok) {
          setState((prev) => ({
            loadedUrl: url,
            data: prev.loadedUrl === url ? prev.data : null,
            error: (body as { error?: string }).error || `HTTP ${res.status}`,
            status: res.status,
          }));
          return;
        }
        setState({ loadedUrl: url, data: body as T, error: null, status: res.status });
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        setState((prev) => ({
          loadedUrl: url,
          data: prev.loadedUrl === url ? prev.data : null,
          error: err instanceof Error ? err.message : "Gagal memuat data.",
          status: prev.loadedUrl === url ? prev.status : null,
        }));
      });

    return () => controller.abort();
  }, [url, tick]);

  if (!url) return { data: null, loading: false, error: null, status: null, refresh };
  const sameUrl = state.loadedUrl === url;
  return {
    data: sameUrl ? state.data : null,
    loading: !sameUrl,
    error: sameUrl ? state.error : null,
    status: sameUrl ? state.status : null,
    refresh,
  };
}
