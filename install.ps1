# AI Agent Config Sync - Windows Installation Script
# Usage: .\install.ps1 [claude|codex|opencode|cursor|all]
# Default: all

param(
    [string]$Target = "all"
)

$ErrorActionPreference = "Stop"

# Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ClaudeDir = "$env:USERPROFILE\.claude"
$CodexDir = "$env:USERPROFILE\.codex"
$OpenCodeDir = "$env:USERPROFILE\.config\opencode"
$CursorDir = "$env:USERPROFILE\.cursor"

function Check-Dependencies {
    Write-Host "Checking dependencies..." -ForegroundColor Cyan
    Write-Host ""

    $missing = @()

    try {
        $nodeVersion = node --version
        Write-Host "  [ok] Node.js $nodeVersion" -ForegroundColor Green
    } catch {
        $missing += "Node.js"
    }

    try {
        $null = npx --version 2>&1
        Write-Host "  [ok] npx available" -ForegroundColor Green
    } catch {
        $missing += "npx"
    }

    try {
        $pythonVersion = python --version 2>&1
        Write-Host "  [ok] $pythonVersion" -ForegroundColor Green
    } catch {
        try {
            $pythonVersion = python3 --version 2>&1
            Write-Host "  [ok] $pythonVersion" -ForegroundColor Green
        } catch {
            Write-Host "  [info] Python not found (optional)" -ForegroundColor Blue
        }
    }

    if ($missing.Count -gt 0) {
        Write-Host ""
        Write-Host "Missing required dependencies:" -ForegroundColor Red
        foreach ($dep in $missing) {
            Write-Host "  [missing] $dep" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "Please install them first:"
        Write-Host "  - Node.js: https://nodejs.org/"
        Write-Host ""
        exit 1
    }

    Write-Host ""
}

function Copy-IfMissing {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Label
    )

    if (Test-Path $Destination) {
        Write-Host "  [preserved] $Label" -ForegroundColor Blue
        return
    }

    Copy-Item $Source $Destination -Force
    Write-Host "  [created] $Label" -ForegroundColor Green
}

function Install-Claude {
    Write-Host "Installing Claude Code config..." -ForegroundColor Yellow

    New-Item -ItemType Directory -Force -Path $ClaudeDir | Out-Null
    New-Item -ItemType Directory -Force -Path "$ClaudeDir\skills" | Out-Null
    New-Item -ItemType Directory -Force -Path "$ClaudeDir\index" | Out-Null
    New-Item -ItemType Directory -Force -Path "$ClaudeDir\mcp-servers" | Out-Null

    Copy-Item "$ScriptDir\claude-code\CLAUDE.md" "$ClaudeDir\CLAUDE.md" -Force
    Copy-IfMissing "$ScriptDir\claude-code\settings.json" "$ClaudeDir\settings.json" "~/.claude/settings.json"

    if (Test-Path "$ScriptDir\shared\skills") {
        Get-ChildItem "$ClaudeDir\skills" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\shared\skills\*" "$ClaudeDir\skills\" -Recurse -Force
        $skillCount = (Get-ChildItem "$ClaudeDir\skills" -Directory).Count
        Write-Host "  [synced] ~/.claude/skills/ ($skillCount skills)" -ForegroundColor Green
    }

    if (Test-Path "$ScriptDir\shared\index") {
        Get-ChildItem "$ClaudeDir\index" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\shared\index\*" "$ClaudeDir\index\" -Recurse -Force
        Write-Host "  [synced] ~/.claude/index/" -ForegroundColor Green
    }

    if (Test-Path "$ScriptDir\claude-code\mcp-servers") {
        Copy-Item "$ScriptDir\claude-code\mcp-servers\*" "$ClaudeDir\mcp-servers\" -Recurse -Force -ErrorAction SilentlyContinue
    }

    if (-not (Test-Path "$ClaudeDir\.env")) {
        Copy-Item "$ScriptDir\.env.example" "$ClaudeDir\.env"
        Write-Host "  [created] ~/.claude/.env - please fill in your API keys" -ForegroundColor Blue
    }

    Write-Host "[ok] Claude Code config installed" -ForegroundColor Green
}

