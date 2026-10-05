@echo off
setlocal EnableDelayedExpansion

echo.
echo ==========================================
echo   JOBWORKERS - Cloudflare D1 Setup
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking D1 database...
echo.

set "DB_ID="

for /f "tokens=1,* delims= " %%A in ('npx wrangler d1 list 2^>nul ^| findstr /I "jobworkers-db"') do (
    if not defined DB_ID set "DB_ID=%%B"
)

if defined DB_ID (
    echo D1 database already exists.
    echo Database ID: !DB_ID!
    goto :update_config
)

echo D1 database not found. Creating jobworkers-db...
echo.

npx wrangler d1 create jobworkers-db

if errorlevel 1 (
    echo.
    echo ERROR: Failed to create D1 database.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Reading database ID...
echo.

for /f "tokens=1,* delims= " %%A in ('npx wrangler d1 list 2^>nul ^| findstr /I "jobworkers-db"') do (
    if not defined DB_ID set "DB_ID=%%B"
)

if not defined DB_ID (
    echo ERROR: Could not determine database ID.
    echo Run:
    echo   npx wrangler d1 list
    echo.
    pause
    exit /b 1
)

:update_config

echo.
echo Database ID detected:
echo !DB_ID!
echo.

echo [3/4] Updating wrangler.toml...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$p='wrangler.toml'; ^
$c=Get-Content $p -Raw; ^
if($c -match '(?m)^database_id\s*=') { ^
  $c=[regex]::Replace($c,'(?m)^database_id\s*=.*$','database_id = ""!DB_ID!""') ^
} else { ^
  $c += ""`r`n`r`n[[d1_databases]]`r`nbinding = """"DB""""`r`ndatabase_name = """"jobworkers-db""""`r`ndatabase_id = """"!DB_ID!""""`r`n"" ^
}; ^
Set-Content $p $c -NoNewline"

if errorlevel 1 (
    echo.
    echo ERROR: Failed to update wrangler.toml.
    pause
    exit /b 1
)

echo.
echo [4/4] Verifying configuration...
echo.

findstr /I /C:"binding = \"DB\"" /C:"database_name = \"jobworkers-db\"" /C:"database_id =" wrangler.toml

echo.
echo ==========================================
echo   D1 SETUP COMPLETE
echo ==========================================
echo.
echo Database: jobworkers-db
echo Database ID: !DB_ID!
echo.
echo wrangler.toml has been updated.
echo.
echo NEXT:
echo   npx wrangler deploy
echo.
pause
