@echo off
title Sistema B2B Brago - Inicializador
color 0A

echo ========================================
echo   Sistema B2B Brago - Inicializador
echo ========================================
echo.

cd /d "C:\inetpub\wwwroot\app"

powershell -ExecutionPolicy Bypass -File "start.ps1"

echo.
echo Pressione qualquer tecla para sair...
pause >nul