function Install-Codex {
    Write-Host "Installing Codex config..." -ForegroundColor Yellow

    New-Item -ItemType Directory -Force -Path $CodexDir | Out-Null
    New-Item -ItemType Directory -Force -Path "$CodexDir\skills" | Out-Null
    New-Item -ItemType Directory -Force -Path "$CodexDir\index" | Out-Null

    Copy-Item "$ScriptDir\codex\AGENTS.md" "$CodexDir\AGENTS.md" -Force
    Copy-IfMissing "$ScriptDir\codex\config.toml" "$CodexDir\config.toml" "~/.codex/config.toml"

    if (Test-Path "$ScriptDir\shared\skills") {
        Get-ChildItem "$CodexDir\skills" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\shared\skills\*" "$CodexDir\skills\" -Recurse -Force
        Write-Host "  [synced] ~/.codex/skills/" -ForegroundColor Green
    }

    if (Test-Path "$ScriptDir\shared\index") {
        Get-ChildItem "$CodexDir\index" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\shared\index\*" "$CodexDir\index\" -Recurse -Force
        Write-Host "  [synced] ~/.codex/index/" -ForegroundColor Green
    }

    Write-Host "[ok] Codex config installed" -ForegroundColor Green
}

function Install-OpenCode {
    Write-Host "Installing OpenCode config..." -ForegroundColor Yellow

    New-Item -ItemType Directory -Force -Path $OpenCodeDir | Out-Null
    New-Item -ItemType Directory -Force -Path "$OpenCodeDir\skills" | Out-Null

    Copy-Item "$ScriptDir\opencode\AGENTS.md" "$OpenCodeDir\AGENTS.md" -Force
    Copy-IfMissing "$ScriptDir\opencode\opencode.json" "$OpenCodeDir\opencode.json" "~/.config/opencode/opencode.json"

    if (Test-Path "$ScriptDir\shared\skills") {
        Get-ChildItem "$OpenCodeDir\skills" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\shared\skills\*" "$OpenCodeDir\skills\" -Recurse -Force
        Write-Host "  [synced] ~/.config/opencode/skills/" -ForegroundColor Green
    }

    Write-Host "[ok] OpenCode config installed" -ForegroundColor Green
}

function Install-Cursor {
    Write-Host "Installing Cursor IDE config..." -ForegroundColor Yellow

    New-Item -ItemType Directory -Force -Path "$CursorDir\rules" | Out-Null

    Copy-Item "$ScriptDir\cursor\global-rules.md" "$CursorDir\rules\global-rules.md" -Force
    Copy-IfMissing "$ScriptDir\cursor\mcp.json" "$CursorDir\mcp.json" "~/.cursor/mcp.json"

    Write-Host "[ok] Cursor IDE config installed" -ForegroundColor Green
    Write-Host "[note] For project-level skills, create symlinks in each project:" -ForegroundColor Blue
    Write-Host "  New-Item -ItemType Junction -Path 'your-project\.cursor\skills' -Target '$ClaudeDir\skills'"
}

function Show-PostInstall {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "Installation Complete!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "Four tools configured:" -ForegroundColor Yellow
    Write-Host "  - Claude Code: ~/.claude/"
    Write-Host "  - Codex CLI:   ~/.codex/"
    Write-Host "  - OpenCode:    ~/.config/opencode/"
    Write-Host "  - Cursor IDE:  ~/.cursor/"
    Write-Host ""

    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Configure API Keys:" -ForegroundColor Blue
    Write-Host "     notepad $ClaudeDir\.env"
    Write-Host ""
    Write-Host "     Required keys:"
    Write-Host "       - ANTHROPIC_AUTH_TOKEN (Claude Code)"
    Write-Host "       - GITHUB_TOKEN (GitHub MCP)"
    Write-Host ""
    Write-Host "     Optional keys:"
    Write-Host "       - OPENAI_API_KEY (Codex)"
    Write-Host "       - FIRECRAWL_API_KEY (Web scraping)"
    Write-Host ""
    Write-Host "  2. Restart your AI agents:" -ForegroundColor Blue
    Write-Host "     - Claude Code: claude"
    Write-Host "     - Codex: codex"
    Write-Host "     - OpenCode: opencode"
    Write-Host "     - Cursor: Open project directory"
    Write-Host ""
    Write-Host "Documentation: https://github.com/CharlesGuooo/ai-agent-config-sync" -ForegroundColor Blue
    Write-Host ""
}

Check-Dependencies

switch ($Target.ToLower()) {
    "claude" { Install-Claude }
    "codex" { Install-Codex }
    "opencode" { Install-OpenCode }
    "cursor" { Install-Cursor }
    "all" {
        Install-Claude
        Install-Codex
        Install-OpenCode
        Install-Cursor
    }
    default {
        Write-Host "Unknown target: $Target" -ForegroundColor Red
        Write-Host "Usage: .\install.ps1 [claude|codex|opencode|cursor|all]"
        exit 1
    }
}

Show-PostInstall
