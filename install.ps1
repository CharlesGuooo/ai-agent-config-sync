# AI Agent Config Sync - Windows Installation Script
# Usage: .\install.ps1 [claude|codex|opencode|all]

param(
    [string]$Target = "all"
)

$ErrorActionPreference = "Stop"

# Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ClaudeDir = "$env:USERPROFILE\.claude"
$CodexDir = "$env:USERPROFILE\.codex"
$OpenCodeDir = "$env:USERPROFILE\.config\opencode"

function Install-Claude {
    Write-Host "Installing Claude Code config..." -ForegroundColor Yellow

    # Create directories
    New-Item -ItemType Directory -Force -Path $ClaudeDir | Out-Null
    New-Item -ItemType Directory -Force -Path "$ClaudeDir\skills" | Out-Null
    New-Item -ItemType Directory -Force -Path "$ClaudeDir\index" | Out-Null
    New-Item -ItemType Directory -Force -Path "$ClaudeDir\mcp-servers" | Out-Null

    # Copy core config
    Copy-Item "$ScriptDir\claude-code\CLAUDE.md" "$ClaudeDir\CLAUDE.md" -Force
    Copy-Item "$ScriptDir\claude-code\settings.json" "$ClaudeDir\settings.json" -Force

    # Copy skills
    if (Test-Path "$ScriptDir\shared\skills") {
        Get-ChildItem "$ClaudeDir\skills" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\shared\skills\*" "$ClaudeDir\skills\" -Recurse -Force
    }

    # Copy index
    if (Test-Path "$ScriptDir\shared\index") {
        Get-ChildItem "$ClaudeDir\index" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\shared\index\*" "$ClaudeDir\index\" -Recurse -Force
    }

    # Copy MCP servers
    if (Test-Path "$ScriptDir\claude-code\mcp-servers") {
        Copy-Item "$ScriptDir\claude-code\mcp-servers\*" "$ClaudeDir\mcp-servers\" -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Host "✓ Claude Code config installed" -ForegroundColor Green
}

function Install-Codex {
    Write-Host "Installing Codex config..." -ForegroundColor Yellow

    # Create directories
    New-Item -ItemType Directory -Force -Path $CodexDir | Out-Null
    New-Item -ItemType Directory -Force -Path "$CodexDir\skills" | Out-Null
    New-Item -ItemType Directory -Force -Path "$CodexDir\index" | Out-Null

    # Copy core config
    Copy-Item "$ScriptDir\codex\AGENTS.md" "$CodexDir\AGENTS.md" -Force
    Copy-Item "$ScriptDir\codex\config.toml" "$CodexDir\config.toml" -Force

    # Copy skills
    if (Test-Path "$ScriptDir\shared\skills") {
        Get-ChildItem "$CodexDir\skills" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\shared\skills\*" "$CodexDir\skills\" -Recurse -Force
    }

    # Copy index
    if (Test-Path "$ScriptDir\shared\index") {
        Get-ChildItem "$CodexDir\index" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\shared\index\*" "$CodexDir\index\" -Recurse -Force
    }

    Write-Host "✓ Codex config installed" -ForegroundColor Green
}

function Install-OpenCode {
    Write-Host "Installing OpenCode config..." -ForegroundColor Yellow

    # Create directories
    New-Item -ItemType Directory -Force -Path $OpenCodeDir | Out-Null
    New-Item -ItemType Directory -Force -Path "$OpenCodeDir\skills" | Out-Null

    # Copy core config
    Copy-Item "$ScriptDir\opencode\AGENTS.md" "$OpenCodeDir\AGENTS.md" -Force
    Copy-Item "$ScriptDir\opencode\opencode.json" "$OpenCodeDir\opencode.json" -Force

    # Copy skills (Windows doesn't support symlinks well, so we copy)
    if (Test-Path "$ScriptDir\shared\skills") {
        Get-ChildItem "$OpenCodeDir\skills" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\shared\skills\*" "$OpenCodeDir\skills\" -Recurse -Force
    }

    Write-Host "✓ OpenCode config installed" -ForegroundColor Green
}

# Main installation logic
switch ($Target.ToLower()) {
    "claude" { Install-Claude }
    "codex" { Install-Codex }
    "opencode" { Install-OpenCode }
    "all" {
        Install-Claude
        Install-Codex
        Install-OpenCode
    }
    default {
        Write-Host "Unknown target: $Target" -ForegroundColor Red
        Write-Host "Usage: .\install.ps1 [claude|codex|opencode|all]"
        exit 1
    }
}

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Copy .env.example to ~/.claude/.env and fill in your API keys"
Write-Host "2. Restart your AI agent (Claude Code / Codex / OpenCode)"
Write-Host ""

# Count skills
$skillCount = (Get-ChildItem "$ClaudeDir\skills" -Directory -ErrorAction SilentlyContinue).Count
Write-Host "Skills installed: $skillCount directories"
