import { STORAGE_KEYS } from './config.js';
import { formatCurrency, formatPercent, formatNumber, formatDate, truncate, escapeHtml } from './utils/formatters.js';

export const ALL_COLUMNS = [
  // Basic & Identity
  { key: 'asin', label: 'ASIN', type: 'text', category: 'Basic', defaultVisible: true, sortable: true },
  { key: 'title', label: 'Title', type: 'text', category: 'Basic', defaultVisible: true, sortable: true },
  { key: 'brand', label: 'Brand', type: 'text', category: 'Basic', defaultVisible: true, sortable: true },
  { key: 'wholesaler_company_name', label: 'Wholesaler', type: 'text', category: 'Basic', defaultVisible: true, sortable: true },
  { key: 'category', label: 'Category', type: 'text', category: 'Basic', defaultVisible: true, sortable: true },
  { key: 'sales_rank', label: 'Sales Rank', type: 'number', category: 'Metrics', defaultVisible: true, sortable: true },
  
  // Financials
  { key: 'cost', label: 'Cost', type: 'currency', category: 'Financials', defaultVisible: true, sortable: true },
  { key: 'sell_price', label: 'Sell Price', type: 'currency', category: 'Financials', defaultVisible: true, sortable: true },
  { key: 'profit', label: 'Profit', type: 'currency', category: 'Financials', defaultVisible: true, sortable: true },
  { key: 'margin_pct', label: 'Margin %', type: 'percent', category: 'Financials', defaultVisible: true, sortable: true },
  { key: 'roi_pct', label: 'ROI %', type: 'percent', category: 'Financials', defaultVisible: true, sortable: true },
  { key: 'current_est_sales', label: 'Est Sales', type: 'number', category: 'Metrics', defaultVisible: true, sortable: true },
  
  // Secondary Key Fields
  { key: 'id', label: 'ID', type: 'number', category: 'System', defaultVisible: false, sortable: true },
  { key: 'parent_asin', label: 'Parent ASIN', type: 'text', category: 'Basic', defaultVisible: false, sortable: true },
  { key: 'product_id', label: 'Product ID (UPC)', type: 'text', category: 'Basic', defaultVisible: false, sortable: true },
  { key: 'favorite', label: 'Favorite', type: 'boolean', category: 'Basic', defaultVisible: false, sortable: true },
  { key: 'package_quantity', label: 'Pack Qty', type: 'number', category: 'Basic', defaultVisible: false, sortable: true },
  { key: 'amazon_link', label: 'Amazon Link', type: 'link', category: 'Links', defaultVisible: false, sortable: false },
  
  // Hierarchy
  { key: 'is_top_level_category', label: 'Top Level Cat', type: 'text', category: 'Categorization', defaultVisible: false, sortable: true },
  { key: 'sub_category', label: 'Sub Category', type: 'text', category: 'Categorization', defaultVisible: false, sortable: true },
  { key: 'sub_category_sales_rank', label: 'Sub Cat Rank', type: 'number', category: 'Categorization', defaultVisible: false, sortable: true },
  
  // Financial Details
  { key: 'break_even_sell_price', label: 'Break Even ($)', type: 'currency', category: 'Financials', defaultVisible: false, sortable: true },
  { key: 'buybox_landed', label: 'Buy Box Landed ($)', type: 'currency', category: 'Financials', defaultVisible: false, sortable: true },
  { key: 'lowest_fba', label: 'Lowest FBA ($)', type: 'currency', category: 'Financials', defaultVisible: false, sortable: true },
  { key: 'lowest_fbm', label: 'Lowest FBM ($)', type: 'currency', category: 'Financials', defaultVisible: false, sortable: true },
  { key: 'seller_proceeds', label: 'Seller Proceeds ($)', type: 'currency', category: 'Financials', defaultVisible: false, sortable: true },
  { key: 'estimated_monthly_revenue', label: 'Est Mo Revenue ($)', type: 'currency', category: 'Financials', defaultVisible: false, sortable: true },
  
  // Fees Breakdown
  { key: 'referral_fee_pct', label: 'Referral Fee %', type: 'percent', category: 'Fees', defaultVisible: false, sortable: true },
  { key: 'referral_fee', label: 'Referral Fee ($)', type: 'currency', category: 'Fees', defaultVisible: false, sortable: true },
  { key: 'fba_pick_pack_fee', label: 'FBA Pick/Pack ($)', type: 'currency', category: 'Fees', defaultVisible: false, sortable: true },
  { key: 'inbound_placement_fee', label: 'Placement Fee ($)', type: 'currency', category: 'Fees', defaultVisible: false, sortable: true },
  { key: 'fulfillment_subtotal', label: 'Fulfillment Total ($)', type: 'currency', category: 'Fees', defaultVisible: false, sortable: true },
  { key: 'cost_subtotal', label: 'Cost Total ($)', type: 'currency', category: 'Fees', defaultVisible: false, sortable: true },
  { key: 'vat_pct', label: 'VAT %', type: 'percent', category: 'Fees', defaultVisible: false, sortable: true },
  { key: 'vat_amount', label: 'VAT ($)', type: 'currency', category: 'Fees', defaultVisible: false, sortable: true },
  { key: 'inbound_shipping_estimate', label: 'Inbound Ship ($)', type: 'currency', category: 'Fees', defaultVisible: false, sortable: true },
  
  // Dimensions & Specs
  { key: 'package_dimensions', label: 'Dimensions', type: 'text', category: 'Dimensions', defaultVisible: false, sortable: true },
  { key: 'package_weight_lb', label: 'Weight (lb)', type: 'number', category: 'Dimensions', defaultVisible: false, sortable: true },
  { key: 'color', label: 'Color', type: 'text', category: 'Attributes', defaultVisible: false, sortable: true },
  { key: 'model', label: 'Model', type: 'text', category: 'Attributes', defaultVisible: false, sortable: true },
  { key: 'size', label: 'Size', type: 'text', category: 'Attributes', defaultVisible: false, sortable: true },
  { key: 'part_number', label: 'Part #', type: 'text', category: 'Attributes', defaultVisible: false, sortable: true },
  { key: 'material', label: 'Material', type: 'text', category: 'Attributes', defaultVisible: false, sortable: true },
  { key: 'manufacturer', label: 'Manufacturer', type: 'text', category: 'Attributes', defaultVisible: false, sortable: true },
  
  // Competition & Ratings
  { key: 'total_offers', label: 'Total Offers', type: 'number', category: 'Competition', defaultVisible: false, sortable: true },
  { key: 'new_fba_offers', label: 'New FBA Offers', type: 'number', category: 'Competition', defaultVisible: false, sortable: true },
  { key: 'new_fbm_offers', label: 'New FBM Offers', type: 'number', category: 'Competition', defaultVisible: false, sortable: true },
  { key: 'buybox_contention', label: 'Buy Box Contention', type: 'number', category: 'Competition', defaultVisible: false, sortable: true },
  { key: 'average_rating', label: 'Rating', type: 'number', category: 'Ratings', defaultVisible: false, sortable: true },
  { key: 'total_review_count', label: 'Reviews', type: 'number', category: 'Ratings', defaultVisible: false, sortable: true },
  { key: 'customer_reviews', label: 'Review Summary', type: 'text', category: 'Ratings', defaultVisible: false, sortable: false },
  
  // Restrictions
  { key: 'brand_restriction', label: 'Brand Restriction', type: 'text', category: 'Restrictions', defaultVisible: false, sortable: true },
  { key: 'selling_restriction', label: 'Selling Restriction', type: 'text', category: 'Restrictions', defaultVisible: false, sortable: true },
  { key: 'selling_restriction_link', label: 'Restriction Link', type: 'link', category: 'Restrictions', defaultVisible: false, sortable: false },
  { key: 'is_hazmat', label: 'Hazmat', type: 'text', category: 'Restrictions', defaultVisible: false, sortable: true },
  
  // External Tools
  { key: 'keepa', label: 'Keepa', type: 'link', category: 'External Tools', defaultVisible: false, sortable: false },
  { key: 'camelcc', label: 'CamelCamelCamel', type: 'link', category: 'External Tools', defaultVisible: false, sortable: false },
  { key: 'custom_notes', label: 'Notes', type: 'text', category: 'Notes', defaultVisible: false, sortable: true },
  { key: 'about_this_item', label: 'About Item', type: 'text', category: 'Details', defaultVisible: false, sortable: false },
  
  // Images
  { key: 'product_image_link_1', label: 'Image 1', type: 'image', category: 'Images', defaultVisible: false, sortable: false },
  { key: 'product_image_link_2', label: 'Image 2', type: 'image', category: 'Images', defaultVisible: false, sortable: false },
  { key: 'product_image_link_3', label: 'Image 3', type: 'image', category: 'Images', defaultVisible: false, sortable: false },
  { key: 'product_image_link_4', label: 'Image 4', type: 'image', category: 'Images', defaultVisible: false, sortable: false },
  { key: 'product_image_link_5', label: 'Image 5', type: 'image', category: 'Images', defaultVisible: false, sortable: false },
  
  // Timestamps
  { key: 'last_run', label: 'Last Run', type: 'text', category: 'System', defaultVisible: false, sortable: true },
  { key: 'created_at', label: 'Created At', type: 'date', category: 'System', defaultVisible: false, sortable: true },
  { key: 'updated_at', label: 'Updated At', type: 'date', category: 'System', defaultVisible: false, sortable: true }
];

