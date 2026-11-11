import Link from "next/link";

export type CategoryFilterItem = {
  name: string;
  label: string;
  href: string;
  active: boolean;
};

// Bangun daftar item filter kategori (termasuk "Semua") dari daftar kategori di database.
export function categoryFilterItems(
  categories: string[],
  selected: string | undefined,
  buildHref: (category: string) => string,
): CategoryFilterItem[] {
  return ["", ...categories].map((c) => ({
    name: c,
    label: c || "Semua",
    href: buildHref(c),
    active: (selected ?? "") === c,
  }));
}

// Bilah filter kategori seragam untuk Superadmin, Landing Page, dan Dashboard User.
export function CategoryFilter({
  items,
  className = "",
}: {
  items: CategoryFilterItem[];
  className?: string;
}) {
  if (items.length <= 1) return null;
  return (
    <nav aria-label="Filter kategori" className={`no-scrollbar flex gap-1.5 overflow-x-auto text-sm ${className}`}>
      {items.map((item) => (
        <Link
          key={item.name || "semua"}
          href={item.href}
          className={`shrink-0 rounded px-3 py-1.5 whitespace-nowrap transition-colors ${
            item.active
              ? "bg-brand font-semibold text-white"
              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

