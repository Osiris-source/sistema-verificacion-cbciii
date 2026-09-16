# Prueba rapida sin dominio: abre una URL publica aleatoria (https://xxx.trycloudflare.com)
# que apunta al frontend. Cambia en cada reinicio. Solo para probar que tu PC expone bien.
$ErrorActionPreference = 'Stop'
$exe = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $exe) { $exe = 'C:\Program Files (x86)\cloudflared\cloudflared.exe' }
Write-Host '>>> Tunel rapido del frontend. Copia la URL https://...trycloudflare.com que sale abajo.'
& $exe tunnel --url http://localhost:4200