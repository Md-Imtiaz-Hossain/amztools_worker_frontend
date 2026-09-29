import { showToast } from '../utils/toast.js';

/**
 * Export selected products to Excel (.xls), CSV, or JSON
 */
export function downloadSelectedData(selectedProducts, format = 'excel') {
  if (!selectedProducts || selectedProducts.length === 0) {
    showToast('Before downloading, you must check the checkbox for the data rows you want to export.', 'warning');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  if (format === 'json') {
    const filename = `wholesale_products_export_${timestamp}.json`;
    const jsonStr = JSON.stringify(selectedProducts, null, 2);
    downloadBlob(jsonStr, 'application/json', filename);
  } else if (format === 'excel') {
    const filename = `wholesale_products_export_${timestamp}.xls`;
    const excelXml = generateExcelXml(selectedProducts);
    downloadBlob(excelXml, 'application/vnd.ms-excel;charset=utf-8', filename);
  } else {
    // CSV format
    const filename = `wholesale_products_export_${timestamp}.csv`;
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

/**
 * Generates an Excel 2003 XML spreadsheet (native Excel compatibility)
 */
function generateExcelXml(data) {
  if (!data || data.length === 0) return '';
  const keys = Object.keys(data[0]);

  let rowsXml = '';

  // Header row
  rowsXml += '   <Row ss:StyleID="HeaderStyle">\n';
  for (const k of keys) {
    rowsXml += `    <Cell><Data ss:Type="String">${escapeXml(k)}</Data></Cell>\n`;
  }
  rowsXml += '   </Row>\n';

  // Data rows
  for (const row of data) {
    rowsXml += '   <Row>\n';
    for (const k of keys) {
      const val = row[k];
      if (val === null || val === undefined || val === '') {
        rowsXml += '    <Cell><Data ss:Type="String"></Data></Cell>\n';
      } else if (typeof val === 'number') {
        rowsXml += `    <Cell><Data ss:Type="Number">${val}</Data></Cell>\n`;
      } else if (!isNaN(Number(val)) && typeof val === 'string' && val.trim() !== '' && !val.startsWith('0') && !val.startsWith('=')) {
        rowsXml += `    <Cell><Data ss:Type="Number">${val}</Data></Cell>\n`;
      } else {
        rowsXml += `    <Cell><Data ss:Type="String">${escapeXml(String(val))}</Data></Cell>\n`;
      }
    }
    rowsXml += '   </Row>\n';
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Wholesale Products">
  <Table>
${rowsXml}  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <Selected/>
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
