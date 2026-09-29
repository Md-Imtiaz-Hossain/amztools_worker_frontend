import { Api } from '../api.js';
import { ALL_COLUMNS, NUMERIC_COLUMNS } from '../columns.js';
import { showToast } from '../utils/toast.js';

let modalEl = null;
let currentEditId = null;
let onSaveCallback = null;

export function openCreateModal(onSave) {
  currentEditId = null;
  onSaveCallback = onSave;
  if (!modalEl) {
    createModalDom();
  }
  resetForm();
  modalEl.querySelector('#form-modal-title').textContent = 'Create New Wholesale Product';
  modalEl.querySelector('#form-submit-btn').textContent = 'Save Product';
  modalEl.classList.add('modal-active');
  modalEl.querySelector('#inp-asin').focus();
}

export function openEditModal(product, onSave) {
  if (!product) return;
  currentEditId = product.id;
  onSaveCallback = onSave;
  if (!modalEl) {
    createModalDom();
  }
  resetForm();
  populateForm(product);
  modalEl.querySelector('#form-modal-title').textContent = `Update Product: ${product.asin || 'ID ' + product.id}`;
  modalEl.querySelector('#form-submit-btn').textContent = 'Update Product';
  modalEl.classList.add('modal-active');
}

export function closeCreateEditModal() {
  if (modalEl) {
    modalEl.classList.remove('modal-active');
  }
}

