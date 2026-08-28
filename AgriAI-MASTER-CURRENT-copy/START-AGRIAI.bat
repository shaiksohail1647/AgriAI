@echo off
cd /d "%~dp0"
echo.
echo AgriAI - starting from the correct project folder:
echo %CD%
echo.
if not exist package.json (
  echo ERROR: package.json was not found. Do not run this file from another folder.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies for the first run...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Check your internet connection and run npm install manually.
    pause
    exit /b 1
  )
)
call npm run dev
pause
