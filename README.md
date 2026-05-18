# ThetaForge — Stock & Options Scanner Dashboard

A professional-grade stock and options scanning dashboard for swing traders and options traders. Scans S&P 500, Nasdaq 100, and Russell 2000 nightly and surfaces the most actionable setups with institutional-quality narratives, risk profiles, and options interpretation.

---

## 🚀 Features

- **Multi-universe scanning** — S&P 500, Nasdaq 100, Russell 2000 (~2,600 tickers)
- **Diversity-aware ranking** — guaranteed slots for Oversold, Squeeze, Breakout, Dividend, and News Catalyst setups
- **ATR% volatility tiers** — Low / Moderate / High / Extreme with heat coloring
- **Expected Move** — IV-based or ATR fallback daily move estimate
- **Action Zones** — Buy Zone, Chase Zone, Danger Zone per ticker
- **Risk Profile Engine** — Conservative Income / Momentum Growth / Speculative / etc.
- **Trade Type Engine** — Momentum Swing / Covered Call Income / Breakout Trade / Mean Reversion / etc.
- **Volatility Compression Detection** — 🌀 Squeeze Setup when ATR contracts
- **News Catalyst Scoring** — real-time headline scoring boosts ranking (+4 to -4)
- **Weighted Scoring** — bullish + risk + composite + percentile rank (Elite / Strong / Good)
- **Richer MA Distance labels** — Neutral → Slightly Extended → Extended → Very Extended → 🔥 Euphoric → 🚀 Parabolic
- **Options Interpretation** — directional bias, volatility environment, strategy rationale per ticker
- **Watchlist** — star any ticker, persists to localStorage (Firebase-ready for multi-device sync)
- **TradingView charts** — embedded interactive chart per ticker card (on demand)
- **News tab** — live news fetched per ticker from yfinance
- **Institutional narratives** — plain-English explanation for every metric and setup
- **Tooltips on all metrics** — label tooltip (what is this?) + value tooltip (what does this number mean?)
- **Filter tabs** — Momentum / Oversold / Mean Reversion / Vol Squeeze / Dividend / High Vol / Low Vol / Elite Score
- **Sortable columns** — sort by any metric
- **Firebase hosting** — static frontend deployed to Firebase

---

## 🗂 Project Structure

```
stock-ai-scanner/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py          # FastAPI routes incl. /scan/latest, /scan/ingest, /news/{ticker}
│   │   ├── services/
│   │   │   ├── scanner.py         # Core scan engine — ATR, scoring, trade type, risk, compression
│   │   │   ├── news_service.py    # yfinance news fetcher + DB cache
│   │   │   ├── news_signal_service.py  # Headline keyword scorer → news_boost
│   │   │   └── scheduler_service.py   # APScheduler nightly scan scheduler
│   │   ├── indicators/
│   │   │   └── indicators.py      # RSI, MA, ATR, volume ratio calculations
│   │   └── main.py                # FastAPI app entry point
│   └── tests/
│       └── test_scanner_calculations.py  # 43 unit tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── StockTable.tsx     # Main scanner UI — cards, tooltips, filters, chart, news
│   │   ├── context/
│   │   │   └── WatchlistContext.tsx  # Global watchlist state + localStorage persistence
│   │   └── pages/
│   │       ├── Dashboard.tsx      # Main page — fetches /scan/latest
│   │       ├── Watchlist.tsx      # Watchlist page — renders saved tickers as full cards
│   │       └── Admin.tsx          # Scheduler admin UI
│   └── public/
│       ├── favicon.ico            # Tab favicon
│       ├── ThetaBrew.png          # Header logo
│       └── logo.png               # Legacy logo
├── scripts/
│   └── run_scan_now.py            # CLI scanner — supports --full, --top N, --callback-url
├── data/
│   └── russell2000.csv            # Russell 2000 ticker list (auto-downloaded)
├── scan_results_latest.json       # Latest scan output (served by /scan/latest)
└── .env                           # Environment variables
```

---

## ⚙️ Setup

