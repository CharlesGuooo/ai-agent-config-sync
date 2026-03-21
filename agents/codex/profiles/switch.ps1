param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("full", "development", "minimal")]
  [string]$Profile
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$source = Join-Path $repoRoot "agents/codex/profiles/$Profile.toml"
$targetDir = Join-Path $HOME ".codex"
$target = Join-Path $targetDir "config.toml"

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Copy-Item -Force $source $target

Write-Host "Switched Codex profile to '$Profile'."
