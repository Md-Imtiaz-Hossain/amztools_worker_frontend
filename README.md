# AMZ Tools - Wholesale Products Frontend (SPA)

Single-Page Web Application designed specifically for wholesale product catalog data analysis, profit calculation, and inventory decisions.

---

## Key Features

1. **Single-Page Application (SPA) with Modular Architecture**:
   - Organized into clean, maintainable ES modules (`src/components/`, `src/utils/`, `src/columns.js`, `src/api.js`, `src/auth.js`).
2. **Session & Authentication**:
   - Sign in via modal using hardcoded credentials (`admin` / `password123`).
   - Session token saved in `localStorage` for **1 week (7 days)** with automatic expiry handling.
   - **Auth-Gated Actions**: Without logging in, the `+ Create Product` button and row `Actions` column (Edit / Delete) are automatically hidden for clean read-only catalog browsing.
3. **Data Analysis Table**:
   - **Pagination**: 50, 100, 150 items per page.
   - **Global Search**: Instant search matching across ASIN, Title, Brand, Wholesaler, UPC, and Category.
   - **Search Button on Every Column**: Each column header has a dedicated `🔍` button allowing exact or substring filters, plus range filtering (`min` / `max`) for numeric and financial columns.
   - **Column Settings**: Choose which of the 67 columns to display, with quick presets (Basic, Financials Only, All 67). Preferences are remembered in `localStorage`.
   - **Row Click Details Modal**: Clicking any row opens a comprehensive multi-tab inspector displaying all 67 fields, KPI financial cards, Amazon fee breakdowns, ratings, image gallery, and links to Amazon, Keepa, and CamelCamelCamel.
   - **Download Checked Rows**: Select individual rows or "Select All on Page" using checkboxes to export selected data as CSV or JSON. If no rows are checked, an alert warns the user before download.
   - **Create & Edit Popups**: Tabbed modal forms with auto-calculation of profit, margin %, and ROI % on price/cost change.

---

## File Structure

```
amztools_worker_frontend/
├── index.html                  # Main SPA HTML shell
├── index.css                   # High-density data table & modal stylesheet
├── index.js                    # Central application coordinator & state management
├── package.json
└── src/
    ├── config.js               # API URL configuration & storage keys
    ├── api.js                  # Fetch API client with Bearer auth headers
    ├── auth.js                 # 1-week session persistence & event subscriptions
    ├── columns.js              # Complete 67-column definitions & formatters
    ├── utils/
    │   ├── formatters.js       # Currency, percent, number, date formatters
    │   └── toast.js            # Toast notification banners
    └── components/
        ├── navbar.js           # Header, API status indicator, login/logout buttons
        ├── tableToolbar.js     # Top controls: search, per-page, column settings, download
        ├── table.js            # Data table with sorting, column search buttons, row click
        ├── columnSettingsModal.js # Column picker dialog (67 columns)
        ├── columnSearchModal.js   # Per-column search and filter modal
        ├── detailsModal.js     # Comprehensive multi-tab product detail popup
        ├── createEditModal.js  # Create & update form popup with validation
        ├── loginModal.js       # Sign in dialog
        └── exportService.js    # CSV & JSON exporter for checked items
```

---

## Quickstart

### Start Local Web Server
```bash
python3 -m http.server 3000
# Open http://localhost:3000 in your browser
```

### Connect to Worker API
By default, the frontend connects to `http://127.0.0.1:8787`. You can change the backend URL at any time by clicking the **Worker API** indicator in the top navbar.
