import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Search, X, ChevronDown } from 'lucide-react';

const API_BASE_URL = 'https://nexus-backend-fbcotg.fly.dev/api';

export const INDUSTRIES = ['Climate & Energy', 'Health & Wellness', 'Education', 'Fintech'];
export const STAGES = ['MVP', 'Early Stage', 'Scaling'];
const FUNDING = [
  { value: 'under-10k', label: 'Under $10k' },
  { value: '10k-50k', label: '$10k – $50k' },
  { value: '50k-250k', label: '$50k – $250k' },
  { value: '250k-plus', label: '$250k+' },
];
const SORTS = [
  { value: 'featured', label: 'Featured first' },
  { value: 'newest', label: 'Newest' },
  { value: 'az', label: 'A to Z' },
];

const selectClass =
  'w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer';

function MultiSelect({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = (value) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${selectClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">
          {label}
          {selected.length > 0 && (
            <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[180px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="accent-emerald-600"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscoverFilters({
  searchInput,
  onSearchInput,
  onClearSearch,
  industry,
  stage,
  country,
  funding,
  sort,
  onChange,
  totalProjects,
  hasActiveFilters,
  onClearAll,
}) {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    let alive = true;
    axios
      .get(`${API_BASE_URL}/projects/filter-options`)
      .then((res) => alive && setCountries(res.data?.countries || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const countryOptions = country && !countries.includes(country) ? [country, ...countries] : countries;

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchInput(e.target.value)}
            placeholder="Search title, description, technology or skills"
            className="w-full pl-10 pr-9 py-2 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        <MultiSelect
          label="Industry"
          options={INDUSTRIES}
          selected={industry}
          onChange={(v) => onChange({ industry: v })}
        />
        <MultiSelect
          label="Stage"
          options={STAGES}
          selected={stage}
          onChange={(v) => onChange({ stage: v })}
        />
        <select
          value={country}
          onChange={(e) => onChange({ country: e.target.value })}
          className={selectClass}
          aria-label="Country"
        >
          <option value="">All countries</option>
          {countryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={funding}
          onChange={(e) => onChange({ funding: e.target.value })}
          className={selectClass}
          aria-label="Funding requirement"
        >
          <option value="">Any funding</option>
          {FUNDING.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          className={`${selectClass} col-span-2 lg:col-span-1`}
          aria-label="Sort"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-500" aria-live="polite">
          {totalProjects === null
            ? 'Loading…'
            : `${totalProjects} project${totalProjects === 1 ? '' : 's'} found`}
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="font-semibold text-[#0f9f59] hover:underline cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}