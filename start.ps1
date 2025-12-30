#!/usr/bin/env pwsh
# Script para iniciar o sistema B2B Brago

Write-Host "🚀 Iniciando Sistema B2B Brago..." -ForegroundColor Cyan
Write-Host ""

# Navegar para o diretório do projeto
Set-Location "C:\inetpub\wwwroot\app"

# Verificar se o PM2 está instalado
Write-Host "🔍 Verificando PM2..." -ForegroundColor Yellow
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Installed) {
    Write-Host "❌ PM2 não está instalado!" -ForegroundColor Red
    Write-Host "   Instale com: npm install -g pm2" -ForegroundColor Yellow
    exit 1
}

# Parar processos existentes
Write-Host "🛑 Parando processos existentes..." -ForegroundColor Yellow
pm2 stop all 2>$null

# Matar processos Node.js orfãos (se houver)
Write-Host "🧹 Limpando processos orfãos..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*nodejs*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Aguardar um pouco
Start-Sleep -Seconds 2

# Iniciar aplicação com PM2
Write-Host "▶️  Iniciando aplicação..." -ForegroundColor Green
pm2 start ecosystem.config.js

# Aguardar inicialização
Start-Sleep -Seconds 3

# Mostrar status
Write-Host ""
Write-Host "📊 Status dos processos:" -ForegroundColor Cyan
pm2 status

# Verificar se está rodando
Write-Host ""
Write-Host "🔍 Verificando porta 3000..." -ForegroundColor Yellow
$port = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
if ($port) {
    Write-Host "✅ Servidor está rodando na porta 3000" -ForegroundColor Green
} else {
    Write-Host "❌ Servidor NÃO está rodando na porta 3000" -ForegroundColor Red
    Write-Host "   Verifique os logs: pm2 logs" -ForegroundColor Yellow
    exit 1
}

# Salvar configuração
Write-Host ""
Write-Host "💾 Salvando configuração..." -ForegroundColor Yellow
pm2 save

Write-Host ""
Write-Host "🎉 Sistema iniciado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Acesso:" -ForegroundColor Cyan
Write-Host "   - Local: http://localhost:3000" -ForegroundColor White
Write-Host "   - Interno: http://10.2.4.13:3000" -ForegroundColor White
Write-Host "   - Externo: http://131.100.24.44:50003" -ForegroundColor White
Write-Host ""
Write-Host "📝 Comandos úteis:" -ForegroundColor Cyan
Write-Host "   - Ver logs: pm2 logs" -ForegroundColor White
Write-Host "   - Status: pm2 status" -ForegroundColor White
Write-Host "   - Reiniciar: pm2 restart b2b-brago" -ForegroundColor White
Write-Host "   - Parar: pm2 stop b2b-brago" -ForegroundColor White
Write-Host ""
