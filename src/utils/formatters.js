/**
 * Data Formatters for Financial & Catalog Table Analysis
 */

export function formatCurrency(val) {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function formatPercent(val) {
  if (val === null || val === undefined || val === '') return '-';
  let num = Number(val);
  if (isNaN(num)) return '-';
  // If decimal fraction (e.g. 0.7282), display as 72.8%
  if (Math.abs(num) > 0 && Math.abs(num) <= 1) {
    num = num * 100;
  }
  return `${num.toFixed(1)}%`;
}

export function formatNumber(val) {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(val) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return String(val);
  }
}

export function extractUrl(str) {
  if (!str) return '';
  const s = String(str).trim();
  // Extract URL from =HYPERLINK("https://...", "...")
  const match = s.match(/=HYPERLINK\("([^"]+)"/i);
  if (match && match[1]) return match[1];
  return s;
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function truncate(str, maxLen = 45) {
  if (!str) return '-';
  const s = String(str);
  if (s.length <= maxLen) return s;
  return s.substring(0, maxLen) + '...';
}
