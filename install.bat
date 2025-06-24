@echo off
setlocal enabledelayedexpansion

REM SQL Analyst - One-Click Installation Script for Windows
REM This script automates the complete setup process

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    SQL Analyst Installer                     ║
echo ║                One-Click Installation Script                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the SQL Analyst project root directory.
    pause
    exit /b 1
)

if not exist "client" (
    echo [ERROR] Client directory not found. Please run this script from the SQL Analyst project root directory.
    pause
    exit /b 1
)

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or higher.
    echo [INFO] Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2,3 delims=." %%a in ('node --version') do (
    set NODE_VERSION=%%a
    set NODE_VERSION=!NODE_VERSION:~1!
)

if !NODE_VERSION! LSS 16 (
    echo [ERROR] Node.js version !NODE_VERSION! is too old. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

echo [SUCCESS] Node.js version !NODE_VERSION! is compatible

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install Node.js which includes npm.
    pause
    exit /b 1
)

echo [SUCCESS] All prerequisites are satisfied!

REM Get database configuration
echo.
echo [INFO] Database Configuration
echo Please provide your MySQL database credentials:

set /p DB_HOST="Database Host [127.0.0.1]: "
if "!DB_HOST!"=="" set DB_HOST=127.0.0.1

set /p DB_PORT="Database Port [3306]: "
if "!DB_PORT!"=="" set DB_PORT=3306

set /p DB_NAME="Database Name [preart]: "
if "!DB_NAME!"=="" set DB_NAME=preart

set /p DB_USER="Database Username: "
if "!DB_USER!"=="" (
    echo [ERROR] Database username is required.
    pause
    exit /b 1
)

set /p DB_PASSWORD="Database Password: "
if "!DB_PASSWORD!"=="" (
    echo [ERROR] Database password is required.
    pause
    exit /b 1
)

REM Test database connection (optional)
echo [INFO] Testing MySQL connection...
mysql -u"!DB_USER!" -p"!DB_PASSWORD!" -h"!DB_HOST!" -P"!DB_PORT!" -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Could not connect to MySQL. You may need to:
    echo [WARNING] 1. Start MySQL service
    echo [WARNING] 2. Check your credentials
    echo [WARNING] 3. Create the database manually
    echo.
    set /p CONTINUE="Continue with installation anyway? (y/N): "
    if /i not "!CONTINUE!"=="y" (
        echo [INFO] Installation cancelled.
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] MySQL connection successful
    echo [INFO] Creating database '!DB_NAME!' if it doesn't exist...
    mysql -u"!DB_USER!" -p"!DB_PASSWORD!" -h"!DB_HOST!" -P"!DB_PORT!" -e "CREATE DATABASE IF NOT EXISTS \`!DB_NAME!\`;" >nul 2>&1
)

REM Install dependencies
echo.
echo [INFO] Installing dependencies...

echo [INFO] Installing main project dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install main project dependencies.
    pause
    exit /b 1
)

echo [INFO] Installing client dependencies...
cd client
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install client dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] Dependencies installed successfully!

REM Setup environment file
echo.
echo [INFO] Setting up environment...

if not exist ".env" (
    echo [INFO] Creating .env file...
    copy env.example .env >nul
    
    REM Update .env with provided values
    powershell -Command "(Get-Content .env) -replace 'DB_HOST=.*', 'DB_HOST=!DB_HOST!' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'DB_PORT=.*', 'DB_PORT=!DB_PORT!' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'DB_NAME=.*', 'DB_NAME=!DB_NAME!' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'DB_USER=.*', 'DB_USER=!DB_USER!' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=!DB_PASSWORD!' | Set-Content .env"
    
    echo [SUCCESS] Environment file created and configured
) else (
    echo [WARNING] .env file already exists. Skipping environment setup.
)

REM Final success message
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Installation Complete!                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo [SUCCESS] SQL Analyst has been installed successfully!
echo.
echo [INFO] Next steps:
echo [INFO] 1. The application will start automatically
echo [INFO] 2. Open your browser to http://localhost:5173
echo [INFO] 3. Configure any additional settings in the app
echo.
echo [INFO] To start the application manually later, run:
echo [INFO]   npm run dev
echo.

REM Ask if user wants to start the application now
set /p START_APP="Start the application now? (Y/n): "
if /i not "!START_APP!"=="n" (
    echo [INFO] Starting SQL Analyst application...
    echo [INFO] This will start both the backend and frontend servers.
    echo [INFO] Press Ctrl+C to stop the application.
    echo.
    echo [SUCCESS] Application will be available at:
    echo [SUCCESS]   Frontend: http://localhost:5173
    echo [SUCCESS]   Backend:  http://localhost:3001
    echo.
    call npm run dev
) else (
    echo [INFO] Installation complete! Run 'npm run dev' to start the application.
)

pause 