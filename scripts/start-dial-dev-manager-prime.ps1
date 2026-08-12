# Start DIAL Dev Manager inside Prime Agent (Windows — D-61 harness only).
# No production data path. Not CI SoR. Does not add a production Prime adapter.
#
# Usage (from anywhere):
#   powershell -ExecutionPolicy Bypass -File C:\Users\j\Desktop\DIAL\scripts\start-dial-dev-manager-prime.ps1
#
# What it does:
#   1) Ensures Cursor→Prime bridge is up on http://127.0.0.1:8765/v1
#   2) Launches prime-agent in the DIAL repo with Cursor Auto + /dev-manager prompt

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$BridgeScript = Join-Path $env:USERPROFILE ".prime\agent\start-cursor-bridge.ps1"
$DevManagerPrompt = Join-Path $RepoRoot ".prime\agent\prompts\dev-manager.md"
$BridgeUrl = "http://127.0.0.1:8765/v1/models"
$BridgePort = 8765

function Test-BridgeUp {
  try {
    $null = Invoke-WebRequest -Uri $BridgeUrl -UseBasicParsing -TimeoutSec 2
    return $true
  } catch {
    return $false
  }
}

# Ensure npm global shims (prime-agent, cursor-api-proxy) are on PATH
$npmBin = Join-Path $env:APPDATA "npm"
if ((Test-Path $npmBin) -and ($env:PATH -notlike "*$npmBin*")) {
  $env:PATH = "$npmBin;$env:PATH"
}

$agentPath = Join-Path $env:LOCALAPPDATA "cursor-agent"
if ((Test-Path $agentPath) -and ($env:PATH -notlike "*$agentPath*")) {
  $env:PATH = "$agentPath;$env:PATH"
}

if (-not (Get-Command prime-agent -ErrorAction SilentlyContinue)) {
  Write-Error "prime-agent not found on PATH. Install: npm i -g prime-agent@0.7.2 (or current MIT release)."
}

if (-not (Test-Path $DevManagerPrompt)) {
  Write-Error "Missing Dev Manager prompt template: $DevManagerPrompt"
}

if (-not (Test-Path $BridgeScript)) {
  Write-Error "Missing Cursor bridge script: $BridgeScript (expected machine-local ~/.prime/agent/start-cursor-bridge.ps1)"
}

Write-Host "DIAL repo: $RepoRoot"
Write-Host "Dev Manager prompt: $DevManagerPrompt"
Write-Host "Model routing: cursor / auto (local bridge :$BridgePort)"

if (-not (Test-BridgeUp)) {
  Write-Host "Cursor bridge is down — starting in a new window..."
  Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", $BridgeScript
  ) | Out-Null

  $deadline = (Get-Date).AddSeconds(45)
  while (-not (Test-BridgeUp)) {
    if ((Get-Date) -gt $deadline) {
      Write-Error @"
Bridge did not become ready on $BridgeUrl within 45s.
In the bridge window: run ``agent login`` (or set CURSOR_API_KEY), then re-run this script.
Keep the bridge window open while using prime-agent.
"@
    }
    Start-Sleep -Seconds 2
  }
  Write-Host "Bridge is up."
} else {
  Write-Host "Bridge already up."
}

Set-Location $RepoRoot
Write-Host ""
Write-Host "Launching Prime Agent as Dev Manager harness (no prod data)..."
Write-Host "Slash command available: /dev-manager"
Write-Host ""

# Seed the session with the project /dev-manager template + workplan pointer.
# --provider/--model reinforce Auto; project .prime/agent/settings.json also defaults to auto.
& prime-agent `
  --cwd $RepoRoot `
  --provider cursor `
  --model auto `
  --thinking high `
  --prompt-template $DevManagerPrompt `
  --goal "You are DIAL Dev Manager inside Prime (D-61). Load /dev-manager. Read docs/planning/DIAL_Build_Workplan_STATE.md and continue current_stage with auto-advance. PRIORITY 0 env+push first. No production data. Do not switch models off Cursor Auto." `
  -- `
  "/dev-manager"
