"""
scheduler_service.py

Loads scheduler settings from DB and schedules APScheduler jobs.
Provides functions to save/load settings and to run scheduled scans.
"""

import logging
from datetime import datetime, time, timedelta
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session

from ..core.config import settings
from ..database.session import get_db, engine
from ..models import models
from ..services.ai_provider_service import generate_market_summary
from ..services.index_universe_service import get_universe_tickers
from ..services.news_service import get_news_for_tickers
from ..services.scanner import scan_ticker

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="UTC")
# Track running jobs per user to avoid concurrency
_running_users: dict[str, bool] = {}
_current_running_count = 0


def _to_cron_time(scan_time: str, tz: str, weekdays_only: bool = True) -> CronTrigger:
    """Convert HH:MM string and timezone into a CronTrigger.
    When weekdays_only=True the job runs Mon-Fri only (skips Sat/Sun)."""
    hh, mm = (scan_time or '02:00').split(':')
    dow = 'mon-fri' if weekdays_only else '*'
    return CronTrigger(hour=int(hh), minute=int(mm), day_of_week=dow, timezone=tz)


def _resolve_universe_ids(s: models.SchedulerSetting) -> list[str]:
    """Return the list of universe IDs to scan for a setting.
    Prefers the new universe_ids JSON field; falls back to the legacy universe_id string."""
    import json
    if s.universe_ids:
        try:
            ids = json.loads(s.universe_ids)
            if ids:
                return ids
        except Exception:
            pass
    if s.universe_id:
        return [s.universe_id]
    return []


def _is_market_day() -> bool:
    """Return True if today is Monday-Friday (US market weekday)."""
    return datetime.utcnow().weekday() < 5  # 0=Mon … 4=Fri


def load_scheduler_settings(db: Session):
    settings = db.query(models.SchedulerSetting).filter(models.SchedulerSetting.enabled == 1).all()
    for s in settings:
        try:
            schedule_user_scan(s, db)
        except Exception as e:
            logger.exception('Failed to schedule setting %s: %s', s.id, e)


def save_scheduler_settings(db: Session, setting_data: dict) -> models.SchedulerSetting:
    """Insert or update a scheduler setting row."""
    uid = setting_data.get('id')
    if uid:
        s = db.query(models.SchedulerSetting).get(uid)
        if not s:
            raise ValueError('Setting not found')
    else:
        s = models.SchedulerSetting()
    for k, v in setting_data.items():
        if hasattr(s, k):
            setattr(s, k, v)
    db.add(s)
    db.commit()
    db.refresh(s)
    # Reschedule
    try:
        reschedule_user_scan(s, db)
    except Exception:
        logger.exception('reschedule failed')
    return s


def schedule_user_scan(s: models.SchedulerSetting, db: Session):
    """Schedule a job for the scheduler setting. Allows multiple runs per user if multiple settings exist."""
    job_id = f'scheduler_{s.id}'
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)

    weekdays_only = bool(s.weekdays_only) if s.weekdays_only is not None else True
    trigger = _to_cron_time(s.scan_time, s.timezone, weekdays_only)
    scheduler.add_job(lambda: run_scheduled_scan(s.id), trigger, id=job_id, replace_existing=True)
    days_label = 'Mon-Fri' if weekdays_only else 'daily'
    logger.info('Scheduled job %s at %s %s (%s)', job_id, s.scan_time, s.timezone, days_label)


def reschedule_user_scan(s: models.SchedulerSetting, db: Session):
    schedule_user_scan(s, db)


def get_next_run_time(setting_id: int):
    job = scheduler.get_job(f'scheduler_{setting_id}')
    if not job:
        return None
    return getattr(job, 'next_run_time', None)


def _acquire_user_lock(user_id: str) -> bool:
    if not user_id:
        return True
    if _running_users.get(user_id):
        return False
    _running_users[user_id] = True
    return True


def _release_user_lock(user_id: str):
    if not user_id:
        return
    _running_users.pop(user_id, None)


def _scan_parallel(tickers: list[str], debug: bool = False, max_workers: int = 10) -> list:
    """Scan tickers in parallel using a thread pool (local helper).
    Returns list of scan result dicts (filters out None).
    """
    results = []
    from concurrent.futures import ThreadPoolExecutor, as_completed
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(scan_ticker, t, 120, debug): t for t in tickers}
        for future in as_completed(futures):
            try:
                r = future.result()
                if r:
                    results.append(r)
            except Exception:
                logger.exception('scan job failed for %s', futures[future])
    return results


def _sort_results(results: list) -> list:
    """Sort by score desc, then volume_ratio desc, then volatility desc."""
    return sorted(
        results,
        key=lambda r: (
            -(r.get('score') or 0),
            -(r.get('volume_ratio') or 0),
            -(r.get('volatility') or 0),
        )
    )


