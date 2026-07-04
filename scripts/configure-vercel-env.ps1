param(
    [switch]$AutoConfirm
)

$ErrorActionPreference = "Continue"
$ENV_FILE = ".env"

function WS { param($m) Write-Host "`n[STEP] $m" -ForegroundColor Cyan }
function WO { param($m) Write-Host "  [OK] $m" -ForegroundColor Green }
function WW { param($m) Write-Host "  [WARN] $m" -ForegroundColor Yellow }
function WE { param($m) Write-Host "  [ERROR] $m" -ForegroundColor Red }
function WI { param($m) Write-Host "  [INFO] $m" -ForegroundColor Gray }

function New-Secret {
    $s = & node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>$null
    if ($s -and $s.Length -eq 64) { return $s.Trim() }
    $b = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($b)
    return ([BitConverter]::ToString($b) -replace "-","").ToLower()
}

function Get-EnvVal {
    param([string]$N)
    if (-not (Test-Path $ENV_FILE)) { return $null }
    $lines = Get-Content $ENV_FILE -ErrorAction SilentlyContinue
    foreach ($l in $lines) {
        if ($l -match "^\s*$N\s*=\s*(.+)$") {
            $v = $matches[1].Trim()
            if ($v.StartsWith('"')) { $v = $v.Substring(1) }
            if ($v.EndsWith('"')) { $v = $v.Substring(0,$v.Length-1) }
            return $v
        }
    }
    return $null
}

function Is-Dangerous {
    param([string]$V)
    if (-not $V) { return $true }
    $bad = @("changeme","secret","your_secret","replace_this","replace_with","dev_fallback","your_pi_api","your_openai","your_anthropic","your_license","your_runway","BUILD_PLACEHOLDER","user:password@localhost","@localhost","127.0.0.1","example.com/webhook")
    foreach ($d in $bad) { if ($V.Contains($d)) { return $true } }
    return $false
}

function Prompt-OrSkip {
    param([string]$Prompt)
    if ($AutoConfirm) { return $null }
    return Read-Host $Prompt
}

function Add-Env {
    param([string]$Name, [string]$Value)
    foreach ($e in @("production","preview","development")) {
        WI "  Setting $Name ($e)..."
        try {
            $r = $Value | & cmd /c "vercel env add $Name $e 2>&1" 2>&1
            if ($LASTEXITCODE -eq 0) { WO "$Name ($e) done" }
            elseif ($r -match "already exists") { WW "$Name ($e) exists" }
            else { WW "$Name ($e) failed: $r" }
        } catch { WW "$Name ($e) error" }
    }
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Vercel Env Config Tool" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

WS "Pre-flight checks"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { WE "No Node.js"; exit 1 }
WO "Node.js OK"
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) { WE "No Vercel CLI"; exit 1 }
WO "Vercel CLI OK"
$who = & cmd /c "vercel whoami 2>&1" 2>&1
if ($LASTEXITCODE -ne 0) { WE "Not logged in"; exit 1 }
WO "Logged in: $who"

WS "Reading .env"
if (Test-Path $ENV_FILE) { WO ".env found" } else { WW ".env not found" }

WS "Collecting values"
$vars = @{}

Write-Host "`n--- REQUIRED ---" -ForegroundColor Red
$req = @(
    @{N="DATABASE_URL";D="PostgreSQL URL (production, not localhost)";A=$false}
    @{N="PI_API_KEY";D="Pi API Key";A=$false}
    @{N="PI_SESSION_SECRET";D="Session key";A=$true}
    @{N="JWT_SECRET";D="JWT signing secret";A=$true}
    @{N="LICENSE_PAYLOAD_SECRET";D="License key";A=$true}
    @{N="LICENSE_PAYLOAD";D="Base64 license payload";A=$false}
)
foreach ($v in $req) {
    Write-Host "`n  $($v.N)" -ForegroundColor White
    Write-Host "  $($v.D)" -ForegroundColor Gray
    if ($v.A) {
        $val = New-Secret
        WO "Auto: $($val.Substring(0,8))..."
        $vars[$v.N] = $val
        continue
    }
    $val = Get-EnvVal $v.N
    if ($val -and -not (Is-Dangerous $val)) {
        $d = if ($val.Length -gt 20) { $val.Substring(0,10)+"..." } else { $val }
        WO "From .env: $d"
        $vars[$v.N] = $val
        continue
    }
    if ($val -and (Is-Dangerous $val)) { WW "Skipped unsafe .env value for $($v.N)" }
    $ui = Prompt-OrSkip "  Enter value (Enter to skip)"
    if ($ui) {
        if (Is-Dangerous $ui) { WW "Dangerous value!" }
        else { $vars[$v.N] = $ui }
    } else { WW "Skipped" }
}

