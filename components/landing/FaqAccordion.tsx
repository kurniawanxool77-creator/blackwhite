"use client";

import { useState } from "react";

export type FaqItem = {
  q: string;
  a: string;
};

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  // Buka item pertama secara default agar pengunjung langsung paham fiturnya interaktif
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;

        return (
          <div
            key={idx}
            className={`rounded-md border transition-colors ${
              isOpen
                ? "border-brand/40 bg-green-50/20 shadow-2xs"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 p-3.5 text-left transition-colors"
            >
              <span
                className={`text-xs font-semibold ${
                  isOpen ? "text-brand" : "text-gray-900"
                }`}
              >
                {item.q}
              </span>

              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition-transform duration-200 ${
                  isOpen
                    ? "bg-brand text-white rotate-180"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100/80 px-3.5 pt-2 pb-3.5 animate-rise">
                <p className="text-xs leading-relaxed text-gray-600">{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
