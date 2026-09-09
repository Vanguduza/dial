$ErrorActionPreference = 'Stop'
git config core.hooksPath .githooks
Write-Host "Project Truth hooks enabled for $(git rev-parse --show-toplevel)"
