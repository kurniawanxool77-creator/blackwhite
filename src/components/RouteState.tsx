import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";

export function PageLoader({ message = "Memuat data..." }: { message?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-8 text-sm text-gray-500" role="status" aria-live="polite">
      {message}
    </div>
  );
}

export function PageError({
  message,
  onRetry,
  backTo,
  backLabel = "Kembali",
}: {
  message: string;
  onRetry?: () => void;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="card p-6">
        <p className="text-sm font-medium text-red-700">{message}</p>
        <div className="mt-4 flex justify-center gap-2">
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn btn-primary">
              Coba lagi
            </button>
          )}
          {backTo && (
            <Link to={backTo} className="btn btn-secondary">
              {backLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotFoundCard({
  title = "Halaman tidak ditemukan",
  hint = "Periksa kembali alamat atau data yang Anda buka.",
  backTo = "/",
  backLabel = "Kembali ke beranda",
}: {
  title?: string;
  hint?: string;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="card p-6">
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-600">{hint}</p>
        <Link to={backTo} className="btn btn-primary mt-4 inline-flex">
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

export function DataGate<T>({
  state,
  children,
  notFoundTitle,
  backTo,
}: {
  state: { data: T | null; loading: boolean; error: string | null; status: number | null; refresh: () => void };
  children: (data: T) => ReactNode;
  notFoundTitle?: string;
  backTo?: string;
}) {
  if (state.loading && state.data === null) return <PageLoader />;
  if (state.status === 404) return <NotFoundCard title={notFoundTitle} backTo={backTo} />;
  if (state.error && state.data === null) return <PageError message={state.error} onRetry={state.refresh} backTo={backTo} />;
  if (!state.data) return <PageLoader />;
  return <>{children(state.data)}</>;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || "Terjadi kesalahan saat menampilkan halaman." };
  }

  render() {
    if (this.state.hasError) {
      return (
        <PageError
          message={this.state.message}
          onRetry={() => window.location.reload()}
          backTo="/"
          backLabel="Beranda"
        />
      );
    }
    return this.props.children;
  }
}

