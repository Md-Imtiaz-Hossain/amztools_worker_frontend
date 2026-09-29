/**
 * Welcome & Hero Section Component
 */

let isCollapsed = false;

export function renderWelcomeSection(containerEl, state) {
  if (!containerEl) return;

  const totalCount = state.total ? state.total.toLocaleString() : '50+';

  containerEl.innerHTML = `
    <section class="welcome-section ${isCollapsed ? 'welcome-collapsed' : ''}" id="welcome-section">
      <div class="welcome-container">
        <div class="welcome-header">
          <div class="welcome-title-group">
            <div class="welcome-badge">🚀 Wholesale Intelligence Suite</div>
            <h1 class="welcome-title">AMZ Tools Wholesale Product Analytics</h1>
            <p class="welcome-subtitle">
              High-speed catalog research, real-time Amazon profit & ROI calculations, and D1 database inventory management.
            </p>
          </div>

          <button type="button" class="btn btn-xs btn-outline btn-welcome-toggle" id="btn-toggle-welcome" title="Collapse or expand welcome banner">
            ${isCollapsed ? 'Show Banner ▾' : 'Hide Banner ▴'}
          </button>
        </div>

        ${!isCollapsed ? `
          <div class="welcome-stats-grid">
            <div class="welcome-stat-card">
              <span class="stat-icon">📦</span>
              <div class="stat-info">
                <span class="stat-value">${totalCount}</span>
                <span class="stat-label">Products Analyzed</span>
              </div>
            </div>

            <div class="welcome-stat-card">
              <span class="stat-icon">💰</span>
              <div class="stat-info">
                <span class="stat-value">67 Columns</span>
                <span class="stat-label">Financials, Fees & Metrics</span>
              </div>
            </div>

            <div class="welcome-stat-card">
              <span class="stat-icon">🔍</span>
              <div class="stat-info">
                <span class="stat-value">Inline Filtering</span>
                <span class="stat-label">Header Search & Range Filters</span>
              </div>
            </div>

            <div class="welcome-stat-card">
              <span class="stat-icon">📊</span>
              <div class="stat-info">
                <span class="stat-value">Excel & CSV</span>
                <span class="stat-label">Checked Rows Export</span>
              </div>
            </div>
          </div>

          <div class="welcome-tip-bar">
            <span class="tip-icon">💡</span>
            <span class="tip-text"><strong>Quick Tip:</strong> Use the inline search box in each column header to filter directly (e.g. <code>>50</code> or <code>10-50</code> for numbers). Drag column edges to resize them.</span>
          </div>
        ` : ''}
      </div>
    </section>
  `;

  const toggleBtn = containerEl.querySelector('#btn-toggle-welcome');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      renderWelcomeSection(containerEl, state);
    });
  }
}
