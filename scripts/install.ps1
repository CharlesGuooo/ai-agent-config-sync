# install.ps1 — single-entry installer for ai-agent-config-sync
# Usage:
#   .\scripts\install.ps1                          # full install
#   .\scripts\install.ps1 -Agents claude,codex     # subset
#   .\scripts\install.ps1 -Packs dev,finance       # subset of project packs
#   .\scripts\install.ps1 -SkipMcp                 # skills + system prompts only
#   .\scripts\install.ps1 -GlobalOnly              # 30 global skills only
#   .\scripts\install.ps1 -DryRun                  # plan but don't write
#   .\scripts\install.ps1 -PersistEnv              # also write env vars to Windows User scope
[CmdletBinding()]
param(
    [string[]]$Agents = @('claude','cursor','codex','opencode'),
    [string[]]$Packs = @('dev','finance','ios','data','marketing','research','productivity'),
    [switch]$SkipMcp,
    [switch]$GlobalOnly,
    [switch]$DryRun,
    [switch]$PersistEnv
)

$repoRoot = Split-Path -Parent $PSScriptRoot
& "$PSScriptRoot\sync.ps1" -Agents $Agents -Packs $Packs `
    -SkipMcp:$SkipMcp -GlobalOnly:$GlobalOnly -DryRun:$DryRun -PersistEnv:$PersistEnv
