# install.ps1 — single-entry installer for ai-agent-config-sync
# Usage:
#   .\scripts\install.ps1                          # full install
#   .\scripts\install.ps1 -Agents claude,codex     # subset
#   .\scripts\install.ps1 -Packs dev,finance       # subset of project packs
#   .\scripts\install.ps1 -SkipMcp                 # skills + system prompts only
#   .\scripts\install.ps1 -GlobalOnly              # 37 global skills only
#   .\scripts\install.ps1 -DryRun                  # plan but don't write
#   .\scripts\install.ps1 -PersistEnv              # also write env vars to Windows User scope
#
# Do NOT install claude-mem (retired 2026-07) — see INSTALL.md "Do not install".
[CmdletBinding()]
param(
    [string[]]$Agents = @('claude','cursor','codex','opencode'),
    # Keep in lockstep with sync.ps1 / sync.sh — this default OVERRIDES theirs.
    [string[]]$Packs = @('dev','finance','ios','data','marketing','research','productivity','craft'),
    [switch]$SkipMcp,
    [switch]$GlobalOnly,
    [switch]$DryRun,
    [switch]$PersistEnv
)

$repoRoot = Split-Path -Parent $PSScriptRoot
& "$PSScriptRoot\sync.ps1" -Agents $Agents -Packs $Packs `
    -SkipMcp:$SkipMcp -GlobalOnly:$GlobalOnly -DryRun:$DryRun -PersistEnv:$PersistEnv
