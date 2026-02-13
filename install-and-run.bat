@echo off
echo ========================================
echo Installing NestJS Passport Dependencies
echo ========================================
echo.

npm install @nestjs/passport @types/passport-jwt

if errorlevel 1 (
    echo.
    echo [ERROR] Installation failed!
    echo.
    echo Try running this script as Administrator or use:
    echo   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Starting the application...
echo.

npm run start:dev

pause
