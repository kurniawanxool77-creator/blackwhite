const TONES: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-green-200 bg-green-50 text-green-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  open: "border-green-200 bg-green-50 text-green-800",
  draft: "border-gray-200 bg-gray-50 text-gray-700",
  closed: "border-amber-200 bg-amber-50 text-amber-800",
  done: "border-gray-200 bg-gray-50 text-gray-700",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${TONES[status] ?? TONES.draft}`}>
      {label}
    </span>
  );
}
