# stock-ai-scanner

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
