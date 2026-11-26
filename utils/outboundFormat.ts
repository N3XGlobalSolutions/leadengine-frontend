/**
 * Shared formatting for the outbound WhatsApp pages (money, tokens, time, lead status).
 */

export const formatINR = (value: number | null | undefined): string => {
  const v = Number(value || 0);
  if (v === 0) return '₹0';
  if (Math.abs(v) < 0.01) return `₹${v.toFixed(4)}`;
  if (Math.abs(v) < 100) return `₹${v.toFixed(2)}`;
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const formatUSD = (value: number | null | undefined): string => {
  const v = Number(value || 0);
  if (v === 0) return '$0';
  if (Math.abs(v) < 0.01) return `$${v.toFixed(5)}`;
  return `$${v.toFixed(2)}`;
};

export const formatTokens = (value: number | null | undefined): string => {
  const v = Number(value || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 10_000) return `${(v / 1000).toFixed(1)}K`;
  return v.toLocaleString('en-IN');
};

export const formatPercent = (value: number | null | undefined, digits = 1): string =>
  `${Number(value || 0).toFixed(digits)}%`;

export const timeAgo = (iso?: string | null): string => {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
};

export const formatDateTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const humanize = (key: string): string =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const LEAD_STATUS_META: Record<string, { label: string; light: string; dark: string }> = {
  IN_PROGRESS: { label: 'In progress', light: 'bg-blue-50 text-blue-700 border-blue-200', dark: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  QUALIFIED: { label: 'Qualified', light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  NOT_QUALIFIED: { label: 'Not qualified', light: 'bg-slate-100 text-slate-600 border-slate-200', dark: 'bg-slate-700/60 text-slate-300 border-slate-600' },
  OPTED_OUT: { label: 'Opted out', light: 'bg-red-50 text-red-700 border-red-200', dark: 'bg-red-500/15 text-red-300 border-red-500/30' },
};

export const leadStatusClass = (status: string | undefined, isDark: boolean): string => {
  const meta = LEAD_STATUS_META[status || 'IN_PROGRESS'] || LEAD_STATUS_META.IN_PROGRESS;
  return isDark ? meta.dark : meta.light;
};

export const leadStatusLabel = (status: string | undefined): string =>
  (LEAD_STATUS_META[status || 'IN_PROGRESS'] || LEAD_STATUS_META.IN_PROGRESS).label;

export const scoreColor = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return 'bg-slate-400';
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

export const TOOL_LABELS: Record<string, string> = {
  search_company_knowledge: 'Knowledge base search',
  list_products: 'List products',
  search_products: 'Search products',
  get_product_details: 'Product details',
  send_product_images: 'Sent product photos',
  send_brochure: 'Sent brochure',
  check_calendar: 'Checked calendar',
  book_meeting: 'Booked meeting',
  cancel_meeting: 'Cancelled meeting',
  reschedule_meeting: 'Rescheduled meeting',
};

export const toolLabel = (name: string): string => TOOL_LABELS[name] || humanize(name);

export const OBJECTION_LABELS: Record<string, string> = {
  PRICE: 'Price / budget',
  TIMING: 'Timing',
  TRUST: 'Trust',
  COMPETITOR: 'Competitor',
  NEED: 'No need',
  AUTHORITY: 'Needs approval',
};
