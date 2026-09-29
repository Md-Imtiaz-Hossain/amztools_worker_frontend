import { formatCurrency, formatPercent, formatNumber, formatDate, escapeHtml, extractUrl } from '../utils/formatters.js';
import { showToast } from '../utils/toast.js';

let modalEl = null;

export function openDetailsModal(product) {
  if (!product) return;
  if (!modalEl) {
    createModalDom();
  }
  populateDetails(product);
  modalEl.classList.add('modal-active');
}

export function closeDetailsModal() {
  if (modalEl) {
    modalEl.classList.remove('modal-active');
  }
}

function createModalDom() {
  modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';
  modalEl.id = 'product-details-modal';

  modalEl.innerHTML = `
    <div class="modal-dialog modal-xl" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-badges">
            <span class="badge badge-brand" id="det-brand"></span>
            <span class="badge badge-asin" id="det-asin"></span>
            <span class="badge badge-subtle" id="det-wholesaler"></span>
            <span class="badge badge-info" id="det-category"></span>
          </div>
          <h3 class="modal-title" id="det-title">Product Details</h3>
        </div>
        <button type="button" class="modal-close" id="det-close">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Top Financial KPI Summary Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-label">Sell Price</span>
            <span class="kpi-value" id="kpi-sell-price">-</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Cost</span>
            <span class="kpi-value" id="kpi-cost">-</span>
          </div>
          <div class="kpi-card" id="kpi-profit-card">
            <span class="kpi-label">Net Profit</span>
            <span class="kpi-value" id="kpi-profit">-</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Margin / ROI</span>
            <span class="kpi-value" id="kpi-margin-roi">-</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Sales Rank</span>
            <span class="kpi-value" id="kpi-sales-rank">-</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Est Mo Sales</span>
            <span class="kpi-value" id="kpi-est-sales">-</span>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="modal-tabs">
          <button type="button" class="tab-btn active" data-tab="tab-financials">Financials & Fees</button>
          <button type="button" class="tab-btn" data-tab="tab-specs">Specs & Dimensions</button>
          <button type="button" class="tab-btn" data-tab="tab-competition">Competition & Reviews</button>
          <button type="button" class="tab-btn" data-tab="tab-links">Links & Analysis</button>
          <button type="button" class="tab-btn" data-tab="tab-images">Images Gallery</button>
          <button type="button" class="tab-btn" data-tab="tab-raw">Raw JSON</button>
        </div>

        <!-- Tab Contents -->
        <div class="tab-content-container">
          <!-- 1. Financials & Fees -->
          <div class="tab-pane active" id="tab-financials">
            <div class="details-section-grid">
              <div class="details-card">
                <h4>Pricing & Proceeds</h4>
                <table class="details-kv-table">
                  <tr><td>Sell Price:</td><td id="det-f-sell-price"></td></tr>
                  <tr><td>Cost:</td><td id="det-f-cost"></td></tr>
                  <tr><td>Break-Even Price:</td><td id="det-f-break-even"></td></tr>
                  <tr><td>Buy Box Landed:</td><td id="det-f-buybox"></td></tr>
                  <tr><td>Lowest FBA:</td><td id="det-f-lowest-fba"></td></tr>
                  <tr><td>Lowest FBM:</td><td id="det-f-lowest-fbm"></td></tr>
                  <tr><td>Seller Proceeds:</td><td id="det-f-seller-proceeds"></td></tr>
                  <tr><td>Est Monthly Revenue:</td><td id="det-f-est-rev"></td></tr>
                </table>
              </div>
              <div class="details-card">
                <h4>Amazon & Fulfillment Fees</h4>
                <table class="details-kv-table">
                  <tr><td>Referral Fee %:</td><td id="det-f-ref-pct"></td></tr>
                  <tr><td>Referral Fee ($):</td><td id="det-f-ref-fee"></td></tr>
                  <tr><td>FBA Pick & Pack:</td><td id="det-f-fba-fee"></td></tr>
                  <tr><td>Inbound Placement Fee:</td><td id="det-f-placement-fee"></td></tr>
                  <tr><td>Fulfillment Subtotal:</td><td id="det-f-fulfillment-subtotal"></td></tr>
                  <tr><td>Cost Subtotal:</td><td id="det-f-cost-subtotal"></td></tr>
                  <tr><td>VAT % / Amount:</td><td id="det-f-vat"></td></tr>
                  <tr><td>Inbound Shipping Est:</td><td id="det-f-inbound-ship"></td></tr>
                </table>
              </div>
            </div>
          </div>

          <!-- 2. Specs & Dimensions -->
          <div class="tab-pane" id="tab-specs">
            <table class="details-kv-table wide">
              <tr><td>Product ID (UPC/EAN):</td><td id="det-s-product-id"></td></tr>
              <tr><td>Parent ASIN:</td><td id="det-s-parent-asin"></td></tr>
              <tr><td>Package Quantity:</td><td id="det-s-pack-qty"></td></tr>
              <tr><td>Dimensions:</td><td id="det-s-dimensions"></td></tr>
              <tr><td>Weight (lb):</td><td id="det-s-weight"></td></tr>
              <tr><td>Color:</td><td id="det-s-color"></td></tr>
              <tr><td>Model:</td><td id="det-s-model"></td></tr>
              <tr><td>Size:</td><td id="det-s-size"></td></tr>
              <tr><td>Part Number:</td><td id="det-s-part-number"></td></tr>
              <tr><td>Material:</td><td id="det-s-material"></td></tr>
              <tr><td>Manufacturer:</td><td id="det-s-manufacturer"></td></tr>
              <tr><td>Hazmat:</td><td id="det-s-hazmat"></td></tr>
            </table>
          </div>

          <!-- 3. Competition & Reviews -->
          <div class="tab-pane" id="tab-competition">
            <div class="details-section-grid">
              <div class="details-card">
                <h4>Offer Competition</h4>
                <table class="details-kv-table">
                  <tr><td>Total Offers:</td><td id="det-c-total-offers"></td></tr>
                  <tr><td>New FBA Offers:</td><td id="det-c-new-fba"></td></tr>
                  <tr><td>New FBM Offers:</td><td id="det-c-new-fbm"></td></tr>
                  <tr><td>Buy Box Contention:</td><td id="det-c-buybox-contention"></td></tr>
                </table>
              </div>
              <div class="details-card">
                <h4>Ratings & Customer Sentiment</h4>
                <table class="details-kv-table">
                  <tr><td>Average Rating:</td><td id="det-c-rating"></td></tr>
                  <tr><td>Total Review Count:</td><td id="det-c-review-count"></td></tr>
                  <tr><td>Category Hierarchy:</td><td id="det-c-category-full"></td></tr>
                </table>
              </div>
            </div>
            <div class="details-card mt-3">
              <h4>Customer Review Summary</h4>
              <p id="det-c-review-summary" class="details-text-box"></p>
            </div>
          </div>

          <!-- 4. Links & Analysis -->
          <div class="tab-pane" id="tab-links">
            <div class="external-links-grid">
              <a id="ext-amazon-btn" href="#" target="_blank" rel="noopener" class="btn btn-outline ext-link-card">
                <span class="ext-title">Amazon Listing ↗</span>
                <span class="ext-sub" id="ext-amazon-url"></span>
              </a>
              <a id="ext-keepa-btn" href="#" target="_blank" rel="noopener" class="btn btn-outline ext-link-card">
                <span class="ext-title">Keepa Price History ↗</span>
                <span class="ext-sub">View Historical Rank & BuyBox</span>
              </a>
              <a id="ext-camel-btn" href="#" target="_blank" rel="noopener" class="btn btn-outline ext-link-card">
                <span class="ext-title">CamelCamelCamel ↗</span>
                <span class="ext-sub">Price Tracker</span>
              </a>
            </div>

            <div class="details-card mt-3">
              <h4>Restrictions</h4>
              <table class="details-kv-table">
                <tr><td>Brand Restriction:</td><td id="det-r-brand"></td></tr>
                <tr><td>Selling Restriction:</td><td id="det-r-selling"></td></tr>
                <tr><td>Restriction Link:</td><td id="det-r-link"></td></tr>
              </table>
            </div>

            <div class="details-card mt-3">
              <h4>Custom Notes & About Item</h4>
              <div class="mb-2"><strong>Custom Notes:</strong> <span id="det-notes">-</span></div>
              <div><strong>About Item:</strong> <p id="det-about" class="details-text-box"></p></div>
            </div>
          </div>

          <!-- 5. Images Gallery -->
          <div class="tab-pane" id="tab-images">
            <div id="images-gallery-container" class="images-gallery-grid"></div>
          </div>

          <!-- 6. Raw JSON -->
          <div class="tab-pane" id="tab-raw">
            <div class="raw-json-header">
              <span>Complete 68-Column Record</span>
              <button type="button" class="btn btn-xs btn-outline" id="copy-json-btn">Copy JSON</button>
            </div>
            <pre id="raw-json-pre" class="raw-json-box"></pre>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <span class="det-timestamp" id="det-timestamp"></span>
        <button type="button" class="btn btn-secondary" id="det-close-btn">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeDetailsModal();
  });

  modalEl.querySelector('#det-close').addEventListener('click', closeDetailsModal);
  modalEl.querySelector('#det-close-btn').addEventListener('click', closeDetailsModal);

  // Tab switching
  modalEl.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modalEl.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      modalEl.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPane = modalEl.querySelector(`#${btn.dataset.tab}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  modalEl.querySelector('#copy-json-btn').addEventListener('click', () => {
    const jsonText = modalEl.querySelector('#raw-json-pre').textContent;
    navigator.clipboard.writeText(jsonText).then(() => {
      showToast('Product JSON copied to clipboard', 'info');
    });
  });
}

