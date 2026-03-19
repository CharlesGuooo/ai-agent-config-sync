# AI Agent Config Sync Script for Windows PowerShell
# 将此仓库的配置同步到本地系统

$ErrorActionPreference = "Stop"
$REPO_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$CLAUDE_DIR = "$env:USERPROFILE\.claude"
$CODEX_DIR = "$env:USERPROFILE\.codex"
$OPENCODE_DIR = "$env:USERPROFILE\.config\opencode"

function Sync-DirectoryContents {
    param(
        [string]$Source,
        [string]$Destination
    )

    if (-not (Test-Path $Source)) {
        return
    }

    if (-not (Test-Path $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }

    Get-ChildItem $Destination -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
    Copy-Item "$Source\*" "$Destination\" -Recurse -Force
}

Write-Host "=== AI Agent Config Sync ===" -ForegroundColor Cyan
Write-Host "Repository: $REPO_DIR"
Write-Host ""

# Claude Code
Write-Host "Syncing Claude Code config..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $CLAUDE_DIR -Force | Out-Null
Copy-Item "$REPO_DIR\claude-code\CLAUDE.md" "$CLAUDE_DIR\CLAUDE.md" -Force
Sync-DirectoryContents "$REPO_DIR\shared\skills" "$CLAUDE_DIR\skills"
Sync-DirectoryContents "$REPO_DIR\shared\index" "$CLAUDE_DIR\index"
Write-Host "  - CLAUDE.md"
Write-Host "  - shared skills"
Write-Host "  - shared index"
Write-Host "  - preserved existing settings.json/provider config"

# MCP Server (if exists)
if (Test-Path "$REPO_DIR\claude-code\mcp-servers\smart_search_mcp.py") {
    $mcpDir = "$CLAUDE_DIR\mcp-servers"
    if (-not (Test-Path $mcpDir)) {
        New-Item -ItemType Directory -Path $mcpDir -Force | Out-Null
    }
    Copy-Item "$REPO_DIR\claude-code\mcp-servers\smart_search_mcp.py" "$mcpDir\" -Force
    Write-Host "  - mcp-servers/smart_search_mcp.py"
}

# Codex
Write-Host ""
Write-Host "Syncing Codex config..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $CODEX_DIR -Force | Out-Null
Copy-Item "$REPO_DIR\codex\AGENTS.md" "$CODEX_DIR\AGENTS.md" -Force
Sync-DirectoryContents "$REPO_DIR\shared\skills" "$CODEX_DIR\skills"
Sync-DirectoryContents "$REPO_DIR\shared\index" "$CODEX_DIR\index"
Write-Host "  - AGENTS.md"
Write-Host "  - shared skills"
Write-Host "  - shared index"
Write-Host "  - preserved existing config.toml/provider config"

# OpenCode
Write-Host ""
Write-Host "Syncing OpenCode config..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $OPENCODE_DIR -Force | Out-Null
Copy-Item "$REPO_DIR\opencode\AGENTS.md" "$OPENCODE_DIR\AGENTS.md" -Force
Sync-DirectoryContents "$REPO_DIR\shared\skills" "$OPENCODE_DIR\skills"
Write-Host "  - AGENTS.md"
Write-Host "  - shared skills"
Write-Host "  - preserved existing opencode.json/provider config"

Write-Host ""
Write-Host "=== Sync Complete ===" -ForegroundColor Green
Write-Host "Note: provider/API config files were intentionally preserved to avoid breaking local setups" -ForegroundColor Gray