### Requirements
- Python 3.11+
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # set SCAN_INGEST_TOKEN, DATABASE_URL
uvicorn app.main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set VITE_API_URL=http://localhost:8001
npm run dev -- --port 5180
```

---

## 🔍 Running a Scan

### Quick scan (50 tickers/universe, ~3 min)
```bash
.venv/bin/python scripts/run_scan_now.py
```

### Full scan (all ~2,600 tickers, ~25 min)
```bash
.venv/bin/python scripts/run_scan_now.py --full
```

### Hetzner nightly scan → FastAPI ingest → static Firebase deploy
Run the scanner on Hetzner and POST the finished payload back to FastAPI. Add
`?deploy_static=1` to queue the static Firebase deploy after ingest succeeds.

```bash
SCAN_INGEST_TOKEN=... .venv/bin/python scripts/run_scan_now.py \
  --full \
  --universes sp500 nasdaq100 russell2000 \
  --workers 20 \
  --top 25 \
  --callback-url https://your-fastapi-host/scan/ingest?deploy_static=1
```

FastAPI writes `scan_results_latest.json`, then runs:
```bash
.venv/bin/python scripts/deploy_static_firebase.py
```

Deploy logs are appended to `static_deploy_latest.log`.

### Fundamental filters
The scanner enriches each ticker with fundamental/event context and folds it
into score, risk, setup quality, analysis text, and options strategy selection.

Supported fields:
- `next_earnings_date`, `days_to_earnings`, `earnings_window`
- `institutional_ownership_delta_pct`, `institutional_ownership_trend`
- `institutional_13f_latest_period`, `institutional_13f_value_delta`, `institutional_13f_top_managers`
- `gov_trade_signal`, `gov_trade_net_amount_90d`, `gov_trade_members`
- `dividend_yield_percent`

Optional environment variables:
```bash
ALPHAVANTAGE_API_KEY=...                       # upcoming earnings calendar
INSTITUTIONAL_OWNERSHIP_CHANGES_FILE=...       # JSON map built from 13F snapshots
GOVERNMENT_TRADES_FILE=...                     # JSON map built from STOCK Act / official disclosures
FUNDAMENTALS_CACHE_TTL_HOURS=24
GOVERNMENT_TRADES_CACHE_TTL_HOURS=6
```

Example institutional ownership JSON:
```json
{
  "AAPL": {
    "institutional_ownership_delta_pct": 2.7,
    "institutional_ownership_trend": "Accumulation",
    "institutional_13f_latest_period": "2025-12-31",
    "institutional_13f_value_delta": 10000000000,
    "institutional_13f_top_managers": ["Berkshire Hathaway"],
    "source": "sec_13f_qoq"
  },
  "TSLA": {
    "institutional_ownership_delta_pct": -3.4,
    "source": "sec_13f_qoq"
  }
}
```

#### Build institutional signals from 13F data

13F filings are delayed up to 45 days, so the scanner treats them as
confirmation/context rather than a required pick filter. When configured, 13F
activity can lightly affect score, populate the `13F` filter, reserve a couple
of diversity slots, and appear on the dashboard's `13F` page.

Normalize extracted 13F holdings rows:
```bash
.venv/bin/python scripts/ingest_13f_filings.py \
  --input data/13f_holdings_input.example.csv \
  --output data/institutional_ownership_changes.json
```

For SEC information-table XML, provide a CUSIP map because official 13F tables
generally include CUSIP, not ticker:
```bash
.venv/bin/python scripts/ingest_13f_filings.py \
  --info-table-xml /path/to/form13fInfoTable.xml \
  --cusip-map data/cusip_ticker_map.csv \
  --manager "Example Manager" \
  --output data/institutional_ownership_changes.json
```

Then point the scanner at the output:
```bash
INSTITUTIONAL_OWNERSHIP_CHANGES_FILE=/opt/stock-ai-scanner/data/institutional_ownership_changes.json
```

Fetch recent SEC 13F-HR filings directly before a scan:
```bash
cp data/sec_13f_managers.example.csv data/sec_13f_managers.csv
cp data/cusip_ticker_map.example.csv data/cusip_ticker_map.csv

SEC_USER_AGENT="ThetaBrew stock scanner contact=you@example.com" \
.venv/bin/python scripts/fetch_sec_13f_filings.py \
  --manager-file data/sec_13f_managers.csv \
  --cusip-map data/cusip_ticker_map.csv \
  --output data/institutional_ownership_changes.json
