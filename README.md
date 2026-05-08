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
