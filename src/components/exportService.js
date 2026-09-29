import { showToast } from '../utils/toast.js';

/**
 * Export selected products to CSV or JSON
 */
export function downloadSelectedData(selectedProducts, format = 'csv') {
  if (!selectedProducts || selectedProducts.length === 0) {
    showToast('Before downloading, you must check the checkbox for the data rows you want to export.', 'warning');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `wholesale_products_export_${timestamp}.${format}`;

  if (format === 'json') {
    const jsonStr = JSON.stringify(selectedProducts, null, 2);
    downloadBlob(jsonStr, 'application/json', filename);
  } else {
    // CSV format
    const keys = Object.keys(selectedProducts[0]);
    const headerRow = keys.map(k => `"${k.replace(/"/g, '""')}"`).join(',');

    const dataRows = selectedProducts.map(row => {
      return keys.map(k => {
        const val = row[k];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
    downloadBlob(csvContent, 'text/csv;charset=utf-8;', filename);
  }

  showToast(`Successfully downloaded ${selectedProducts.length} product(s) as ${format.toUpperCase()}`, 'success');
}

function downloadBlob(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
