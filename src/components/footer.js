import { getApiBaseUrl } from '../config.js';

/**
 * Professional App Footer Component
 */
export function renderFooter(containerEl) {
  if (!containerEl) return;

  const apiUrl = getApiBaseUrl();
  const docsUrl = `${apiUrl}/docs`;

  containerEl.innerHTML = `
    <footer class="app-footer">
      <div class="footer-container">
        <div class="footer-top">
          <div class="footer-brand">
            <span class="footer-logo">⚡</span>
            <span class="footer-title">AMZ Tools Wholesale Intelligence</span>
            <span class="footer-badge">Cloudflare D1 & Workers</span>
          </div>

          <div class="footer-links">
            <a href="${docsUrl}" target="_blank" rel="noopener" class="footer-link">📖 Swagger API Docs</a>
            <span class="footer-sep">•</span>
            <a href="${apiUrl}/openapi.json" target="_blank" rel="noopener" class="footer-link">🧾 OpenAPI Spec</a>
            <span class="footer-sep">•</span>
            <a href="#" id="footer-api-settings-link" class="footer-link">⚙ Worker Settings</a>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="footer-copyright">
            &copy; 2026 AMZ Tools Wholesale Catalog. Built for High-Performance Product Research and Profit Analysis.
          </p>
          <div class="footer-status-pill">
            <span class="status-dot status-online"></span>
            <span>Cloudflare D1 Database Active</span>
          </div>
        </div>
      </div>
    </footer>
  `;

  const settingsLink = containerEl.querySelector('#footer-api-settings-link');
  if (settingsLink) {
    settingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      const statusBtn = document.getElementById('api-status-btn');
      if (statusBtn) statusBtn.click();
    });
  }
}
