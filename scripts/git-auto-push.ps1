# Safe post-commit auto-push to origin (Vanguduza/dial).
# Never force-pushes. Exits 0 when there is nothing to push.
$ErrorActionPreference = 'Stop'

foreach ($arg in $args) {
  if ($arg -in @('-f', '--force', '--force-with-lease')) {
    Write-Error "git-auto-push: refusing force push ($arg)"
    exit 1
  }
}

$root = $null
try {
  $root = (& git rev-parse --show-toplevel 2>$null | Select-Object -First 1)
} catch {
  $root = $null
}
if (-not $root) {
  Write-Error 'git-auto-push: not a git repository'
  exit 1
}
Set-Location $root

$originCheck = & git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0 -or -not $originCheck) {
  Write-Error "git-auto-push: no 'origin' remote - configure https://github.com/Vanguduza/dial.git (or SSH equivalent)"
  exit 1
}
$originUrl = (& git remote get-url origin | Select-Object -First 1)
if ($originUrl -notmatch '(?i)Vanguduza/dial') {
  Write-Warning "git-auto-push: origin is not Vanguduza/dial ($originUrl)"
}

$branch = (& git rev-parse --abbrev-ref HEAD | Select-Object -First 1)
if ($branch -eq 'HEAD') {
  Write-Host 'git-auto-push: detached HEAD - skip push'
  exit 0
}

$upstreamSym = '@' + '{u}'
$hasUpstream = $true
$ErrorActionPreference = 'Continue'
& git rev-parse --abbrev-ref --symbolic-full-name $upstreamSym 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  $hasUpstream = $false
}
$ErrorActionPreference = 'Stop'

if ($hasUpstream) {
  $range = $upstreamSym + '..HEAD'
  $ahead = (& git rev-list --count $range 2>$null | Select-Object -First 1)
  if (-not $ahead) { $ahead = '0' }
  if ($ahead -eq '0') {
    Write-Host "git-auto-push: nothing to push ($branch)"
    exit 0
  }
  Write-Host "git-auto-push: pushing $branch to origin ($ahead commit(s) ahead)"
  & git push
  if ($LASTEXITCODE -ne 0) {
    Write-Error 'git-auto-push: git push failed'
    exit 1
  }
} else {
  Write-Host "git-auto-push: no upstream - git push -u origin HEAD ($branch)"
  & git push -u origin HEAD
  if ($LASTEXITCODE -ne 0) {
    Write-Error 'git-auto-push: git push -u failed'
    exit 1
  }
}

Write-Host 'git-auto-push: ok'
exit 0
