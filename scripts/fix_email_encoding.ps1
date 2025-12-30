# Script para corrigir encoding do emailService.js
$filePath = "c:\inetpub\wwwroot\app\src\services\emailService.js"
$backupPath = "c:\inetpub\wwwroot\app\src\services\emailService.js.bak"

# Fazer backup
Copy-Item $filePath $backupPath -Force
Write-Host "Backup criado: $backupPath" -ForegroundColor Green

# Ler o arquivo
$content = Get-Content $filePath -Raw -Encoding UTF8

# Substituir caracteres corrompidos - em sequência ordenada
$content = $content.Replace('ConfiguraÃ§Ãµes', 'Configurações')
$content = $content.Replace('InformaÃ§Ãµes', 'Informações')
$content = $content.Replace('aprovaÃ§Ã£o', 'aprovação')
$content = $content.Replace('notificaÃ§Ã£o', 'notificação')
$content = $content.Replace('conexÃµes', 'conexões')
$content = $content.Replace('Ã§Ãµes', 'ções')
$content = $content.Replace('Ã§Ã£o', 'ção')
$content = $content.Replace('destinatÃ¡rio', 'destinatário')
$content = $content.Replace('automÃ¡tico', 'automático')
$content = $content.Replace('temporÃ¡ria', 'temporária')
$content = $content.Replace('PrÃ³ximos', 'Próximos')
$content = $content.Replace('CÃ³digo', 'Código')
$content = $content.Replace('CrÃ©dito', 'Crédito')
$content = $content.Replace('GestÃ£o', 'Gestão')
$content = $content.Replace('serÃ¡', 'será')
$content = $content.Replace('nÃ£o', 'não')
$content = $content.Replace('NÃ£o', 'Não')
$content = $content.Replace('Â©', '©')

# Emojis e símbolos
$content = $content.Replace('âœ…', '✅')
$content = $content.Replace('âŒ', '❌')
$content = $content.Replace('âš ï¸', '⚠️')
$content = $content.Replace('ðŸ"§', '📧')
$content = $content.Replace('ðŸ›'', '🛒')
$content = $content.Replace('ðŸ"‹', '📋')
$content = $content.Replace('ðŸ¢', '🏢')
$content = $content.Replace('ðŸ"…', '📅')
$content = $content.Replace('ðŸ'°', '💰')
$content = $content.Replace('ðŸ"Š', '📊')
$content = $content.Replace('ðŸ›ï¸', '🛍️')
$content = $content.Replace('â³', '⏳')

# Salvar com UTF-8
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($filePath, $content, $utf8WithoutBom)

Write-Host "Arquivo corrigido com sucesso!" -ForegroundColor Green
Write-Host "Caracteres corrompidos substituídos." -ForegroundColor Cyan