def run_scheduled_scan(setting_id: int, scheduled_run_id: Optional[int] = None):
    global _current_running_count
    if settings.max_concurrent_scheduled_scans and _current_running_count >= settings.max_concurrent_scheduled_scans:
        logger.info('Max concurrent scheduled scans reached (%s); skipping run %s', settings.max_concurrent_scheduled_scans, setting_id)
        return
    _current_running_count += 1
    try:
        db = next(get_db())
        s = db.query(models.SchedulerSetting).get(setting_id)
        if not s:
            logger.error('Scheduled setting %s not found', setting_id)
            return

        if s.user_id and not _acquire_user_lock(s.user_id):
            logger.info('Scan for user %s already running; skipping', s.user_id)
            return

        # Use existing ScheduledScanRun if provided, otherwise create a new one
        if scheduled_run_id:
            run = db.query(models.ScheduledScanRun).get(scheduled_run_id)
            if not run:
                logger.error('ScheduledScanRun %s not found', scheduled_run_id)
                # fallback to creating a new one
                run = models.ScheduledScanRun(
                    scheduler_setting_id=s.id,
                    user_id=s.user_id,
                    universe_id=s.universe_id,
                    status='running',
                    started_at=datetime.utcnow(),
                )
                db.add(run)
                db.commit()
                db.refresh(run)
            else:
                run.status = 'running'
                run.started_at = datetime.utcnow()
                db.add(run)
                db.commit()
                db.refresh(run)
        else:
            run = models.ScheduledScanRun(
                scheduler_setting_id=s.id,
                user_id=s.user_id,
                universe_id=s.universe_id,
                status='running',
                started_at=datetime.utcnow(),
            )
            db.add(run)
            db.commit()
            db.refresh(run)

        try:
            # Determine tickers — support multiple universes
            universe_ids = _resolve_universe_ids(s)
            tickers_seen: set[str] = set()
            tickers: list[str] = []
            for uid in universe_ids:
                try:
                    for t in get_universe_tickers(uid, db):
                        if t not in tickers_seen:
                            tickers_seen.add(t)
                            tickers.append(t)
                except Exception as e:
                    logger.warning('Failed to fetch universe %s: %s', uid, e)

            # Weekend guard — extra safety net even when cron is configured correctly
            weekdays_only = bool(s.weekdays_only) if s.weekdays_only is not None else True
            if weekdays_only and not _is_market_day():
                logger.info('Skipping scan for setting %s — weekdays_only=True and today is a weekend', s.id)
                run.status = 'skipped'
                run.completed_at = datetime.utcnow()
                run.error_message = 'Skipped: weekdays_only is enabled and today is a weekend'
                db.add(run)
                db.commit()
                _release_user_lock(s.user_id)
                return

            if s.max_tickers:
                tickers = tickers[: s.max_tickers]

            results = _sort_results(_scan_parallel(tickers))

            # Create a ScanRun and associate results
            scan_run = models.ScanRun()
            db.add(scan_run)
            db.commit()
            db.refresh(scan_run)

            for r in results:
                sr = models.ScanResult(scan_run_id=scan_run.id, **{
                    'ticker': r.get('ticker'),
                    'price': r.get('price'),
                    'rsi': r.get('rsi'),
                    'ma20': r.get('ma20'),
                    'ma50': r.get('ma50'),
                    'volume_ratio': r.get('volume_ratio'),
                    'dividend_yield': r.get('dividend_yield'),
                    'volatility_20': r.get('volatility'),
                    'score': r.get('score'),
                    'reasons': '; '.join(r.get('categories', []) or [])
                })
                db.add(sr)
            db.commit()

            run.tickers_scanned = len(results)
            run.status = 'completed'
            run.completed_at = datetime.utcnow()
            run.scan_run_id = scan_run.id

            # Optionally fetch news and AI summary for top N
            if s.fetch_news:
                top_tickers = [r['ticker'] for r in results[:10]]
                news = get_news_for_tickers(top_tickers, max_per_ticker=3, db=db)
            else:
                news = {}

            if s.generate_ai_summary:
                ai = generate_market_summary(results[:15], news, s.ai_provider or 'openrouter', s.ai_model_id, s.universe_id, db)
                run.ai_summary_id = ai.get('id') if ai else None

            db.add(run)
            db.commit()
        except Exception as e:
            logger.exception('Scheduled scan failed: %s', e)
            run.status = 'failed'
            run.error_message = str(e)
            run.completed_at = datetime.utcnow()
            db.add(run)
            db.commit()
        finally:
            _release_user_lock(s.user_id)
    finally:
        _current_running_count -= 1


# Initialization helper to call on app startup
def init_scheduler(app):
    if not settings.scheduler_enabled:
        logger.info('Scheduler disabled via settings')
        return
    if not scheduler.running:
        scheduler.start()
    db = next(get_db())
    load_scheduler_settings(db)
    app.state.scheduler = scheduler


# Expose function for API route to run now
def run_now(setting_id: int):
    """Create a ScheduledScanRun row, schedule an immediate APScheduler job to execute it, and return identifiers."""
    db = next(get_db())
    s = db.query(models.SchedulerSetting).get(setting_id)
    if not s:
        raise ValueError('Setting not found')

    # create a pending ScheduledScanRun
    run = models.ScheduledScanRun(
        scheduler_setting_id=s.id,
        user_id=s.user_id,
        universe_id=s.universe_id,
        status='pending',
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    job_id = f'runnow_{run.id}'
    # schedule immediate execution using run_scheduled_scan with the scheduled run id
    scheduler.add_job(run_scheduled_scan, 'date', run_date=datetime.utcnow(), args=[setting_id, run.id], id=job_id, replace_existing=False)
    logger.info('Scheduled immediate run %s for setting %s', run.id, setting_id)
    return {'scheduled_scan_run_id': run.id, 'job_id': job_id}
