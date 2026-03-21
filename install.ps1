# AI Agent Config Sync - Windows Installation Script
# Usage: .\install.ps1 [claude|codex|opencode|cursor|all|projects]
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
$OpenCodeSkillsDir = "$env:USERPROFILE\.opencode"
$CursorDir = "$env:USERPROFILE\.cursor"

# 项目目录
$Projects = @(
    "scientific-project",
    "database-project",
    "data-analysis-project",
    "dev-project",
    "marketing-project",
    "research-project",
    "office-project",
    "productivity-project"
)

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

    if ($missing.Count -gt 0) {
        Write-Host ""
        Write-Host "Missing required dependencies:" -ForegroundColor Red
        foreach ($dep in $missing) {
            Write-Host "  [missing] $dep" -ForegroundColor Red
        }
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

function Install-CoreSkills {
    param(
        [string]$TargetDir,
        [string]$ToolName
    )

    Write-Host "Installing Core Skills for $ToolName..." -ForegroundColor Yellow

    $SkillsDir = Join-Path $TargetDir "skills"
    New-Item -ItemType Directory -Force -Path $SkillsDir | Out-Null

    if (Test-Path "$ScriptDir\core-skills") {
        Get-ChildItem $SkillsDir -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\core-skills\*" $SkillsDir -Recurse -Force
        $count = (Get-ChildItem $SkillsDir | Measure-Object).Count
        Write-Host "  [synced] Core Skills ($count items)" -ForegroundColor Green
    }
}

function Install-ProjectSkills {
    Write-Host "Installing Project-level Skills..." -ForegroundColor Yellow

    foreach ($project in $Projects) {
        $projectDir = Join-Path $env:USERPROFILE "$project\.claude"
        $sourceDir = Join-Path $ScriptDir "project-skills\$project"

        if (Test-Path $sourceDir) {
            New-Item -ItemType Directory -Force -Path $projectDir | Out-Null
            $skillsDestDir = Join-Path $projectDir "skills"
            if (Test-Path $skillsDestDir) {
                Remove-Item $skillsDestDir -Recurse -Force -ErrorAction SilentlyContinue
            }
            Copy-Item $sourceDir $skillsDestDir -Recurse -Force
            $count = (Get-ChildItem $skillsDestDir | Measure-Object).Count
            Write-Host "  [synced] ~\$project\.claude\skills\ ($count skills)" -ForegroundColor Green
        }
    }
}

function Install-Claude {
    Write-Host "Installing Claude Code config..." -ForegroundColor Yellow

    New-Item -ItemType Directory -Force -Path $ClaudeDir | Out-Null
    New-Item -ItemType Directory -Force -Path "$ClaudeDir\index" | Out-Null
    New-Item -ItemType Directory -Force -Path "$ClaudeDir\mcp-servers" | Out-Null

    Copy-Item "$ScriptDir\claude-code\CLAUDE.md" "$ClaudeDir\CLAUDE.md" -Force
    Copy-IfMissing "$ScriptDir\claude-code\settings.json" "$ClaudeDir\settings.json" "~/.claude/settings.json"

    # 安装 Core Skills
    Install-CoreSkills $ClaudeDir "Claude Code"

    # 安装索引
    if (Test-Path "$ScriptDir\shared\index") {
        Get-ChildItem "$ClaudeDir\index" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Copy-Item "$ScriptDir\shared\index\*" "$ClaudeDir\index\" -Recurse -Force
        Write-Host "  [synced] ~/.claude/index/" -ForegroundColor Green
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
    New-Item -ItemType Directory -Force -Path "$CodexDir\index" | Out-Null

    Copy-Item "$ScriptDir\codex\AGENTS.md" "$CodexDir\AGENTS.md" -Force
    Copy-IfMissing "$ScriptDir\codex\config.toml" "$CodexDir\config.toml" "~/.codex/config.toml"

    # 安装 Core Skills
    Install-CoreSkills $CodexDir "Codex"

    # 安装索引
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
    New-Item -ItemType Directory -Force -Path $OpenCodeSkillsDir | Out-Null

    Copy-Item "$ScriptDir\opencode\AGENTS.md" "$OpenCodeDir\AGENTS.md" -Force
    Copy-IfMissing "$ScriptDir\opencode\opencode.json" "$OpenCodeDir\opencode.json" "~/.config/opencode/opencode.json"

    # 复制 config.json (skills 目录配置)
    if (Test-Path "$ScriptDir\opencode\config.json") {
        Copy-Item "$ScriptDir\opencode\config.json" "$OpenCodeSkillsDir\config.json" -Force
        Write-Host "  [synced] ~/.opencode/config.json" -ForegroundColor Green
    }

    # 安装 Core Skills 到 ~/.opencode/skills/
    Install-CoreSkills $OpenCodeSkillsDir "OpenCode"

    Write-Host "[ok] OpenCode config installed" -ForegroundColor Green
}

function Install-Cursor {
    Write-Host "Installing Cursor IDE config..." -ForegroundColor Yellow

    New-Item -ItemType Directory -Force -Path "$CursorDir\rules" | Out-Null

    Copy-Item "$ScriptDir\cursor\global-rules.md" "$CursorDir\rules\global-rules.md" -Force
    Copy-IfMissing "$ScriptDir\cursor\mcp.json" "$CursorDir\mcp.json" "~/.cursor/mcp.json"

    # 安装 Core Skills
    Install-CoreSkills $CursorDir "Cursor"

    Write-Host "[ok] Cursor IDE config installed" -ForegroundColor Green
}

function Show-PostInstall {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "Installation Complete!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "Architecture:" -ForegroundColor Yellow
    Write-Host "  Core Skills (16):    ~/.claude/skills/ - loaded every session"
    Write-Host "  Project Skills:      ~/xxx-project/.claude/skills/ - loaded per project"
    Write-Host ""

    Write-Host "Four tools configured:" -ForegroundColor Yellow
    Write-Host "  - Claude Code: ~/.claude/"
    Write-Host "  - Codex CLI:   ~/.codex/"
    Write-Host "  - OpenCode:    ~/.opencode/"
    Write-Host "  - Cursor IDE:  ~/.cursor/"
    Write-Host ""

    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  claude                          # Load Core Skills only"
    Write-Host "  cd ~/dev-project; claude        # Load Core + Dev Skills"
    Write-Host "  cd ~/scientific-project; claude # Load Core + Scientific Skills"
    Write-Host ""

    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Configure API Keys:" -ForegroundColor Blue
    Write-Host "     notepad $ClaudeDir\.env"
    Write-Host ""
    Write-Host "  2. Run '.\install.ps1 projects' to install project-level skills" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Documentation: https://github.com/CharlesGuooo/ai-agent-config-sync" -ForegroundColor Blue
}

Check-Dependencies

switch ($Target.ToLower()) {
    "claude" { Install-Claude }
    "codex" { Install-Codex }
    "opencode" { Install-OpenCode }
    "cursor" { Install-Cursor }
    "projects" { Install-ProjectSkills }
    "all" {
        Install-Claude
        Install-Codex
        Install-OpenCode
        Install-Cursor
    }
    default {
        Write-Host "Unknown target: $Target" -ForegroundColor Red
        Write-Host "Usage: .\install.ps1 [claude|codex|opencode|cursor|all|projects]"
        exit 1
    }
}

Show-PostInstall
