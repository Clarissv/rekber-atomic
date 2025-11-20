@echo off
title Rekber Atomic - Discord Bot
color 0A

echo.
echo ========================================
echo   REKBER ATOMIC - DISCORD TICKET BOT
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo.

echo Checking dependencies...
if not exist "node_modules" (
    echo [WARNING] Dependencies not found. Installing...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully
) else (
    echo [OK] Dependencies found
)
echo.

echo Checking environment variables...
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please create a .env file with your bot credentials.
    pause
    exit /b 1
)
echo [OK] .env file found
echo.

echo ========================================
echo   STARTING BOT...
echo ========================================
echo.
echo Press Ctrl+C to stop the bot
echo.

node index.js

if errorlevel 1 (
    echo.
    echo [ERROR] Bot crashed! Check the error above.
    pause
)