function populateDetails(p) {
  modalEl.querySelector('#det-brand').textContent = p.brand || 'No Brand';
  modalEl.querySelector('#det-asin').textContent = p.asin || '-';
  modalEl.querySelector('#det-wholesaler').textContent = p.wholesaler_company_name || '-';
  modalEl.querySelector('#det-category').textContent = p.category || 'General';
  modalEl.querySelector('#det-title').textContent = p.title || 'Untitled Product';

  // KPIs
  modalEl.querySelector('#kpi-sell-price').textContent = formatCurrency(p.sell_price);
  modalEl.querySelector('#kpi-cost').textContent = formatCurrency(p.cost);

  const profitNum = Number(p.profit);
  const profitEl = modalEl.querySelector('#kpi-profit');
  profitEl.textContent = formatCurrency(p.profit);
  profitEl.className = `kpi-value ${profitNum > 0 ? 'text-profit-pos' : profitNum < 0 ? 'text-profit-neg' : ''}`;

  modalEl.querySelector('#kpi-margin-roi').textContent = `${formatPercent(p.margin_pct)} / ${formatPercent(p.roi_pct)}`;
  modalEl.querySelector('#kpi-sales-rank').textContent = formatNumber(p.sales_rank);
  modalEl.querySelector('#kpi-est-sales').textContent = formatNumber(p.current_est_sales);

  // Financials & Fees
  modalEl.querySelector('#det-f-sell-price').textContent = formatCurrency(p.sell_price);
  modalEl.querySelector('#det-f-cost').textContent = formatCurrency(p.cost);
  modalEl.querySelector('#det-f-break-even').textContent = formatCurrency(p.break_even_sell_price);
  modalEl.querySelector('#det-f-buybox').textContent = formatCurrency(p.buybox_landed);
  modalEl.querySelector('#det-f-lowest-fba').textContent = formatCurrency(p.lowest_fba);
  modalEl.querySelector('#det-f-lowest-fbm').textContent = formatCurrency(p.lowest_fbm);
  modalEl.querySelector('#det-f-seller-proceeds').textContent = formatCurrency(p.seller_proceeds);
  modalEl.querySelector('#det-f-est-rev').textContent = formatCurrency(p.estimated_monthly_revenue);

  modalEl.querySelector('#det-f-ref-pct').textContent = formatPercent(p.referral_fee_pct);
  modalEl.querySelector('#det-f-ref-fee').textContent = formatCurrency(p.referral_fee);
  modalEl.querySelector('#det-f-fba-fee').textContent = formatCurrency(p.fba_pick_pack_fee);
  modalEl.querySelector('#det-f-placement-fee').textContent = formatCurrency(p.inbound_placement_fee);
  modalEl.querySelector('#det-f-fulfillment-subtotal').textContent = formatCurrency(p.fulfillment_subtotal);
  modalEl.querySelector('#det-f-cost-subtotal').textContent = formatCurrency(p.cost_subtotal);
  modalEl.querySelector('#det-f-vat').textContent = `${formatPercent(p.vat_pct)} (${formatCurrency(p.vat_amount)})`;
  modalEl.querySelector('#det-f-inbound-ship').textContent = formatCurrency(p.inbound_shipping_estimate);

  // Specs
  modalEl.querySelector('#det-s-product-id').textContent = p.product_id || '-';
  modalEl.querySelector('#det-s-parent-asin').textContent = p.parent_asin || '-';
  modalEl.querySelector('#det-s-pack-qty').textContent = formatNumber(p.package_quantity);
  modalEl.querySelector('#det-s-dimensions').textContent = p.package_dimensions || '-';
  modalEl.querySelector('#det-s-weight').textContent = p.package_weight_lb ? `${p.package_weight_lb} lbs` : '-';
  modalEl.querySelector('#det-s-color').textContent = p.color || '-';
  modalEl.querySelector('#det-s-model').textContent = p.model || '-';
  modalEl.querySelector('#det-s-size').textContent = p.size || '-';
  modalEl.querySelector('#det-s-part-number').textContent = p.part_number || '-';
  modalEl.querySelector('#det-s-material').textContent = p.material || '-';
  modalEl.querySelector('#det-s-manufacturer').textContent = p.manufacturer || '-';
  modalEl.querySelector('#det-s-hazmat').textContent = p.is_hazmat || 'No';

  // Competition
  modalEl.querySelector('#det-c-total-offers').textContent = formatNumber(p.total_offers);
  modalEl.querySelector('#det-c-new-fba').textContent = formatNumber(p.new_fba_offers);
  modalEl.querySelector('#det-c-new-fbm').textContent = formatNumber(p.new_fbm_offers);
  modalEl.querySelector('#det-c-buybox-contention').textContent = formatNumber(p.buybox_contention);
  modalEl.querySelector('#det-c-rating').textContent = p.average_rating ? `★ ${p.average_rating} / 5` : '-';
  modalEl.querySelector('#det-c-review-count').textContent = formatNumber(p.total_review_count);
  modalEl.querySelector('#det-c-category-full').textContent = `${p.category || '-'} > ${p.sub_category || '-'} (Rank: ${formatNumber(p.sub_category_sales_rank)})`;
  modalEl.querySelector('#det-c-review-summary').textContent = p.customer_reviews || 'No customer reviews available.';

  // Links
  const rawAmazon = extractUrl(p.amazon_link);
  const amazonUrl = rawAmazon || (p.asin ? `https://www.amazon.com/dp/${p.asin}` : '#');
  const extAmazon = modalEl.querySelector('#ext-amazon-btn');
  extAmazon.href = amazonUrl;
  modalEl.querySelector('#ext-amazon-url').textContent = amazonUrl;

  const rawKeepa = extractUrl(p.keepa);
  const keepaUrl = rawKeepa || (p.asin ? `https://keepa.com/#!product/1-${p.asin}` : '#');
  modalEl.querySelector('#ext-keepa-btn').href = keepaUrl;

  const rawCamel = extractUrl(p.camelcc);
  const camelUrl = rawCamel || (p.asin ? `https://camelcamelcamel.com/search?sq=${p.asin}` : '#');
  modalEl.querySelector('#ext-camel-btn').href = camelUrl;

  modalEl.querySelector('#det-r-brand').textContent = p.brand_restriction || 'None';
  modalEl.querySelector('#det-r-selling').textContent = p.selling_restriction || 'None';
  const restrictionUrl = extractUrl(p.selling_restriction_link);
  modalEl.querySelector('#det-r-link').innerHTML = restrictionUrl
    ? `<a href="${escapeHtml(restrictionUrl)}" target="_blank" rel="noopener">Check Restriction Link ↗</a>`
    : 'None';

  modalEl.querySelector('#det-notes').textContent = p.custom_notes || 'No custom notes.';
  modalEl.querySelector('#det-about').textContent = p.about_this_item || 'No item description available.';

  // Gallery
  const gallery = modalEl.querySelector('#images-gallery-container');
  gallery.innerHTML = '';
  const images = [
    p.product_image_link_1,
    p.product_image_link_2,
    p.product_image_link_3,
    p.product_image_link_4,
    p.product_image_link_5
  ].filter(url => url && String(url).trim() !== '');

  if (images.length === 0) {
    gallery.innerHTML = '<p class="text-muted">No product images recorded for this ASIN.</p>';
  } else {
    images.forEach((imgUrl, i) => {
      const card = document.createElement('div');
      card.className = 'gallery-img-card';
      card.innerHTML = `
        <a href="${escapeHtml(imgUrl)}" target="_blank" rel="noopener">
          <img src="${escapeHtml(imgUrl)}" alt="Product Image ${i + 1}" loading="lazy" />
        </a>
        <span class="gallery-img-label">Image ${i + 1}</span>
      `;
      gallery.appendChild(card);
    });
  }

  // Raw JSON
  modalEl.querySelector('#raw-json-pre').textContent = JSON.stringify(p, null, 2);

  // Timestamps
  modalEl.querySelector('#det-timestamp').textContent = `Created: ${formatDate(p.created_at)} | Updated: ${formatDate(p.updated_at)} | Last Run: ${p.last_run || '-'}`;
}
