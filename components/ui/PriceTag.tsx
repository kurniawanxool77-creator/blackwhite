import { finalPrice, fmtRp } from "@/lib/format";

export function PriceTag({ event, className = "" }: { event: { price: number; discount: number }; className?: string }) {
  const final = finalPrice(event);
  if (final === 0) return <p className={`font-semibold text-gray-900 ${className}`}>Gratis</p>;
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className="font-semibold text-gray-900">{fmtRp(final)}</span>
      {event.discount > 0 && (
        <>
          <span className="text-sm text-gray-500 line-through">{fmtRp(event.price)}</span>
          <span className="rounded border border-red-200 bg-red-50 px-1.5 text-xs font-medium text-red-700">
            -{event.discount}%
          </span>
        </>
      )}
    </p>
  );
}
