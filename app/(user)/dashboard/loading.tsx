export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat">
      <div className="skeleton h-7 w-40 rounded" />
      <div className="card space-y-3 p-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-10 w-full rounded" />
        ))}
      </div>
    </div>
  );
}
