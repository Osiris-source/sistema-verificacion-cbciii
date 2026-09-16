# Instala el tunel como servicio de Windows para que corra solo (inicio + reinicio).
# Ejecutar con PowerShell ADMINISTRADOR:
#   powershell -ExecutionPolicy Bypass -File install-servicio.ps1
$ErrorActionPreference = 'Stop'
$exe = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $exe) { $exe = 'C:\Program Files (x86)\cloudflared\cloudflared.exe' }
if (-not (Test-Path (Join-Path $env:USERPROFILE '.cloudflared\config.yml'))) {
    Write-Host 'Primero ejecuta setup.ps1'
    exit 1
}
& $exe service install
Write-Host 'Servicio instalado. Estado:'
Get-Service Cloudflared | Format-Table Status, Name, DisplayName