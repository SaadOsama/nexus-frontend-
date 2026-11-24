import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Search, X, ChevronDown, Check } from 'lucide-react';

const API_BASE_URL = 'https://nexus-backend-fbcotg.fly.dev/api';

export const INDUSTRIES = ['Climate & Energy', 'Health & Wellness', 'Education', 'Fintech'];
export const STAGES = [
  'Idea',
  'Research',
  'Prototype',
  'MVP',
  'Early Revenue',
  'Scaling',
  'Established Business',
];
const FUNDING = [
  { value: 'not-seeking', label: 'Not seeking' },
  { value: 'under-10k', label: 'Under $10k' },
  { value: '10k-50k', label: '$10k to $50k' },
  { value: '50k-250k', label: '$50k to $250k' },
  { value: '250k-1m', label: '$250k to $1M' },
  { value: 'over-1m', label: 'Over $1M' },
];
const SORTS = [
  { value: 'featured', label: 'Featured first' },
  { value: 'newest', label: 'Newest' },
  { value: 'az', label: 'A to Z' },
];

const triggerClass =
  'w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:border-[#0f9f59] transition-all cursor-pointer flex items-center justify-between gap-2 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)]';

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
        className={`${triggerClass} ${
          selected.length > 0 ? 'border-[#0f9f59]/50 bg-[#e6f4ea]/30 text-slate-900' : ''
        }`}
      >
        <span className="truncate">
          {label}
          {selected.length > 0 && (
            <span className="ml-1.5 rounded-full bg-[#e6f4ea] px-1.5 py-0.5 text-[10px] font-bold text-[#0f9f59]">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180 text-[#0f9f59]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full min-w-[200px] rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-lg">
          {options.map((opt) => {
            const isChecked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                  isChecked
                    ? 'bg-[#e6f4ea] text-[#0f9f59] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(opt)}
                    className="accent-[#0f9f59] rounded cursor-pointer"
                  />
                  <span className="truncate">{opt}</span>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SingleSelect({ placeholder, options, value, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const isFiltered = Boolean(value) && value !== 'featured';

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${triggerClass} ${
          isFiltered ? 'border-[#0f9f59]/50 bg-[#e6f4ea]/30 text-slate-900' : ''
        }`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180 text-[#0f9f59]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full min-w-[190px] max-h-60 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-lg">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#e6f4ea] text-[#0f9f59] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[#0f9f59]" />}
              </button>
            );
          })}
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

    const loadCountries = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/projects/filter-options`);
        const list = res.data?.countries || res.data?.data?.countries || [];
        if (alive && Array.isArray(list) && list.length > 0) {
          setCountries(list);
          return;
        }
      } catch {
        // Fallback neeche chalega
      }

      // Fallback: published projects se unique countries nikalna
      try {
        const res = await axios.get(`${API_BASE_URL}/projects`, {
          params: { page: 1, limit: 100 },
        });
        const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const unique = Array.from(
          new Set(
            rows
              .map((p) => (p.country || p.location || '').trim())
              .filter(Boolean)
              .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
          )
        ).sort((a, b) => a.localeCompare(b));

        if (alive) setCountries(unique);
      } catch {
        // Ignore
      }
    };

    loadCountries();
    return () => {
      alive = false;
    };
  }, []);

  const countryList =
    country && !countries.some((c) => c.toLowerCase() === country.toLowerCase())
      ? [country, ...countries]
      : countries;

  const countryOptions = [
    { value: '', label: 'All countries' },
    ...countryList.map((c) => ({ value: c, label: c })),
  ];

  const fundingOptions = [{ value: '', label: 'Any funding' }, ...FUNDING];

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
        <SingleSelect
          placeholder="All countries"
          options={countryOptions}
          value={country}
          onChange={(val) => onChange({ country: val })}
        />
        <SingleSelect
          placeholder="Any funding"
          options={fundingOptions}
          value={funding}
          onChange={(val) => onChange({ funding: val })}
        />
        <SingleSelect
          placeholder="Featured first"
          options={SORTS}
          value={sort}
          onChange={(val) => onChange({ sort: val })}
          className="col-span-2 lg:col-span-1"
        />
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