Write-Host "`n--- RECOMMENDED ---" -ForegroundColor Yellow
$rec = @(
    @{N="APP_NAME";D="Application name";Def="Pi Merchant Framework"}
    @{N="OPENAI_API_KEY";D="OpenAI key";Def=$null}
    @{N="ANTHROPIC_API_KEY";D="Anthropic key";Def=$null}
    @{N="OLLAMA_ENABLED";D="Enable Ollama fallback";Def="false"}
    @{N="OLLAMA_API_BASE";D="Ollama API URL";Def="http://localhost:11434"}
    @{N="OLLAMA_BASE_URL";D="Ollama URL";Def="http://localhost:11434"}
    @{N="OLLAMA_MODEL";D="Ollama model name";Def="llama3.1"}
    @{N="RUNWAY_API_KEY";D="Runway video API key";Def=$null}
    @{N="VIDEO_PROVIDER";D="Video generation provider";Def="runway"}
    @{N="AI_PRIMARY_PROVIDER";D="Primary AI provider";Def="openai"}
    @{N="AI_FALLBACK_PROVIDERS";D="Fallback AI providers";Def="anthropic,ollama"}
)
foreach ($v in $rec) {
    Write-Host "`n  $($v.N)" -ForegroundColor White
    Write-Host "  $($v.D)" -ForegroundColor Gray
    $val = Get-EnvVal $v.N
    if (-not $val -and $v.Def) { $val = $v.Def; WI "Default: $val"; $vars[$v.N]=$val; continue }
    if ($val -and -not (Is-Dangerous $val)) { WO "From .env: $val"; $vars[$v.N]=$val; continue }
    if ($val -and (Is-Dangerous $val)) { WW "Skipped unsafe .env value for $($v.N)" }
    $ui = Prompt-OrSkip "  Enter value (Enter to skip)"
    if ($ui) { $vars[$v.N]=$ui } else { WI "Skipped" }
}

Write-Host "`n--- OPTIONAL ---" -ForegroundColor Green
$opt = @(
    @{N="NEXT_PUBLIC_APP_NAME";D="Public app name";Def="Pi Merchant Framework"}
    @{N="NEXT_PUBLIC_APP_URL";D="Public app URL";Def=$null}
    @{N="NEXT_PUBLIC_ADMIN_URL";D="Admin app URL";Def=$null}
    @{N="NEXT_PUBLIC_DEFAULT_MERCHANT_ID";D="Default merchant ID";Def="merchant-demo-001"}
    @{N="NEXT_PUBLIC_MERCHANT_ID";D="Merchant ID";Def="merchant-demo-001"}
    @{N="DEFAULT_MERCHANT_ID";D="Server merchant ID";Def="merchant-demo-001"}
    @{N="PI_PLATFORM_API_BASE";D="Pi platform API base";Def="https://api.minepi.com"}
    @{N="PI_SANDBOX";D="Pi sandbox mode";Def="true"}
    @{N="OPENAI_API_BASE";D="OpenAI API base";Def="https://api.openai.com/v1"}
    @{N="ANTHROPIC_API_BASE";D="Anthropic API base";Def="https://api.anthropic.com"}
    @{N="NEXTAUTH_SECRET";D="NextAuth secret";A=$true}
    @{N="NEXTAUTH_URL";D="NextAuth URL";Def=$null}
    @{N="LICENSE_PUBLIC_KEY";D="License public key";Def=$null}
    @{N="REDIS_URL";D="Redis URL";Def=$null}
    @{N="MONITORING_WEBHOOK_URL";D="Monitoring webhook";Def=$null}
    @{N="USAGE_WEBHOOK_URL";D="Usage webhook";Def=$null}
)
foreach ($v in $opt) {
    Write-Host "`n  $($v.N)" -ForegroundColor White
    if ($v.A) {
        $val = New-Secret
        WO "Auto: $($val.Substring(0,8))..."
        $vars[$v.N] = $val
        continue
    }
    $val = Get-EnvVal $v.N
    if (-not $val -and $v.Def) { $val = $v.Def; WI "Default: $val"; $vars[$v.N]=$val; continue }
    if ($val -and -not (Is-Dangerous $val)) { $vars[$v.N]=$val; continue }
    if ($val -and (Is-Dangerous $val)) { WW "Skipped unsafe .env value for $($v.N)" }
    $ui = Prompt-OrSkip "  Enter value (Enter to skip)"
    if ($ui) { $vars[$v.N]=$ui } else { WI "Skipped" }
}

WS "Confirm"
Write-Host ""
foreach ($n in ($vars.Keys | Sort-Object)) {
    $v = $vars[$n]
    $d = if ($v.Length -gt 20) { $v.Substring(0,8)+"..." } else { $v }
    Write-Host "  $n = $d" -ForegroundColor Gray
}
Write-Host ""
if ($AutoConfirm) {
    WO "AutoConfirm enabled — proceeding"
} else {
    $c = Read-Host "Confirm? (y/N)"
    if ($c -ne "y") { WW "Cancelled"; exit 0 }
}

WS "Configuring"
foreach ($n in ($vars.Keys | Sort-Object)) {
    Write-Host "`nConfiguring $n..." -ForegroundColor White
    Add-Env -Name $n -Value $vars[$n]
}

WS "Verify"
Write-Host ""
$el = & cmd /c "vercel env ls 2>&1" 2>&1
Write-Host $el -ForegroundColor Gray

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  Done! Next: vercel --prod" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