export const COLUMN_MAP = new Map(ALL_COLUMNS.map(c => [c.key, c]));

/**
 * Get active visible column keys from localStorage or fallback to defaults
 */
export function getVisibleColumnKeys() {
  if (typeof localStorage === 'undefined') {
    return ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key);
  }
  const saved = localStorage.getItem(STORAGE_KEYS.VISIBLE_COLUMNS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(key => COLUMN_MAP.has(key));
      }
    } catch (e) {
      console.warn('Failed to parse visible columns from storage', e);
    }
  }
  return ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key);
}

/**
 * Save active visible column keys
 */
export function setVisibleColumnKeys(keys) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.VISIBLE_COLUMNS, JSON.stringify(keys));
  }
}

/**
 * Render cell content based on column definition
 */
export function renderCellContent(col, value, row) {
  if (value === null || value === undefined || value === '') {
    return `<span class="cell-empty">-</span>`;
  }

  switch (col.type) {
    case 'currency': {
      const num = Number(value);
      let colorClass = '';
      if (col.key === 'profit') {
        colorClass = num > 0 ? 'text-profit-pos' : num < 0 ? 'text-profit-neg' : '';
      }
      return `<span class="num-cell ${colorClass}">${formatCurrency(value)}</span>`;
    }
    case 'percent': {
      const num = Number(value);
      let colorClass = '';
      if (col.key === 'roi_pct' || col.key === 'margin_pct') {
        colorClass = num > 20 ? 'text-profit-pos font-bold' : num < 0 ? 'text-profit-neg' : '';
      }
      return `<span class="num-cell ${colorClass}">${formatPercent(value)}</span>`;
    }
    case 'number': {
      return `<span class="num-cell">${formatNumber(value)}</span>`;
    }
    case 'boolean': {
      const isTrue = value === 1 || value === true || value === '1';
      return isTrue
        ? `<span class="badge badge-success">★ Yes</span>`
        : `<span class="badge badge-subtle">No</span>`;
    }
    case 'date': {
      return `<span class="date-cell" title="${escapeHtml(value)}">${formatDate(value)}</span>`;
    }
    case 'link': {
      const url = String(value);
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="tbl-link" onclick="event.stopPropagation()">Link ↗</a>`;
    }
    case 'image': {
      return `<img src="${escapeHtml(value)}" alt="thumb" class="tbl-thumb" loading="lazy" onclick="event.stopPropagation()" onerror="this.style.display='none'"/>`;
    }
    default: {
      if (col.key === 'asin') {
        return `<span class="asin-badge" title="${escapeHtml(value)}">${escapeHtml(value)}</span>`;
      }
      return `<span class="text-cell" title="${escapeHtml(value)}">${escapeHtml(truncate(value, 40))}</span>`;
    }
  }
}
