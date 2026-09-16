# Elimina el servicio de Windows del tunel.
# PowerShell ADMINISTRADOR:
#   powershell -ExecutionPolicy Bypass -File remove-servicio.ps1
$ErrorActionPreference = 'Stop'
$exe = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $exe) { $exe = 'C:\Program Files (x86)\cloudflared\cloudflared.exe' }
& $exe service uninstall
Write-Host 'Servicio desinstalado.'