// Kerangka halaman saat data dimuat (pengganti layar kosong).
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10" aria-busy="true" aria-label="Memuat">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-11 w-full rounded-md" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card overflow-hidden">
            <div className="skeleton aspect-video w-full" />
            <div className="space-y-2 p-5">
              <div className="skeleton h-3 w-1/3 rounded" />
              <div className="skeleton h-5 w-4/5 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
