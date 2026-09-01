@echo off
title Content OS - detener
echo   Cerrando el Content OS...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do taskkill /F /PID %%p >nul 2>&1
echo   Listo. El puerto quedo libre.
timeout /t 2 /nobreak >nul
