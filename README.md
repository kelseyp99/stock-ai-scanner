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
