@echo off
echo.
echo 🚀 DeFi Protocol - Complete Setup Guide
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

echo 📦 Setting up Backend...
call npm install

echo.
echo 📝 Compiling Contracts...
call npm run compile

echo.
echo 🚀 Deploying Contracts...
call npm run deploy

echo.
echo ✅ Backend setup complete!
echo.
echo ⚠️  Keep this terminal running for Hardhat network
echo Next: Open a new terminal and run the frontend setup
echo.
echo 📝 To start frontend:
echo    cd frontend
echo    npm install
echo    npm start
echo.
pause
