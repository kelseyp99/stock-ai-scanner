from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import routes
from .database.session import engine, Base

# Create DB tables (for dev). In production use migrations (alembic).
Base.metadata.create_all(bind=engine)

app = FastAPI(title="stock-ai-scanner")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)

# Initialize scheduler on startup if enabled
from .services import scheduler_service


@app.on_event('startup')
def startup_event():
    try:
        scheduler_service.init_scheduler(app)
    except Exception:
        # Scheduler is optional; log and continue
        import logging
        logging.exception('Failed to initialize scheduler')


@app.get('/health')
async def health():
    return {"status": "ok"}
