# Fix encoding - PowerShell UTF-8
$file = "c:\inetpub\wwwroot\app\src\services\emailService.js"

# Backup
Copy-Item $file "$file.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Force

# Read and fix
$bytes = [System.IO.File]::ReadAllBytes($file)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Fix corrupted characters using regex patterns
$fixes = @(
    @('Configura..es', 'Configurações'),
    @('Informa..es', 'Informações'),
    @('aprova..o', 'aprovação'),
    @('notifica..o', 'notificação'),
    @('conex.es', 'conexões'),
    @('..es', 'ções'),
    @('..o', 'ção'),
    @('destinat.rio', 'destinatário'),
    @('autom.tico', 'automático'),
    @('tempor.ria', 'temporária'),
    @('Pr.ximos', 'Próximos'),
    @('C.digo', 'Código'),
    @('Cr.dito', 'Crédito'),
    @('Gest.o', 'Gestão'),
    @('ser.', 'será'),
    @('n.o', 'não'),
    @('N.o', 'Não')
)

# Apply fixes
foreach ($fix in $fixes) {
    $pattern = $fix[0] -replace '\.', '[^a-zA-Z0-9]'
    $text = $text -replace $pattern, $fix[1]
}

# Save as UTF-8 without BOM
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($file, $text, $utf8)

Write-Host "Fixed successfully!" -ForegroundColor Green
