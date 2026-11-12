export function OrDivider({ className = "my-6" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center gap-3 text-xs text-gray-500`} role="separator">
      <span className="h-px flex-1 bg-gray-200" />
      atau
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}
