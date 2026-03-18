# AI Agent Config Sync Script for Windows PowerShell
# 将此仓库的配置同步到本地系统

$ErrorActionPreference = "Stop"
$REPO_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== AI Agent Config Sync ===" -ForegroundColor Cyan
Write-Host "Repository: $REPO_DIR"
Write-Host ""

# Claude Code
Write-Host "Syncing Claude Code config..." -ForegroundColor Yellow
Copy-Item "$REPO_DIR\claude-code\CLAUDE.md" "$env:USERPROFILE\.claude\CLAUDE.md" -Force
Copy-Item "$REPO_DIR\claude-code\settings.json" "$env:USERPROFILE\.claude\settings.json" -Force
Copy-Item "$REPO_DIR\claude-code\skills\skill-rules.json" "$env:USERPROFILE\.claude\skills\skill-rules.json" -Force
Write-Host "  - CLAUDE.md"
Write-Host "  - settings.json"
Write-Host "  - skill-rules.json"

# MCP Server (if exists)
if (Test-Path "$REPO_DIR\claude-code\mcp-servers\smart_search_mcp.py") {
    $mcpDir = "$env:USERPROFILE\.claude\mcp-servers"
    if (-not (Test-Path $mcpDir)) {
        New-Item -ItemType Directory -Path $mcpDir -Force | Out-Null
    }
    Copy-Item "$REPO_DIR\claude-code\mcp-servers\smart_search_mcp.py" "$mcpDir\" -Force
    Write-Host "  - mcp-servers/smart_search_mcp.py"
}

# Codex
if (Test-Path "$env:USERPROFILE\.codex") {
    Write-Host ""
    Write-Host "Syncing Codex config..." -ForegroundColor Yellow
    Copy-Item "$REPO_DIR\codex\config.toml" "$env:USERPROFILE\.codex\config.toml" -Force
    Write-Host "  - config.toml"
}

Write-Host ""
Write-Host "=== Sync Complete ===" -ForegroundColor Green
Write-Host "Note: API keys need to be set separately via environment variables" -ForegroundColor Gray
