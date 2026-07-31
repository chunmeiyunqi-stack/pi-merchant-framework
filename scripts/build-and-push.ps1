#!/usr/bin/env pwsh
# =============================================================================
# Pi Merchant Framework - Build and Push Script
# 构建并推送镜像到 GHCR，供 Pi Desktop SoloHost 使用
# =============================================================================

param(
    [switch]$SkipBuild,
    [switch]$SkipPush,
    [string]$Registry = "ghcr.io/chunmeiyunqi-stack"
)

$ErrorActionPreference = "Stop"
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmm"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Pi Merchant Framework - Build & Push" -ForegroundColor Cyan
Write-Host " Registry: $Registry" -ForegroundColor Cyan
Write-Host " Timestamp: $TIMESTAMP" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker login
Write-Host "[1/6] Checking GHCR login..." -ForegroundColor Yellow
$loginCheck = docker login ghcr.io 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Not logged in to GHCR" -ForegroundColor Red
    Write-Host "  Run: echo `$GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin" -ForegroundColor Red
    exit 1
}
Write-Host "  OK: Logged in to GHCR" -ForegroundColor Green
Write-Host ""

# Build main app image
if (-not $SkipBuild) {
    Write-Host "[2/6] Building pi-merchant-framework:latest..." -ForegroundColor Yellow
    docker build --platform linux/amd64 `
        -t "$Registry/pi-merchant-framework:latest" `
        -t "$Registry/pi-merchant-framework:$TIMESTAMP" `
        -f Dockerfile `
        .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  OK: Main app image built" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[2/6] Skipping main app build (using existing image)" -ForegroundColor Yellow
    Write-Host ""
}

# Build admin image
if (-not $SkipBuild) {
    Write-Host "[3/6] Building pi-merchant-framework-admin:latest..." -ForegroundColor Yellow
    docker build --platform linux/amd64 `
        -t "$Registry/pi-merchant-framework-admin:latest" `
        -t "$Registry/pi-merchant-framework-admin:$TIMESTAMP" `
        -f Dockerfile.admin `
        .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Admin build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  OK: Admin image built" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[3/6] Skipping admin build (using existing image)" -ForegroundColor Yellow
    Write-Host ""
}

# Push main app image
if (-not $SkipPush) {
    Write-Host "[4/6] Pushing pi-merchant-framework:latest..." -ForegroundColor Yellow
    docker push "$Registry/pi-merchant-framework:latest"
    docker push "$Registry/pi-merchant-framework:$TIMESTAMP"
    Write-Host "  OK: Main app image pushed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[4/6] Skipping push" -ForegroundColor Yellow
    Write-Host ""
}

# Push admin image
if (-not $SkipPush) {
    Write-Host "[5/6] Pushing pi-merchant-framework-admin:latest..." -ForegroundColor Yellow
    docker push "$Registry/pi-merchant-framework-admin:latest"
    docker push "$Registry/pi-merchant-framework-admin:$TIMESTAMP"
    Write-Host "  OK: Admin image pushed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[5/6] Skipping push" -ForegroundColor Yellow
    Write-Host ""
}

# Verification
Write-Host "[6/6] Verification..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Images in local registry:" -ForegroundColor White
docker images | Select-String "pi-merchant-framework"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open Pi Desktop" -ForegroundColor White
Write-Host "  2. Click 'Pioneer AI Commerce' app" -ForegroundColor White
Write-Host "  3. Click 'Start' button" -ForegroundColor White
Write-Host "  4. App will pull latest images from GHCR" -ForegroundColor White
Write-Host ""
Write-Host "Images published:" -ForegroundColor White
Write-Host "  - $Registry/pi-merchant-framework:latest" -ForegroundColor Gray
Write-Host "  - $Registry/pi-merchant-framework:$TIMESTAMP" -ForegroundColor Gray
Write-Host "  - $Registry/pi-merchant-framework-admin:latest" -ForegroundColor Gray
Write-Host "  - $Registry/pi-merchant-framework-admin:$TIMESTAMP" -ForegroundColor Gray
Write-Host ""