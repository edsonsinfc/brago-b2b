#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Fazer backup rápido do banco de dados com PowerShell
.DESCRIPTION
    Script que automatiza backup do MySQL usando mysqldump
.EXAMPLE
    .\backup-database.ps1
.NOTES
    Data: 13 de Fevereiro de 2026
    Requer: mysqldump instalado no PATH
#>

param(
    [string]$Host = $env:MYSQL_HOST ?? "localhost",
    [string]$User = $env:MYSQL_USER ?? "root",
    [string]$Password = $env:MYSQL_PASSWORD ?? "",
    [string]$Database = $env:MYSQL_DATABASE ?? "nexus_b2b",
    [int]$Port = $env:MYSQL_PORT ?? 3306
)

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "💾 BACKUP DO BANCO DE DADOS" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Validar mysqldump
$mysqldumpPath = Get-Command mysqldump -ErrorAction SilentlyContinue
if (-not $mysqldumpPath) {
    Write-Host "❌ ERRO: mysqldump não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solução para Windows:" -ForegroundColor Yellow
    Write-Host "  1. Instalar MySQL Community Server"
    Write-Host "  2. Adicionar MySQL ao PATH do Windows"
    Write-Host "  3. Ou instalar via: choco install mysql -y"
    Write-Host ""
    exit 1
}

# Configuração
Write-Host "📋 Configuração:" -ForegroundColor Cyan
Write-Host "  Database: $Database"
Write-Host "  Host: $Host"
Write-Host "  User: $User"
Write-Host ""

# Criar pasta backups se não existir
$backupDir = "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "✅ Pasta 'backups' criada" -ForegroundColor Green
}

# Gerar nome do arquivo com timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$filename = "backup_${Database}_${timestamp}.sql"
$filepath = Join-Path $backupDir $filename

Write-Host "⏳ Executando backup..." -ForegroundColor Yellow
Write-Host ""

try {
    # Preparar comando mysqldump
    $passwordPart = if ($Password) { "-p$Password" } else { "" }
    
    # Executar backup
    $cmd = "mysqldump -h $Host -P $Port -u $User $passwordPart --single-transaction --quick --lock-tables=false $Database"
    $output = Invoke-Expression $cmd -ErrorAction Stop
    
    # Salvar arquivo
    $output | Out-File -FilePath $filepath -Encoding UTF8
    
    # Obter tamanho do arquivo
    $fileSize = Get-Item $filepath
    $sizeKB = [math]::Round($fileSize.Length / 1024, 2)
    $sizeMB = [math]::Round($fileSize.Length / 1024 / 1024, 2)
    
    Write-Host "✅ Backup concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Arquivo: $filename"
    Write-Host "📊 Tamanho: $sizeKB KB ($sizeMB MB)"
    Write-Host "📂 Localização: $(Resolve-Path $filepath)" -ForegroundColor Cyan
    Write-Host ""
    
    # Listar últimos backups
    Write-Host "📚 Últimos backups criados:" -ForegroundColor Cyan
    Write-Host ""
    
    Get-ChildItem $backupDir -Filter "backup_*.sql" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 5 |
        ForEach-Object {
            $size = [math]::Round($_.Length / 1024 / 1024, 2)
            $date = $_.LastWriteTime.ToString('dd/MM/yyyy HH:mm:ss')
            Write-Host "  • $($_.Name) ($size MB) - $date"
        }
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✅ BACKUP DISPONÍVEL PARA MIGRAÇÃO" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📤 Para fazer upload para Hostinger:" -ForegroundColor Cyan
    Write-Host "  scp backups/$filename usuario@host:/caminho-destino/" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📥 Para restaurar no servidor Hostinger:" -ForegroundColor Cyan
    Write-Host "  mysql -h host -u user -p banco < $filename" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ Erro ao fazer backup:" -ForegroundColor Red
    Write-Host ""
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -like "*Access denied*") {
        Write-Host "⚠️  Erro de autenticação!" -ForegroundColor Yellow
        Write-Host "   Verifique credenciais em .env ou parâmetros do script" -ForegroundColor Yellow
    }
    
    exit 1
}