function createModalDom() {
  modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';
  modalEl.id = 'create-edit-modal';

  modalEl.innerHTML = `
    <div class="modal-dialog modal-lg" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3 class="modal-title" id="form-modal-title">Wholesale Product Form</h3>
        <button type="button" class="modal-close" id="form-modal-close">&times;</button>
      </div>

      <form id="product-crud-form">
        <div class="modal-body">
          <div id="form-error-banner" class="form-error-banner"></div>

          <!-- Form Tab Buttons -->
          <div class="modal-tabs">
            <button type="button" class="tab-btn active" data-ftab="ftab-basic">Basic & Identity *</button>
            <button type="button" class="tab-btn" data-ftab="ftab-financials">Financials & Pricing</button>
            <button type="button" class="tab-btn" data-ftab="ftab-fees">Fees Breakdown</button>
            <button type="button" class="tab-btn" data-ftab="ftab-specs">Specs & Competition</button>
            <button type="button" class="tab-btn" data-ftab="ftab-links">Links & Notes</button>
          </div>

          <!-- Tab 1: Basic -->
          <div class="tab-pane active" id="ftab-basic">
            <div class="form-grid-2">
              <div class="form-group">
                <label for="inp-asin">ASIN <span class="text-danger">*</span></label>
                <input type="text" id="inp-asin" name="asin" class="form-control" placeholder="e.g. B08N5WRWNW" required />
              </div>
              <div class="form-group">
                <label for="inp-wholesaler_company_name">Wholesaler Company Name <span class="text-danger">*</span></label>
                <input type="text" id="inp-wholesaler_company_name" name="wholesaler_company_name" class="form-control" placeholder="e.g. Acme Wholesale Supplies" required />
              </div>
            </div>

            <div class="form-group">
              <label for="inp-title">Product Title</label>
              <input type="text" id="inp-title" name="title" class="form-control" placeholder="Full Amazon listing title" />
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label for="inp-brand">Brand</label>
                <input type="text" id="inp-brand" name="brand" class="form-control" placeholder="e.g. Sony" />
              </div>
              <div class="form-group">
                <label for="inp-category">Category</label>
                <input type="text" id="inp-category" name="category" class="form-control" placeholder="e.g. Electronics" />
              </div>
              <div class="form-group">
                <label for="inp-product_id">Product ID (UPC/EAN)</label>
                <input type="text" id="inp-product_id" name="product_id" class="form-control" placeholder="e.g. 019425205688" />
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label for="inp-parent_asin">Parent ASIN</label>
                <input type="text" id="inp-parent_asin" name="parent_asin" class="form-control" placeholder="Parent ASIN if variation" />
              </div>
              <div class="form-group">
                <label for="inp-package_quantity">Package Quantity</label>
                <input type="number" id="inp-package_quantity" name="package_quantity" class="form-control" placeholder="1" />
              </div>
              <div class="form-group">
                <label for="inp-favorite">Favorite (1 = Yes, 0 = No)</label>
                <select id="inp-favorite" name="favorite" class="form-control">
                  <option value="0">No</option>
                  <option value="1">★ Yes</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Tab 2: Financials -->
          <div class="tab-pane" id="ftab-financials">
            <div class="form-grid-3">
              <div class="form-group">
                <label for="inp-cost">Wholesale Cost ($)</label>
                <input type="number" step="0.01" id="inp-cost" name="cost" class="form-control" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label for="inp-sell_price">Sell Price / BuyBox ($)</label>
                <input type="number" step="0.01" id="inp-sell_price" name="sell_price" class="form-control" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label for="inp-profit">Net Profit ($)</label>
                <input type="number" step="0.01" id="inp-profit" name="profit" class="form-control" placeholder="0.00" />
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label for="inp-margin_pct">Margin %</label>
                <input type="number" step="0.01" id="inp-margin_pct" name="margin_pct" class="form-control" placeholder="0.0" />
              </div>
              <div class="form-group">
                <label for="inp-roi_pct">ROI %</label>
                <input type="number" step="0.01" id="inp-roi_pct" name="roi_pct" class="form-control" placeholder="0.0" />
              </div>
              <div class="form-group">
                <label for="inp-sales_rank">Sales Rank (BSR)</label>
                <input type="number" id="inp-sales_rank" name="sales_rank" class="form-control" placeholder="e.g. 5200" />
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label for="inp-current_est_sales">Est Monthly Units Sold</label>
                <input type="number" id="inp-current_est_sales" name="current_est_sales" class="form-control" placeholder="e.g. 350" />
              </div>
              <div class="form-group">
                <label for="inp-estimated_monthly_revenue">Est Monthly Revenue ($)</label>
                <input type="number" step="0.01" id="inp-estimated_monthly_revenue" name="estimated_monthly_revenue" class="form-control" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label for="inp-break_even_sell_price">Break Even Price ($)</label>
                <input type="number" step="0.01" id="inp-break_even_sell_price" name="break_even_sell_price" class="form-control" placeholder="0.00" />
              </div>
            </div>
          </div>

          <!-- Tab 3: Fees Breakdown -->
          <div class="tab-pane" id="ftab-fees">
            <div class="form-grid-3">
              <div class="form-group">
                <label for="inp-referral_fee_pct">Referral Fee %</label>
                <input type="number" step="0.1" id="inp-referral_fee_pct" name="referral_fee_pct" class="form-control" placeholder="15.0" />
              </div>
              <div class="form-group">
                <label for="inp-referral_fee">Referral Fee ($)</label>
                <input type="number" step="0.01" id="inp-referral_fee" name="referral_fee" class="form-control" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label for="inp-fba_pick_pack_fee">FBA Pick & Pack ($)</label>
                <input type="number" step="0.01" id="inp-fba_pick_pack_fee" name="fba_pick_pack_fee" class="form-control" placeholder="0.00" />
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label for="inp-inbound_placement_fee">Inbound Placement Fee ($)</label>
                <input type="number" step="0.01" id="inp-inbound_placement_fee" name="inbound_placement_fee" class="form-control" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label for="inp-inbound_shipping_estimate">Inbound Shipping Est ($)</label>
                <input type="number" step="0.01" id="inp-inbound_shipping_estimate" name="inbound_shipping_estimate" class="form-control" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label for="inp-cost_subtotal">Cost Subtotal ($)</label>
                <input type="number" step="0.01" id="inp-cost_subtotal" name="cost_subtotal" class="form-control" placeholder="0.00" />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label for="inp-vat_pct">VAT %</label>
                <input type="number" step="0.1" id="inp-vat_pct" name="vat_pct" class="form-control" placeholder="0.0" />
              </div>
              <div class="form-group">
                <label for="inp-vat_amount">VAT Amount ($)</label>
                <input type="number" step="0.01" id="inp-vat_amount" name="vat_amount" class="form-control" placeholder="0.00" />
              </div>
            </div>
          </div>

          <!-- Tab 4: Specs & Competition -->
          <div class="tab-pane" id="ftab-specs">
            <div class="form-grid-3">
              <div class="form-group">
                <label for="inp-package_dimensions">Dimensions</label>
                <input type="text" id="inp-package_dimensions" name="package_dimensions" class="form-control" placeholder="e.g. 10 x 5 x 2 in" />
              </div>
              <div class="form-group">
                <label for="inp-package_weight_lb">Weight (lb)</label>
                <input type="number" step="0.01" id="inp-package_weight_lb" name="package_weight_lb" class="form-control" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label for="inp-color">Color</label>
                <input type="text" id="inp-color" name="color" class="form-control" placeholder="e.g. Black" />
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label for="inp-model">Model</label>
                <input type="text" id="inp-model" name="model" class="form-control" placeholder="Model" />
              </div>
              <div class="form-group">
                <label for="inp-size">Size</label>
                <input type="text" id="inp-size" name="size" class="form-control" placeholder="Size" />
              </div>
              <div class="form-group">
                <label for="inp-part_number">Part Number</label>
                <input type="text" id="inp-part_number" name="part_number" class="form-control" placeholder="MPN" />
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label for="inp-total_offers">Total Offers</label>
                <input type="number" id="inp-total_offers" name="total_offers" class="form-control" placeholder="0" />
              </div>
              <div class="form-group">
                <label for="inp-average_rating">Average Rating (1-5)</label>
                <input type="number" step="0.1" id="inp-average_rating" name="average_rating" class="form-control" placeholder="4.5" />
              </div>
              <div class="form-group">
                <label for="inp-total_review_count">Total Reviews</label>
                <input type="number" id="inp-total_review_count" name="total_review_count" class="form-control" placeholder="0" />
              </div>
            </div>
          </div>

          <!-- Tab 5: Links & Notes -->
          <div class="tab-pane" id="ftab-links">
            <div class="form-group">
              <label for="inp-amazon_link">Amazon Product Link</label>
              <input type="url" id="inp-amazon_link" name="amazon_link" class="form-control" placeholder="https://www.amazon.com/dp/..." />
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label for="inp-keepa">Keepa Chart Link</label>
                <input type="url" id="inp-keepa" name="keepa" class="form-control" placeholder="https://keepa.com/#!product/..." />
              </div>
              <div class="form-group">
                <label for="inp-camelcc">CamelCamelCamel Link</label>
                <input type="url" id="inp-camelcc" name="camelcc" class="form-control" placeholder="https://camelcamelcamel.com/..." />
              </div>
            </div>

            <div class="form-group">
              <label for="inp-product_image_link_1">Product Image Link 1</label>
              <input type="url" id="inp-product_image_link_1" name="product_image_link_1" class="form-control" placeholder="https://m.media-amazon.com/images/..." />
            </div>

            <div class="form-group">
              <label for="inp-custom_notes">Custom Notes</label>
              <textarea id="inp-custom_notes" name="custom_notes" rows="2" class="form-control" placeholder="Supplier terms, lead times, MOQ, notes..."></textarea>
            </div>

            <div class="form-group">
              <label for="inp-about_this_item">About This Item</label>
              <textarea id="inp-about_this_item" name="about_this_item" rows="2" class="form-control" placeholder="Item bullet points from Amazon"></textarea>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="form-cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary" id="form-submit-btn">Save Product</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modalEl);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeCreateEditModal();
  });

  modalEl.querySelector('#form-modal-close').addEventListener('click', closeCreateEditModal);
  modalEl.querySelector('#form-cancel-btn').addEventListener('click', closeCreateEditModal);

  // Tab switching
  modalEl.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modalEl.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      modalEl.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPane = modalEl.querySelector(`#${btn.dataset.ftab}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Profit calculation helper on price/cost change
  const costInput = modalEl.querySelector('#inp-cost');
  const sellPriceInput = modalEl.querySelector('#inp-sell_price');
  const profitInput = modalEl.querySelector('#inp-profit');
  const marginInput = modalEl.querySelector('#inp-margin_pct');
  const roiInput = modalEl.querySelector('#inp-roi_pct');

  const updateCalculatedProfit = () => {
    const cost = parseFloat(costInput.value);
    const sell = parseFloat(sellPriceInput.value);
    if (!isNaN(cost) && !isNaN(sell) && sell > 0) {
      const approxFee = sell * 0.15; // standard ~15% referral fee estimation
      const estProfit = Math.round((sell - cost - approxFee) * 100) / 100;
      if (!profitInput.value) profitInput.value = estProfit;
      if (!marginInput.value) marginInput.value = ((estProfit / sell) * 100).toFixed(1);
      if (!roiInput.value && cost > 0) roiInput.value = ((estProfit / cost) * 100).toFixed(1);
    }
  };

  costInput.addEventListener('change', updateCalculatedProfit);
  sellPriceInput.addEventListener('change', updateCalculatedProfit);

  // Form submission
  const form = modalEl.querySelector('#product-crud-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = modalEl.querySelector('#form-error-banner');
    const submitBtn = modalEl.querySelector('#form-submit-btn');

    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    const formData = new FormData(form);
    const payload = {};

    for (const [key, value] of formData.entries()) {
      if (value !== '') {
        if (NUMERIC_COLUMNS.includes(key)) {
          payload[key] = Number(value);
        } else {
          payload[key] = value;
        }
      }
    }

    try {
      let res;
      if (currentEditId) {
        res = await Api.updateProduct(currentEditId, payload);
      } else {
        res = await Api.createProduct(payload);
      }

      if (res && res.success) {
        showToast(res.message || 'Product saved successfully!', 'success');
        closeCreateEditModal();
        if (typeof onSaveCallback === 'function') {
          onSaveCallback();
        }
      } else {
        errorEl.textContent = (res && res.error) || 'Failed to save product. Please check required fields.';
      }
    } catch (err) {
      errorEl.textContent = 'Network or server error while saving product';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = currentEditId ? 'Update Product' : 'Save Product';
    }
  });
}

function resetForm() {
  const form = modalEl.querySelector('#product-crud-form');
  form.reset();
  modalEl.querySelector('#form-error-banner').textContent = '';
  // Activate first tab
  modalEl.querySelectorAll('.tab-btn').forEach((b, idx) => {
    if (idx === 0) b.classList.add('active');
    else b.classList.remove('active');
  });
  modalEl.querySelectorAll('.tab-pane').forEach((p, idx) => {
    if (idx === 0) p.classList.add('active');
    else p.classList.remove('active');
  });
}

function populateForm(product) {
  for (const [key, value] of Object.entries(product)) {
    const input = modalEl.querySelector(`[name="${key}"]`);
    if (input) {
      input.value = (value === null || value === undefined) ? '' : value;
    }
  }
}