```

`scripts/run_local_scan_static_deploy.py` now runs that SEC 13F fetch before
the stock scan whenever both `data/sec_13f_managers.csv` and
`data/cusip_ticker_map.csv` exist. Use `--skip-13f-fetch` to bypass it. The
manager file chooses which institutional filers to track; the CUSIP map controls
which holdings can be mapped back to tickers.

Example government trades JSON:
```json
{
  "NVDA": {
    "gov_trade_buy_count_90d": 4,
    "gov_trade_sell_count_90d": 1,
    "gov_trade_net_amount_90d": 185000,
    "gov_trade_latest_trade_date": "2026-05-01",
    "gov_trade_latest_disclosure_date": "2026-05-12",
    "gov_trade_members": ["Jane Doe", "John Smith"],
    "gov_trade_signal": "Government Cluster Buy",
    "source": "stock_act_provider"
  },
  "AAPL": [
    {
      "member": "Jane Doe",
      "transaction_type": "Purchase",
      "amount_midpoint": 15000,
      "trade_date": "2026-05-01",
      "disclosure_date": "2026-05-12"
    }
  ]
}
```

Notes:
- Earnings dates use Alpha Vantage when configured, with yfinance calendar as
  a fallback.
- Dividend yield is pulled from the existing ticker fundamentals and normalized
  into percent form.
- Institutional ownership changes should come from a separate 13F ingestion job
  or a paid normalized 13F provider, then be written to the JSON file above.
- Government trade signals should come from a separate STOCK Act disclosure
  ingestion job or provider such as Quiver/Capitol Trades/Signal Congress. The
  scanner weights this lightly because disclosures can lag the actual trade.

#### Build government trades from public disclosures
Official no-cost sources:
- House Clerk Financial Disclosure Reports:
  `https://disclosures-clerk.house.gov/FinancialDisclosure/ViewReport`
- House search/PTR PDFs:
  `https://disclosures-clerk.house.gov/FinancialDisclosure/ViewSearch`
- Senate eFD public search:
  `https://efdsearch.senate.gov/search/home/`

The official sources are free, but they are not clean ticker APIs. House provides
bulk yearly metadata and PTR PDFs; Senate provides public eFD search results and
filing pages. Extract rows into a CSV/JSON using columns like:
`ticker`, `member`, `chamber`, `transaction_type`, `amount_range`,
`trade_date`, `disclosure_date`, `asset`, `source_url`.

Normalize those rows into the scanner format:
```bash
.venv/bin/python scripts/ingest_government_trades.py \
  --input data/government_trades_input.example.csv \
  --output data/government_trades.json
```

The `Congress` page reads this same output and shows which officials bought or
sold each ticker, including member names, estimated amounts, trade dates,
disclosure dates, and source links when present. The scanner weights this
lightly because STOCK Act disclosures are delayed.

Discover House PTR PDFs from the official yearly bulk ZIP:
```bash
.venv/bin/python scripts/ingest_government_trades.py \
  --download-house-metadata 2026 \
  --house-review-csv data/government_disclosure_sources/house_2026_ptr_review.csv
```

Then set:
```bash
GOVERNMENT_TRADES_FILE=/opt/stock-ai-scanner/data/government_trades.json
```

### Custom options
```bash
.venv/bin/python scripts/run_scan_now.py \
  --universes sp500 nasdaq100 \
  --max 100 \
  --top 50 \
  --callback-url https://your-tunnel.trycloudflare.com/scan/ingest
```

### ETF scanner

ETFs use the same technical scanner engine as stocks, but run as a separate
nightly job and write `etf_results_latest.json`. The static Firebase deploy
automatically includes that file when present, and the frontend shows it on the
`ETFs` page with ETF-aware options strategy notes.

```bash
.venv/bin/python scripts/run_etf_scan.py --workers 8 --top 20
```

The local nightly wrapper now runs stocks, ETFs, crypto, static build, and
Firebase deploy by default:
```bash
.venv/bin/python scripts/run_local_scan_static_deploy.py
```

The default ETF universe lives at `data/etf_universe.json`; add or remove ETFs
there without touching scanner code.

### Crypto scanner

Large-cap crypto analysis runs as a separate nightly snapshot using CoinGecko
market data and writes `crypto_results_latest.json`. The static Firebase deploy
automatically includes that file when present, and the frontend shows it on the
`Crypto` page with market cap rank, momentum windows, volume intensity, ATH
distance, and position strategy notes.

```bash
.venv/bin/python scripts/run_crypto_scan.py --limit 30 --top 20
```

The same local nightly wrapper includes crypto by default. For a temporary
stock/ETF-only run, pass `--skip-crypto`.
```bash
.venv/bin/python scripts/run_local_scan_static_deploy.py --skip-crypto
```

The scanner works without a key against CoinGecko's public endpoint, but it also
uses `COINGECKO_API_KEY` or `CG_API_KEY` from the environment when present.

### Re-flagged opportunities scanner

