export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** Formats a YYYY-MM-DD date without shifting it across time zones. */
export function formatDate(date: string | null): string {
  return date ? dateFmt.format(new Date(`${date}T00:00:00Z`)) : '—';
}
