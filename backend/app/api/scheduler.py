"""
API endpoints for scheduler settings and status.
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from ..database.session import get_db
from ..models import models
from ..services import scheduler_service
from ..services.index_universe_service import UNIVERSES
from ..services.ai_provider_service import get_available_models

router = APIRouter(prefix='/scheduler')


class SchedulerSettingsIn(BaseModel):
    id: Optional[int] = None
    user_id: str
    enabled: bool = True
    scan_time: str = '02:00'
    timezone: str = 'America/New_York'
    universe_id: Optional[str] = None
    max_tickers: Optional[int] = None
    fetch_news: bool = False
    generate_ai_summary: bool = False
    ai_provider: Optional[str] = None
    ai_model_id: Optional[str] = None


class SchedulerSettingsOut(SchedulerSettingsIn):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    next_run: Optional[str] = None
    last_run: Optional[dict] = None


@router.get('/settings')
def get_settings(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.SchedulerSetting)
    if user_id:
        q = q.filter(models.SchedulerSetting.user_id == user_id)
    rows = q.all()

    out = []
    for s in rows:
        next_run_dt = scheduler_service.get_next_run_time(s.id)
        next_run_iso = next_run_dt.isoformat() if next_run_dt else None
        # fetch most recent scheduled_scan_runs
        last = db.query(models.ScheduledScanRun).filter(models.ScheduledScanRun.scheduler_setting_id == s.id).order_by(models.ScheduledScanRun.id.desc()).first()
        last_run = None
        if last:
            last_run = {
                'id': last.id,
                'status': last.status,
                'started_at': last.started_at.isoformat() if last.started_at else None,
                'completed_at': last.completed_at.isoformat() if last.completed_at else None,
                'tickers_scanned': last.tickers_scanned,
                'error_message': last.error_message,
            }
        out.append({
            'id': s.id,
            'user_id': s.user_id,
            'enabled': bool(s.enabled),
            'scan_time': s.scan_time,
            'timezone': s.timezone,
            'universe_id': s.universe_id,
            'max_tickers': s.max_tickers,
            'fetch_news': bool(s.fetch_news),
            'generate_ai_summary': bool(s.generate_ai_summary),
            'ai_provider': s.ai_provider,
            'ai_model_id': s.ai_model_id,
            'created_at': s.created_at.isoformat() if s.created_at else None,
            'updated_at': s.updated_at.isoformat() if s.updated_at else None,
            'next_run': next_run_iso,
            'last_run': last_run,
        })
    return out


@router.post('/settings', response_model=SchedulerSettingsOut)
def save_settings(item: SchedulerSettingsIn, db: Session = Depends(get_db)):
    data = item.dict()
    # Normalize boolean->int
    data['enabled'] = 1 if data.get('enabled') else 0
    data['fetch_news'] = 1 if data.get('fetch_news') else 0
    data['generate_ai_summary'] = 1 if data.get('generate_ai_summary') else 0
    s = scheduler_service.save_scheduler_settings(db, data)
    # Return enriched single object for this setting
    settings_list = get_settings(user_id=s.user_id, db=db)
    for rec in settings_list:
        if rec['id'] == s.id:
            return rec
    # fallback
    return settings_list[0]


@router.post('/run-now')
def run_now(payload: dict = Body(...), db: Session = Depends(get_db)):
    setting_id = payload.get('setting_id')
    if not setting_id:
        raise HTTPException(status_code=400, detail='setting_id is required in body')
    s = db.query(models.SchedulerSetting).get(setting_id)
    if not s:
        raise HTTPException(status_code=404, detail='Setting not found')
    # Start job asynchronously
    from ..services import scheduler_service as ss
    try:
        res = ss.run_now(setting_id)
    except ValueError:
        raise HTTPException(status_code=404, detail='Setting not found')
    return res


@router.get('/status')
def status(db: Session = Depends(get_db)):
    running = True if scheduler_service.scheduler.running else False
    jobs = len(scheduler_service.scheduler.get_jobs())
    return {'scheduler_running': running, 'scheduled_jobs': jobs}


@router.get('/universes')
def universes():
    return UNIVERSES


@router.get('/ai/models')
def ai_models():
    return get_available_models()


@router.get('/settings/{setting_id}')
def get_setting_by_id(setting_id: int, db: Session = Depends(get_db)):
    s = db.query(models.SchedulerSetting).get(setting_id)
    if not s:
        raise HTTPException(status_code=404, detail='Setting not found')
    next_run_dt = scheduler_service.get_next_run_time(s.id)
    next_run_iso = next_run_dt.isoformat() if next_run_dt else None
    last = db.query(models.ScheduledScanRun).filter(models.ScheduledScanRun.scheduler_setting_id == s.id).order_by(models.ScheduledScanRun.id.desc()).first()
    last_run = None
    if last:
        last_run = {
            'id': last.id,
            'status': last.status,
            'started_at': last.started_at.isoformat() if last.started_at else None,
            'completed_at': last.completed_at.isoformat() if last.completed_at else None,
            'tickers_scanned': last.tickers_scanned,
            'error_message': last.error_message,
        }
    return {
        'id': s.id,
        'user_id': s.user_id,
        'enabled': bool(s.enabled),
        'scan_time': s.scan_time,
        'timezone': s.timezone,
        'universe_id': s.universe_id,
        'max_tickers': s.max_tickers,
        'fetch_news': bool(s.fetch_news),
        'generate_ai_summary': bool(s.generate_ai_summary),
        'ai_provider': s.ai_provider,
        'ai_model_id': s.ai_model_id,
        'created_at': s.created_at.isoformat() if s.created_at else None,
        'updated_at': s.updated_at.isoformat() if s.updated_at else None,
        'next_run': next_run_iso,
        'last_run': last_run,
    }


@router.get('/runs/{run_id}')
def get_run(run_id: int, db: Session = Depends(get_db)):
    r = db.query(models.ScheduledScanRun).get(run_id)
    if not r:
        raise HTTPException(status_code=404, detail='Run not found')
    return {
        'id': r.id,
        'scheduler_setting_id': r.scheduler_setting_id,
        'user_id': r.user_id,
        'universe_id': r.universe_id,
        'status': r.status,
        'started_at': r.started_at.isoformat() if r.started_at else None,
        'completed_at': r.completed_at.isoformat() if r.completed_at else None,
        'tickers_scanned': r.tickers_scanned,
        'error_message': r.error_message,
        'scan_run_id': r.scan_run_id,
        'ai_summary_id': r.ai_summary_id,
    }
