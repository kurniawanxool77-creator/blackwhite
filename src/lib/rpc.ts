let navigatorFn: ((to: string, opts?: { replace?: boolean }) => void) | null = null;

export function setRpcNavigator(fn: ((to: string, opts?: { replace?: boolean }) => void) | null) {
  navigatorFn = fn;
}

export function triggerRevalidate() {
  window.dispatchEvent(new CustomEvent("bw:revalidate"));
}

type RpcEnvelope<T> = {
  result?: T;
  redirect?: string;
  throwError?: boolean;
  error?: string;
};

async function handleResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as RpcEnvelope<T>;
  if (!res.ok || data.throwError) {
    throw new Error(data.error || "Terjadi kesalahan.");
  }
  triggerRevalidate();
  if (data.redirect) {
    if (navigatorFn) navigatorFn(data.redirect);
    else window.location.assign(data.redirect);
  }
  return (data.result as T) ?? (undefined as T);
}

export function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Terjadi kesalahan.";
}

export async function rpcForm<T = unknown>(action: string, formData: FormData, ...queryArgs: (string | number | null | undefined)[]): Promise<T> {
  const url = new URL(`/api/rpc/${encodeURIComponent(action)}`, window.location.origin);
  for (const a of queryArgs) {
    if (a !== null && a !== undefined) url.searchParams.append("a", String(a));
  }
  const res = await fetch(url.pathname + url.search, { method: "POST", body: formData });
  return handleResponse<T>(res);
}

export async function rpcFormMessage(action: string, formData: FormData, ...queryArgs: (string | number | null | undefined)[]): Promise<string | null> {
  try {
    return await rpcForm<string | null>(action, formData, ...queryArgs);
  } catch (err) {
    return errorMessage(err);
  }
}

export async function rpcFormState(action: string, formData: FormData, ...queryArgs: (string | number | null | undefined)[]): Promise<{ ok: boolean; message: string }> {
  try {
    return await rpcForm<{ ok: boolean; message: string }>(action, formData, ...queryArgs);
  } catch (err) {
    return { ok: false, message: errorMessage(err) };
  }
}

export async function callRpc<T = unknown>(action: string, ...args: unknown[]): Promise<T> {
  const res = await fetch(`/api/rpc/${encodeURIComponent(action)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ args }),
  });
  return handleResponse<T>(res);
}
