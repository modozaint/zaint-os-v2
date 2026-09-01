@echo off
setlocal
title Content OS
cd /d "%~dp0dashboard"

echo.
echo   CONTENT OS
echo   ==========
echo.

REM ---------------------------------------------------------------------
REM Si el puerto ya esta ocupado, casi siempre es el mismo Content OS de
REM una ventana anterior (o una sesion de trabajo). No se mata a ciegas:
REM se abre el navegador contra el que ya corre y listo.
REM ---------------------------------------------------------------------
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul 2>&1
if %errorlevel%==0 (
  echo   Ya habia un Content OS corriendo. Abriendo esa ventana...
  call :abrir
  timeout /t 3 /nobreak >nul
  exit /b 0
)

REM Sin dependencias instaladas no arranca nada
if not exist "node_modules\next" (
  echo   Faltan las dependencias. Instalando, esto tarda unos minutos...
  call npm install
  if errorlevel 1 goto :error
)

REM Compila solo la primera vez. Arrancar sobre el build hecho es mucho
REM mas rapido que el modo desarrollo, y esto se abre a diario.
if not exist ".next\BUILD_ID" (
  echo   Primera vez: compilando. Tarda cerca de un minuto.
  call npm run build
  if errorlevel 1 goto :error
)

echo   Arrancando. NO CIERRES ESTA VENTANA mientras uses la app.
echo.
call :abrir
call npm run start
if errorlevel 1 goto :error
exit /b 0

:abrir
REM Se abre en ventana propia, sin barra de direcciones: se siente app.
start "" /min cmd /c "timeout /t 5 /nobreak >nul & (start chrome --app=http://localhost:3000/dashboard || start msedge --app=http://localhost:3000/dashboard || start http://localhost:3000/dashboard)"
exit /b 0

:error
echo.
echo   ---------------------------------------------------------------
echo   ALGO FALLO. El detalle esta arriba, en rojo o despues de "Error".
echo   Copiale ese texto a Claude y lo arregla.
echo   ---------------------------------------------------------------
echo.
pause
exit /b 1
