@echo off
REM Apply D1 migrations to production remotejobs database
REM Run this from a fresh terminal with OAuth authenticated

cd /d D:\JOBWORKERS

echo Applying migrations to remotejobs (aff78497-930d-4fe1-a576-1cb80928dd6f)...
echo.

call npx wrangler d1 execute remotejobs --remote --file=migrations/0001_initial_schema.sql
if %ERRORLEVEL% neq 0 (
    echo ERROR: Migration 0001 failed
    exit /b 1
)

call npx wrangler d1 execute remotejobs --remote --file=migrations/0002_auth_sessions.sql
if %ERRORLEVEL% neq 0 (
    echo ERROR: Migration 0002 failed
    exit /b 1
)

call npx wrangler d1 execute remotejobs --remote --file=migrations/0003_saved_jobs.sql
if %ERRORLEVEL% neq 0 (
    echo ERROR: Migration 0003 failed
    exit /b 1
)

call npx wrangler d1 execute remotejobs --remote --file=migrations/0004_job_applications_tracking.sql
if %ERRORLEVEL% neq 0 (
    echo ERROR: Migration 0004 failed
    exit /b 1
)

call npx wrangler d1 execute remotejobs --remote --file=migrations/0005_saved_searches_alerts.sql
if %ERRORLEVEL% neq 0 (
    echo ERROR: Migration 0005 failed
    exit /b 1
)

echo.
echo All migrations applied successfully.
echo.
echo Verifying tables...
call npx wrangler d1 execute remotejobs --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

echo.
echo Done. Check output above for table list.