The re-flag scanner revisits previously notable candidates and looks for
rule-based Fibonacci pullbacks, oversold reversals, and bearish exhaustion
setups. It writes `reflag_results_latest.json`, which is included in the static
Firebase payload when present.

```bash
.venv/bin/python scripts/run_reflag_scan.py --seed-history --limit 250
```

The normal local nightly wrapper runs this after stocks, ETFs, and crypto. Use
`--skip-reflags` for a faster one-off deploy. Use `--persist-reflags` if you
want Fib levels and technical alerts saved to MySQL.

### Options
| Flag | Default | Description |
|---|---|---|
| `--full` | off | Scan all tickers in all 3 universes |
| `--universes` | sp500 nasdaq100 russell2000 | Which universes to scan |
| `--max` | 50 | Max tickers per universe (ignored with --full) |
| `--top` | 25 | How many results to save to JSON |
| `--workers` | 8 | Parallel threads (reduce if Yahoo rate-limits) |
| `--callback-url` | none | POST results to a remote FastAPI /scan/ingest endpoint |

---

## 🌐 Deploy to Firebase (Static Frontend)

> The frontend must be built as a static site before deploying.

```bash
# 1. Build the static frontend
cd frontend
npm run build

# 2. Deploy to Firebase Hosting
firebase deploy --only hosting --project thetaforge-35430
```

The `firebase.json` is already configured to serve from `frontend/dist` and rewrite all routes to `index.html` for SPA routing.

Live URL: **https://thetaforge-35430.web.app**

---

## 🔐 Google Auth

The frontend uses Firebase Authentication with Google sign-in. The app will still build if Firebase is not configured, but the header will show an inactive `Auth setup` button until the Vite Firebase values are present.

1. In Firebase Console, open the project, go to **Authentication → Sign-in method**, and enable **Google**.
2. Go to **Project settings → General → Your apps** and create or open the Web app.
3. Copy the Web app config into `frontend/.env.local` for local dev, and into `frontend/.env.demo` for the static Firebase-hosted build.
4. Add these authorized domains in **Authentication → Settings → Authorized domains**:
   - `localhost`
   - `thetaforge-35430.web.app`
   - any custom ThetaForge domain you serve from

Required frontend env values:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Firebase web config values are public client config, not server secrets. Keep service-account keys out of the frontend.

---

## 🔌 API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/scan/latest` | Returns latest scan results (deduped, normalised) |
| `POST` | `/scan/ingest` | Accepts scan payload from remote worker (bearer token auth) |
| `GET` | `/scan/etfs/latest` | Returns latest ETF scan results |
| `GET` | `/scan/crypto/latest` | Returns latest large-cap crypto scan results |
| `GET` | `/scan/reflags/latest` | Returns latest re-flagged opportunities scan |
| `GET` | `/news/{ticker}` | Fetches recent news headlines for a ticker |
| `GET` | `/scheduler/settings` | Returns current scheduler configuration |
| `POST` | `/scheduler/settings` | Save scheduler settings + register cron job |
| `GET` | `/health` | Health check |

---

## 🧪 Running Tests

```bash
.venv/bin/python -m pytest backend/tests/test_scanner_calculations.py -v
```

43 tests covering: ATR%, expected move, MA distance, action zones, extension classification, pullback detection, percentile scoring, trade type engine, volatility compression.

---

## 📅 Nightly Scheduler

The backend uses APScheduler to run scans on a cron schedule (Mon–Fri only).

Configure via the **Admin** tab in the dashboard UI, or via the API:

```bash
curl -X POST http://localhost:8001/scheduler/settings \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "scan_time": "02:00", "universes": ["sp500", "nasdaq100"], "weekdays_only": true}'
```

To keep the Mac awake overnight for scheduled scans:
```bash
caffeinate -s uvicorn app.main:app --port 8001
```

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite or Postgres connection string |
| `SCAN_INGEST_TOKEN` | Bearer token for `POST /scan/ingest` |
| `VITE_API_URL` | Frontend API base URL (set in `frontend/.env.local`) |
| `VITE_FIREBASE_*` | Firebase web app config used by Google sign-in |

---

## 🛣 Roadmap

- [ ] Google Auth + Firebase Firestore for cross-device watchlist sync
- [ ] Hetzner Docker worker — remote nightly scanner posting results via `/scan/ingest`
- [ ] Cloudflare Tunnel — expose MacBook FastAPI to internet without port forwarding
- [ ] DataImpulse proxy rotation for Yahoo Finance rate-limit bypass
- [ ] Failed ticker retry queue with proxy fallback
- [ ] Sparkline mini charts in scanner cards
- [ ] PWA manifest for mobile install
- [ ] Market regime detection (Risk-On / Defensive / Vol Expansion)
- [ ] OpenAI/OpenRouter AI narrative generation per ticker

