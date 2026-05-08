from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api import routes
from backend.app.database.session import engine, Base

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

@app.get('/health')
async def health():
    return {"status": "ok"}
