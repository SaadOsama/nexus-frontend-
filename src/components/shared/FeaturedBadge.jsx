import React from 'react';
import { Star } from 'lucide-react';

export default function FeaturedBadge({ show = true, className = '' }) {
  if (!show) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ${className}`}
    >
      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
      Featured
    </span>
  );
}