---

## 📸 Screenshot

> Dashboard showing top-ranked stocks with ATR%, action zones, trade type, confidence meter, and expandable TradingView chart + news tabs.

---

## 👤 Author

ThetaForge — built with FastAPI, React, TypeScript, yfinance, TradingView widgets, and Firebase.

Full-stack starter project for a stock scanning dashboard.

Structure:
- backend: FastAPI service that scans stocks and stores results in MySQL.
- frontend: Vite + React + TypeScript + Tailwind dashboard that calls the backend.

Local development:
- Copy `.env.example` to `.env` in `backend/` and fill in values.
- Start MySQL and backend (see Docker section) or run backend locally:
  - python -m venv .venv
  - source .venv/bin/activate
  - pip install -r backend/requirements.txt
  - uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

Frontend:
- cd frontend
- npm install
- npm run dev

Docker (recommended):
- docker compose up --build

Roadmap:
- Integrate Ollama/OpenAI to generate AI summaries of scan results.
- Add scheduled scan runner (Celery or a cron container).
- Add user-specific scan settings and cloud sync.

Comments:
- Authentication is handled by Firebase (client-side). Scan results and history are stored in MySQL.

## Static Firebase demo deployment

To build a static demo of the frontend for Firebase Hosting (uses static demo data):

1. Build demo bundle

```bash
cd frontend
npm install
npm run build:demo
```

2. Initialize Firebase Hosting (if you haven't already)

```bash
cd ..
firebase login
firebase init hosting
# when prompted, choose the 'frontend/dist' directory as the public folder
# choose Single Page App: Yes
# do NOT overwrite firebase.json if it already exists unless you want to replace it
```

3. Deploy

```bash
firebase deploy --only hosting
```

Notes:
- The demo build reads `VITE_DEMO_MODE=true` from `.env.demo` and uses local static JSON data.
- The demo site will not call your live backend and will display a static scan and summary.

---

## ThetaForge / stock-ai-scanner — Quick developer notes

This section contains the minimal information you need to work on the frontend/demo and scheduler for the ThetaForge (stock-ai-scanner) project.

- Frontend: Vite + React + TypeScript + Tailwind. Demo mode uses static demo data from `frontend/src/data/demoScanResults.ts`.
- Dev server: runs on port 5178 by convention (`npm run dev -- --host --port 5178`).
- Demo build: `vite build --mode demo` (script `npm run build:demo` in `frontend/`).
- Hosting: Firebase Hosting points at `frontend/dist` (see `firebase.json`).
- Admin scheduler: frontend writes schedule documents to Firestore collection `scan_schedules`. Backend reads that collection at midnight and performs scans.

### Firestore schedule document example (collection: `scan_schedules`)
- `indexes`: string[] (e.g. `['SP500','NASDAQ100']`)
- `time`: string (HH:MM, 24-hour)
- `timezone`: string (IANA timezone id, e.g. `America/New_York`)
- `enabled`: boolean
- `createdBy`, `updatedAt` (serverTimestamp)

### Key frontend files
- `frontend/src/App.tsx` — main shell, header, banner import and routes.
- `frontend/src/components/Banner.tsx` — sticky sponsor/banner component.
- `frontend/src/components/StockTable.tsx` — table rendering with sticky column headers and a tooltip lookup for company names.
- `frontend/src/pages/Dashboard.tsx` — dashboard sections and usage of `StockTable`.
- `frontend/src/pages/AdminScheduler.tsx` — admin UI that writes schedules to Firestore.
- `frontend/src/data/demoScanResults.ts` — demo data used when `VITE_DEMO_MODE=true`.

### Common commands
- Commit & push to `develop`:
  - `git add <files> && git commit -m "msg" && git push origin develop`
- Run demo build + firebase deploy (from repo root):
  - `cd frontend && npm run build:demo && cd .. && firebase deploy --only hosting --project thetaforge-35430 --message "demo deploy"`

### Notes
- Adjust `paddingTop` in `frontend/src/App.tsx` if the top of the logo is clipped.
- Sticky table header: each table wrapper uses an internal overflow + maxHeight so `<thead>` can be sticky reliably.
- Opening VS Code in the repo is safe; files change only when you edit or extensions auto-save.
