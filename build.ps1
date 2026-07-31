# Pi Merchant Framework - Docker Build Script
# Run in PowerShell: pwsh build.ps1

$ErrorActionPreference = "Stop"
Set-Location "c:\Users\aizn\AppData\Roaming\Pi Network\pi-apps\18063116418-pioneer-ai-commerce"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Building Pi Merchant Framework Images" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Clean
docker builder prune -f 2>$null
Write-Host ""

# Build Web
Write-Host "[1/2] Building pi-merchant-framework:latest ..." -ForegroundColor Yellow
$webLog = "$env:TEMP\docker-build-web.log"
$p = Start-Process -FilePath "docker" -ArgumentList "build -f Dockerfile -t pi-merchant-framework:latest --progress=plain ." -NoNewWindow -Wait -PassThru -RedirectStandardOutput $webLog -RedirectStandardError "$webLog.err"
if ($p.ExitCode -eq 0) {
    Write-Host "  [OK] Web image built" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Check: $webLog.err" -ForegroundColor Red
    Get-Content "$webLog.err" -Tail 20
    exit 1
}

# Build Admin
Write-Host ""
Write-Host "[2/2] Building pi-merchant-framework:admin-latest ..." -ForegroundColor Yellow
$adminLog = "$env:TEMP\docker-build-admin.log"
$p = Start-Process -FilePath "docker" -ArgumentList "build -f Dockerfile.admin -t pi-merchant-framework:admin-latest --progress=plain ." -NoNewWindow -Wait -PassThru -RedirectStandardOutput $adminLog -RedirectStandardError "$adminLog.err"
if ($p.ExitCode -eq 0) {
    Write-Host "  [OK] Admin image built" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Check: $adminLog.err" -ForegroundColor Red
    Get-Content "$adminLog.err" -Tail 20
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " SUCCESS - Both images ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
docker images "pi-merchant-framework*"