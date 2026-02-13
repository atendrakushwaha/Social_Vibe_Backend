@echo off
echo ========================================
echo        NestJS Testing Suite
echo ========================================
echo.

:menu
echo Please select test type:
echo.
echo 1. Run All Tests
echo 2. Run E2E Tests Only
echo 3. Run Unit Tests Only
echo 4. Generate Coverage Report
echo 5. Run Tests in Watch Mode
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto all_tests
if "%choice%"=="2" goto e2e_tests
if "%choice%"=="3" goto unit_tests
if "%choice%"=="4" goto coverage
if "%choice%"=="5" goto watch_mode
if "%choice%"=="6" goto end
echo Invalid choice, please try again.
echo.
goto menu

:all_tests
echo.
echo Running all tests...
echo.
npm test
goto done

:e2e_tests
echo.
echo Running E2E tests...
echo.
npm run test:e2e
goto done

:unit_tests
echo.
echo Running unit tests...
echo.
npm test -- --testPathIgnorePatterns=e2e
goto done

:coverage
echo.
echo Generating coverage report...
echo.
npm run test:cov
echo.
echo Opening coverage report...
start coverage\lcov-report\index.html
goto done

:watch_mode
echo.
echo Starting tests in watch mode...
echo Press Ctrl+C to stop
echo.
npm run test:watch
goto done

:done
echo.
echo ========================================
echo         Tests Complete!
echo ========================================
echo.
pause
goto menu

:end
echo.
echo Goodbye!
pause
