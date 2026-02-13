# Installation script for PowerShell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing NestJS Passport Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    npm install @nestjs/passport @types/passport-jwt
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Installation Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting the application..." -ForegroundColor Yellow
    Write-Host ""
    
    npm run start:dev
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Installation failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running PowerShell as Administrator or use:" -ForegroundColor Yellow
    Write-Host "  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or run install-and-run.bat instead" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
