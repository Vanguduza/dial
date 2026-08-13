# Wrapper for scripts/patch-prime-agent-windows-handshake.mjs (D-61 Windows handshake).
$ErrorActionPreference = "Stop"
$script = Join-Path $PSScriptRoot "patch-prime-agent-windows-handshake.mjs"
node $script
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
