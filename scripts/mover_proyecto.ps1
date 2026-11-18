# Script de Migracion del Proyecto "FrauDefender"
# Autor: Antigravity (SysAdmin Mode)

$SourceDir = "C:\Users\neild\.gemini\antigravity\scratch\fraude-defender"
$DestDir = "C:\Users\neild\OneDrive\Desktop\AgiShiel(FrauDefender)"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " INICIANDO MIGRACION DE PROYECTO: AegisShield/FrauDefender" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Origen:      $SourceDir" -ForegroundColor Yellow
Write-Host "Destino:     $DestDir" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------"

if (-not (Test-Path $SourceDir)) {
    Write-Error "El directorio de origen no existe: $SourceDir"
    exit 1
}

# Crear destino si no existe
if (-not (Test-Path $DestDir)) {
    Write-Host "Creando directorio de destino..." -ForegroundColor Gray
    New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
}

Write-Host "Copiando archivos utilizando Robocopy (excluyendo carpetas de dependencias)..." -ForegroundColor Gray

# Ejecutar robocopy excluyendo dependencias pesadas y temporales
# Exclusiones: node_modules, venv, .git, .pytest_cache, dist, __pycache__
$excludeDirs = @("node_modules", "venv", ".git", ".pytest_cache", "dist", "__pycache__")
$robocopyArgs = @(
    $SourceDir,
    $DestDir,
    "/E",                # Copiar subdirectorios (incluidos vacios)
    "/XD",               # Excluir los siguientes directorios
    "node_modules",
    "venv",
    ".git",
    ".pytest_cache",
    "dist",
    "__pycache__",
    "/R:3",              # Reintentar 3 veces en caso de fallo
    "/W:5",              # Esperar 5 segundos entre reintentos
    "/NP",               # No mostrar porcentaje de progreso por archivo (evita spam en logs)
    "/NDL"               # No mostrar nombres de directorios en el log detallado
)

$process = Start-Process robocopy -ArgumentList $robocopyArgs -PassThru -NoNewWindow -Wait

# Robocopy utiliza codigos de salida especiales:
# Menor a 8 significa exito (0: sin cambios, 1: archivos copiados, 2: extras, 3: copiados+extras, etc.)
$exitCode = $process.ExitCode
Write-Host "Robocopy finalizo con codigo de salida: $exitCode" -ForegroundColor Gray

if ($exitCode -lt 8) {
    Write-Host "--------------------------------------------------------"
    Write-Host "Copia de archivos realizada con exito!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "--------------------------------------------------------" -ForegroundColor Red
    Write-Host "Ocurrio un error al copiar los archivos. Codigo: $exitCode" -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
    exit $exitCode
}
