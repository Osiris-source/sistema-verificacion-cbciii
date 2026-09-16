# Configura el tunel nombrado de Cloudflare para tu PC.
# Pasos que requieren tu cuenta: login del navegador, registro del dominio en Cloudflare.
# Ejecutar con PowerShell:
#   powershell -ExecutionPolicy Bypass -File setup.ps1

$ErrorActionPreference = 'Stop'

$exe = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $exe) { $exe = 'C:\Program Files (x86)\cloudflared\cloudflared.exe' }
if (-not (Test-Path $exe)) { throw 'cloudflared no encontrado. Instalalo: winget install --id Cloudflare.cloudflared' }

$dir = "$env:USERPROFILE\.cloudflared"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

Write-Host '==========================================================='
Write-Host ' cloudflared: ' $exe
Write-Host '==========================================================='

# 1) Login (abre el navegador para autorizar tu cuenta de Cloudflare)
if (-not (Test-Path "$dir\cert.pem")) {
    Write-Host '-> Abriendo login en el navegador (autoriza con tu cuenta de Cloudflare)...'
    & $exe tunnel login
    if ($LASTEXITCODE -ne 0) { throw 'El login fallo.' }
} else {
    Write-Host '-> Ya hay session de Cloudflare (cert.pem).'
}

# 2) Nombre del tunel
$nombre = Read-Host "Nombre del tunel [cbciii]"
if (-not $nombre) { $nombre = 'cbciii' }

$listado = & $exe tunnel list
if ($listado -match [regex]::Escape($nombre)) {
    Write-Host "-> Tunel '$nombre' ya existe."
} else {
    Write-Host "-> Creando el tunel '$nombre'..."
    & $exe tunnel create $nombre
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear el tunel.' }
}

# 3) Dominio (debe estar registrado y agregado a tu cuenta de Cloudflare)
$dominio = Read-Host "Tu dominio (ej: midominio.com)"
if (-not $dominio) { throw 'Debes indicar tu dominio.' }
$dominio = $dominio.Trim().TrimEnd('/')
$app  = "cbc.$dominio"
$api  = "cbc-api.$dominio"

# 4) Generar config.yml
$config = @"
tunnel: $nombre
credentials-file: $dir\$nombre.json
ingress:
  - hostname: $app
    service: http://localhost:4200
  - hostname: $api
    service: http://localhost:1337
  - service: http_status:404
"@
Set-Content -Path "$dir\config.yml" -Value $config -Encoding UTF8
Write-Host "-> config.yml generado para $app y $api"

# 5) Crear las rutas DNS (requiere que el dominio este en tu Cloudflare)
Write-Host '-> Creando registros DNS (cbc y cbc-api)...'
& $exe tunnel route dns $nombre $app
if ($LASTEXITCODE -ne 0) { Write-Host 'Aviso: no se pudo crear la ruta de DNS. Verifica que el dominio este agregado en Cloudflare.' }
& $exe tunnel route dns $nombre $api
if ($LASTEXITCODE -ne 0) { Write-Host 'Aviso: no se pudo crear la ruta de DNS del API.' }

Write-Host ''
Write-Host 'Listo. Para probar ahora:'
Write-Host "   powershell -ExecutionPolicy Bypass -File run.ps1"
Write-Host 'Para dejarlo corriendo como servicio (se inicia solo):'
Write-Host '   powershell -ExecutionPolicy Bypass -File install-servicio.ps1'