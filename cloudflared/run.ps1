# Corre el tunel de Cloudflare en primer plano (ventana abierta).
$ErrorActionPreference = 'Stop'
$exe = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $exe) { $exe = 'C:\Program Files (x86)\cloudflared\cloudflared.exe' }
if (-not (Test-Path (Join-Path $env:USERPROFILE '.cloudflared\config.yml'))) {
    Write-Host 'Primero ejecuta setup.ps1'
    exit 1
}
& $exe tunnel run