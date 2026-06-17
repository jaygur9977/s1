@REM @echo off
@REM echo ============================================
@REM echo    CLOUDE - STARTING ALL SERVICES
@REM echo ============================================
@REM echo.

@REM echo [1/3] Ensuring MinIO is running...
@REM wsl docker start cloude-minio 2>nul
@REM if %errorlevel% neq 0 (
@REM     wsl docker run -d --name cloude-minio -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=admin -e MINIO_ROOT_PASSWORD=admin12345 quay.io/minio/minio server /data --console-address ":9001"
@REM )
@REM echo MinIO Ready
@REM echo.

@REM echo [2/3] Starting Backend...
@REM cd /d "C:\Users\hp\Desktop\projects\cloude\backend"
@REM start "CloudeBackend" cmd /k "title Cloude Backend && node server.js"
@REM echo Backend Starting on port 5000...
@REM echo.

@REM echo [3/3] Starting Frontend (Vite)...
@REM cd /d "C:\Users\hp\Desktop\projects\cloude\frontend"
@REM start "CloudeFrontend" cmd /k "title Cloude Frontend && npm run dev"
@REM echo Frontend Starting on port 5173...
@REM echo.

@REM timeout /t 10 /nobreak >nul

@REM echo.
@REM echo ============================================
@REM echo    SERVICES RUNNING
@REM echo ============================================
@REM echo.
@REM echo Frontend: http://localhost:5173
@REM echo Backend:  http://localhost:5000/api/health
@REM echo MinIO:    http://localhost:9001
@REM echo.
@REM echo ============================================
@REM pause



@echo off
title Cloude Server
echo ============================================
echo    CLOUDE - STARTING SERVICES
echo ============================================
echo.

echo [1/3] Starting MinIO...
wsl -e bash -c "sudo docker start cloude-minio 2>/dev/null || sudo docker run -d --name cloude-minio --restart unless-stopped -p 0.0.0.0:9000:9000 -p 0.0.0.0:9001:9001 -e MINIO_ROOT_USER=admin -e MINIO_ROOT_PASSWORD=admin12345 quay.io/minio/minio server /data --console-address ':9001'"
echo MinIO Done
echo.

echo [2/3] Starting Backend...
cd /d "C:\Users\hp\Desktop\projects\cloude\backend"
start "CloudeBackend" cmd /k "title Cloude Backend && node server.js"
timeout /t 3 /nobreak >nul
echo Backend - Port 5000
echo.

echo [3/3] Starting Frontend...
cd /d "C:\Users\hp\Desktop\projects\cloude\frontend"
start "CloudeFrontend" cmd /k "title Cloude Frontend && npx vite --host 0.0.0.0 --port 5173"
echo Frontend - Port 5173
echo.

timeout /t 8 /nobreak >nul

echo.
echo ============================================
echo    SERVICES RUNNING
echo ============================================
echo.
echo YOUR PC:
echo   http://localhost:5173
echo.
echo SHARE THIS WITH OTHERS:
echo   http://172.29.76.166:5173
echo.
echo Check backend: http://172.29.76.166:5000/api/health
echo ============================================
pause