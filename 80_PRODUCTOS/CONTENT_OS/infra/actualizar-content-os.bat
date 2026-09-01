@echo off
title Content OS - actualizar
cd /d "%~dp0dashboard"
echo   Recompilando el Content OS con los ultimos cambios...
call npm run build
echo.
echo   Listo. Ya puedes abrir el Content OS.
pause
