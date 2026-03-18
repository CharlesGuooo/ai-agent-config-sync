# AI Agent Config Sync - Windows Installation Script
# Usage: .\install.ps1 [claude|codex|opencode|all]
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

function Check-Dependencies {
    Write-Host "Checking dependencies..." -ForegroundColor Cyan
    Write-Host ""

    $missing = @()

    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
    } catch {
        $missing += "Node.js"
    }

    # Check npx
    try {
        $npxVersion = npx --version 2>&1
        Write-Host "  ✓ npx available" -ForegroundColor Green
    } catch {
        $missing += "npx"
    }

    # Check Python (optional)
    try {
        $pythonVersion = python --version 2>&1
        Write-Host "  ✓ $pythonVersion" -ForegroundColor Green
    } catch {
        try {
            $pythonVersion = python3 --version 2>&1
            Write-Host "  ✓ $pythonVersion" -ForegroundColor Green
        } catch {
            Write-Host "  ℹ Python not found (optional)" -ForegroundColor Blue
        }
    }

    if ($missing.Count -gt 0) {
        Write-Host ""
        Write-Host "Missing required dependencies:" -ForegroundColor Red
        foreach ($dep in $missing) {
            Write-Host "  ✗ $dep" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "Please install them first:"
        Write-Host "  - Node.js: https://nodejs.org/"
        Write-Host ""
        exit 1
    }

    Write-Host ""
}

function Replace-EnvPlaceholders {
    param([string]$file)

    $content = Get-Content $file -Raw

    # Replace placeholders
    $content = $content -replace '\$\{HOME\}', $env:USERPROFILE
    $content = $content -replace '\$HOME', $env:USERPROFILE
    $content = $content -replace '\$\{PROJECTS_DIR:-~/projects\}', "$env:USERPROFILE\projects"
    $content = $content -replace '\$\{PROJECTS_DIR\}', "$env:USERPROFILE\projects"

    Set-Content $file $content -NoNewline
}

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

    # Replace env placeholders
    Replace-EnvPlaceholders "$ClaudeDir\settings.json"

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

    # Create .env if not exists
    if (-not (Test-Path "$ClaudeDir\.env")) {
        Copy-Item "$ScriptDir\.env.example" "$ClaudeDir\.env"
        Write-Host "  ℹ Created ~/.claude/.env - please fill in your API keys" -ForegroundColor Blue
    }

    # Create projects directory
    $projectsDir = "$env:USERPROFILE\projects"
    if (-not (Test-Path $projectsDir)) {
        New-Item -ItemType Directory -Force -Path $projectsDir | Out-Null
        Write-Host "  ℹ Created $projectsDir" -ForegroundColor Blue
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

    # Replace env placeholders
    Replace-EnvPlaceholders "$OpenCodeDir\opencode.json"

    # Copy skills (Windows doesn't support symlinks well, so we copy)
    if (Test-Path "$ScriptDir\shared\skills") {
        Get-ChildItem "$OpenCodeDir\skills" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\shared\skills\*" "$OpenCodeDir\skills\" -Recurse -Force
    }

    Write-Host "✓ OpenCode config installed" -ForegroundColor Green
}

function Show-PostInstall {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              Installation Complete!                    ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""

    # Count skills
    $skillCount = (Get-ChildItem "$ClaudeDir\skills" -Directory -ErrorAction SilentlyContinue).Count
    Write-Host "Skills installed: $skillCount directories" -ForegroundColor Green
    Write-Host ""

    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Configure API Keys:" -ForegroundColor Blue
    Write-Host "     notepad $ClaudeDir\.env" -ForegroundColor Green
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
    Write-Host ""
    Write-Host "  3. Verify bypass permissions:" -ForegroundColor Blue
    Write-Host "     - Check $ClaudeDir\settings.json"
    Write-Host "     - Should have: `"defaultMode`": `"bypassPermissions`""
    Write-Host ""
    Write-Host "Documentation: https://github.com/CharlesGuooo/ai-agent-config-sync" -ForegroundColor Blue
    Write-Host ""
}

# Main installation logic
Check-Dependencies

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

Show-PostInstall
