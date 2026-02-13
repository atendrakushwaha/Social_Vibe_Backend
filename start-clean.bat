@echo off
echo Stopping any process on port 3000...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo Port 3000 is now free!
echo Starting the application...
echo.

npm run start:dev
