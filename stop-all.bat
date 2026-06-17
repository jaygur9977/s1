@echo off
echo ============================================
echo    CLOUDE - STOPPING ALL SERVICES
echo ============================================
echo.

echo Stopping Frontend...
taskkill /fi "WINDOWTITLE eq Cloude Frontend*" /f 2>nul
taskkill /fi "WINDOWTITLE eq CloudeFrontend*" /f 2>nul
echo Done

echo Stopping Backend...
taskkill /fi "WINDOWTITLE eq Cloude Backend*" /f 2>nul
taskkill /fi "WINDOWTITLE eq CloudeBackend*" /f 2>nul
echo Done

echo Stopping MinIO...
wsl docker stop cloude-minio 2>nul
echo Done

echo ============================================
echo    ALL STOPPED
echo ============================================
pause