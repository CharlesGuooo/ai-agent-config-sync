param(
  [switch]$PersistUserEnv,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$homeDir = [Environment]::GetFolderPath("UserProfile")
$backupDir = Join-Path $homeDir ".agent-config-backup"

# Auto-discover project packs from repo directory
$projectPacks = @(Get-ChildItem -Directory (Join-Path $repoRoot "skills/project-packs") | ForEach-Object { $_.Name })
$requiredEnv = @(
  "GITHUB_PERSONAL_ACCESS_TOKEN",
  "Z_AI_API_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_REF",
  "EXPO_TOKEN",
  "BRAVE_API_KEY"
)

function Ensure-Directory {
  param([string]$Path)
  New-Item -ItemType Directory -Force -Path $Path | Out-Null
}

function Import-DotEnv {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return
  }

  foreach ($rawLine in Get-Content $Path) {
    $line = $rawLine.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      continue
    }
    $parts = $line.Split("=", 2)
    if ($parts.Length -ne 2) {
      continue
    }
    $name = $parts[0].Trim()
    $value = $parts[1]
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

function Get-EnvValue {
  param(
    [string]$Name,
    [switch]$Optional
  )

  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if (-not $value) {
    $value = [Environment]::GetEnvironmentVariable($Name, "User")
    if ($value) {
      [Environment]::SetEnvironmentVariable($Name, $value, "Process")
    }
  }
  if (-not $value -and -not $Optional) {
    throw "Missing required environment variable: $Name"
  }
  return $value
}

function Persist-UserEnvValue {
  param([string]$Name, [string]$Value)
  if ($Value) {
    [Environment]::SetEnvironmentVariable($Name, $Value, "User")
  }
}

function Backup-Directory {
  param([string]$Path)
  if (Test-Path $Path) {
    $ts = Get-Date -Format "yyyyMMdd-HHmmss"
    $rel = $Path.Replace($homeDir, "").TrimStart("\", "/").Replace("\", "_").Replace("/", "_")
    $dest = Join-Path $backupDir "$ts/$rel"
    Ensure-Directory $dest
    $null = & robocopy $Path $dest /MIR /NFL /NDL /NJH /NJS /NP
  }
}

function Sync-Directory {
  param([string]$Source, [string]$Destination)

  if ($DryRun) {
    Write-Host "[dry-run] SYNC $Source -> $Destination"
    return
  }
  Backup-Directory $Destination
  Ensure-Directory $Destination
  $null = & robocopy $Source $Destination /MIR /NFL /NDL /NJH /NJS /NP /XD .git __pycache__ /XF *.pyc *.pyo
  if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed for $Source -> $Destination with exit code $LASTEXITCODE"
  }
}

function Overlay-Directory {
  param([string]$Source, [string]$Destination)
  if ($DryRun) {
    Write-Host "[dry-run] OVERLAY $Source -> $Destination"
    return
  }
  Ensure-Directory $Destination
  $null = & robocopy $Source $Destination /E /NFL /NDL /NJH /NJS /NP /XD .git __pycache__ /XF *.pyc *.pyo
  if ($LASTEXITCODE -gt 7) {
    throw "robocopy overlay failed for $Source -> $Destination with exit code $LASTEXITCODE"
  }
}

function Write-Utf8Json {
  param([string]$Path, $Object)
  $json = $Object | ConvertTo-Json -Depth 100
  [System.IO.File]::WriteAllText($Path, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
}

function Read-JsonOrEmpty {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return [pscustomobject]@{}
  }
  return (Get-Content -Raw $Path | ConvertFrom-Json)
}

Import-DotEnv (Join-Path $repoRoot ".env")

foreach ($name in $requiredEnv) {
  $value = Get-EnvValue $name
  if ($PersistUserEnv) {
    Persist-UserEnvValue $name $value
  }
}

$firecrawlKey = Get-EnvValue "FIRECRAWL_API_KEY" -Optional
if ($PersistUserEnv -and $firecrawlKey) {
  Persist-UserEnvValue "FIRECRAWL_API_KEY" $firecrawlKey
}

# Global skills
Sync-Directory (Join-Path $repoRoot "skills/global/common") (Join-Path $homeDir ".claude/skills")
Sync-Directory (Join-Path $repoRoot "skills/global/common") (Join-Path $homeDir ".codex/skills")
Sync-Directory (Join-Path $repoRoot "skills/global/common") (Join-Path $homeDir ".cursor/skills")
Sync-Directory (Join-Path $repoRoot "skills/global/common") (Join-Path $homeDir ".config/opencode/skills")
Sync-Directory (Join-Path $repoRoot "skills/global/common") (Join-Path $homeDir ".opencode/skills")
Sync-Directory (Join-Path $repoRoot "skills/global/codex-system") (Join-Path $homeDir ".codex/skills/.system")

# Home-level design skills (overlay on top of global common)
$homeDesignSource = Join-Path $repoRoot "skills/global/home-design"
if (Test-Path $homeDesignSource) {
  Overlay-Directory $homeDesignSource (Join-Path $homeDir ".claude/skills")
  Overlay-Directory $homeDesignSource (Join-Path $homeDir ".codex/skills")
  Overlay-Directory $homeDesignSource (Join-Path $homeDir ".cursor/skills")
  Overlay-Directory $homeDesignSource (Join-Path $homeDir ".config/opencode/skills")
  Overlay-Directory $homeDesignSource (Join-Path $homeDir ".opencode/skills")
}

# Skill index (deploy to all 4 agents)
$indexSource = Join-Path $repoRoot "skills/index"
if (Test-Path $indexSource) {
  Sync-Directory $indexSource (Join-Path $homeDir ".claude/index")
  Sync-Directory $indexSource (Join-Path $homeDir ".codex/index")
  Sync-Directory $indexSource (Join-Path $homeDir ".opencode/index")
  Sync-Directory $indexSource (Join-Path $homeDir ".cursor/index")
}

# Agent-specific extras
Sync-Directory (Join-Path $repoRoot "agents/cursor/skills-cursor") (Join-Path $homeDir ".cursor/skills-cursor")
Sync-Directory (Join-Path $repoRoot "agents/opencode/command") (Join-Path $homeDir ".opencode/command")
Sync-Directory (Join-Path $repoRoot "agents/opencode/command") (Join-Path $homeDir ".config/opencode/command")
Sync-Directory (Join-Path $repoRoot "agents/claude/commands") (Join-Path $homeDir ".claude/commands")

# Local project packs (deploy to all 4 agents)
foreach ($pack in $projectPacks) {
  $source = Join-Path $repoRoot "skills/project-packs/$pack/skills"
  Sync-Directory $source (Join-Path $homeDir "$pack/.claude/skills")
  Sync-Directory $source (Join-Path $homeDir "$pack/.codex/skills")
  Sync-Directory $source (Join-Path $homeDir "$pack/.opencode/skills")
  Sync-Directory $source (Join-Path $homeDir "$pack/.cursor/skills")

  # Project-level instruction files
  $instrFile = Join-Path $repoRoot "skills/project-packs/$pack/instructions.md"
  if (Test-Path $instrFile) {
    $projDir = Join-Path $homeDir $pack
    Ensure-Directory (Join-Path $projDir ".claude")
    Ensure-Directory (Join-Path $projDir ".cursor/rules")
    Copy-Item -Force $instrFile (Join-Path $projDir ".claude/CLAUDE.md")
    Copy-Item -Force $instrFile (Join-Path $projDir "AGENTS.md")
    Copy-Item -Force $instrFile (Join-Path $projDir ".cursor/rules/project.md")
  }
}

# Codex
Ensure-Directory (Join-Path $homeDir ".codex/profiles")
Copy-Item -Force (Join-Path $repoRoot "agents/codex/config.toml") (Join-Path $homeDir ".codex/config.toml")
Copy-Item -Force (Join-Path $repoRoot "agents/codex/profiles/full.toml") (Join-Path $homeDir ".codex/profiles/full.toml")
Copy-Item -Force (Join-Path $repoRoot "agents/codex/profiles/development.toml") (Join-Path $homeDir ".codex/profiles/development.toml")
Copy-Item -Force (Join-Path $repoRoot "agents/codex/profiles/minimal.toml") (Join-Path $homeDir ".codex/profiles/minimal.toml")
Copy-Item -Force (Join-Path $repoRoot "agents/codex/profiles/switch.ps1") (Join-Path $homeDir ".codex/profiles/switch.ps1")
Copy-Item -Force (Join-Path $repoRoot "agents/codex/profiles/switch.sh") (Join-Path $homeDir ".codex/profiles/switch.sh")
Copy-Item -Force (Join-Path $repoRoot "agents/codex/AGENTS.md") (Join-Path $homeDir "AGENTS.md")
Copy-Item -Force (Join-Path $repoRoot "agents/codex/AGENTS.local.md") (Join-Path $homeDir ".codex/AGENTS.md")

# Cursor
Ensure-Directory (Join-Path $homeDir ".cursor")
Ensure-Directory (Join-Path $homeDir ".cursor/rules")
Copy-Item -Force (Join-Path $repoRoot "agents/cursor/mcp.json") (Join-Path $homeDir ".cursor/mcp.json")
Copy-Item -Force (Join-Path $repoRoot "agents/cursor/global-rules.md") (Join-Path $homeDir ".cursor/global-rules.md")
Copy-Item -Force (Join-Path $repoRoot "agents/cursor/rules/global-rules.md") (Join-Path $homeDir ".cursor/rules/global-rules.md")

# OpenCode (deploy to both ~/.config/opencode and ~/.opencode)
Ensure-Directory (Join-Path $homeDir ".config/opencode")
Ensure-Directory (Join-Path $homeDir ".opencode")
Copy-Item -Force (Join-Path $repoRoot "agents/opencode/opencode.json") (Join-Path $homeDir ".config/opencode/opencode.json")
Copy-Item -Force (Join-Path $repoRoot "agents/opencode/AGENTS.md") (Join-Path $homeDir ".config/opencode/AGENTS.md")
Copy-Item -Force (Join-Path $repoRoot "agents/opencode/opencode.json") (Join-Path $homeDir ".opencode/opencode.json")
Copy-Item -Force (Join-Path $repoRoot "agents/opencode/AGENTS.md") (Join-Path $homeDir ".opencode/AGENTS.md")

# Claude instruction file
Ensure-Directory (Join-Path $homeDir ".claude")
Copy-Item -Force (Join-Path $repoRoot "agents/claude/CLAUDE.md") (Join-Path $homeDir ".claude/CLAUDE.md")

# Claude MCP merge
$claudeTemplateText = Get-Content -Raw (Join-Path $repoRoot "agents/claude/mcp-servers.template.json")
$replacements = @{
  "__GITHUB_PERSONAL_ACCESS_TOKEN__" = Get-EnvValue "GITHUB_PERSONAL_ACCESS_TOKEN"
  "__Z_AI_API_KEY__" = Get-EnvValue "Z_AI_API_KEY"
  "__SUPABASE_ACCESS_TOKEN__" = Get-EnvValue "SUPABASE_ACCESS_TOKEN"
  "__EXPO_TOKEN__" = Get-EnvValue "EXPO_TOKEN"
  "__BRAVE_API_KEY__" = Get-EnvValue "BRAVE_API_KEY"
  "__SUPABASE_PROJECT_REF__" = Get-EnvValue "SUPABASE_PROJECT_REF"
}
foreach ($pair in $replacements.GetEnumerator()) {
  $claudeTemplateText = $claudeTemplateText.Replace($pair.Key, $pair.Value)
}
$claudeTemplate = $claudeTemplateText | ConvertFrom-Json
if ($firecrawlKey) {
  $claudeTemplate.mcpServers | Add-Member -Force -NotePropertyName "firecrawl" -NotePropertyValue ([pscustomobject]@{
    command = "cmd"
    args = @("/c", "npx", "-y", "firecrawl-mcp@3.11.0")
    env = [pscustomobject]@{
      FIRECRAWL_API_KEY = $firecrawlKey
    }
  })
}

foreach ($claudePath in @((Join-Path $homeDir ".claude.json"), (Join-Path $homeDir ".claude/settings.json"))) {
  $root = Read-JsonOrEmpty $claudePath
  $root | Add-Member -Force -NotePropertyName "mcpServers" -NotePropertyValue $claudeTemplate.mcpServers
  Ensure-Directory (Split-Path -Parent $claudePath)
  Write-Utf8Json $claudePath $root
}

# Optional firecrawl for Cursor
if ($firecrawlKey) {
  $cursorPath = Join-Path $homeDir ".cursor/mcp.json"
  $cursor = Get-Content -Raw $cursorPath | ConvertFrom-Json
  $cursor.mcpServers | Add-Member -Force -NotePropertyName "firecrawl" -NotePropertyValue ([pscustomobject]@{
    command = "npx"
    args = @("-y", "firecrawl-mcp@3.11.0")
    env = [pscustomobject]@{
      FIRECRAWL_API_KEY = $firecrawlKey
    }
  })
  Write-Utf8Json $cursorPath $cursor
}

# Optional firecrawl for OpenCode (both config locations)
if ($firecrawlKey) {
  foreach ($openCodePath in @((Join-Path $homeDir ".config/opencode/opencode.json"), (Join-Path $homeDir ".opencode/opencode.json"))) {
    $openCode = Get-Content -Raw $openCodePath | ConvertFrom-Json
    $openCode.mcp | Add-Member -Force -NotePropertyName "firecrawl" -NotePropertyValue ([pscustomobject]@{
      type = "local"
      command = @("npx", "-y", "firecrawl-mcp@3.11.0")
      environment = [pscustomobject]@{
        FIRECRAWL_API_KEY = $firecrawlKey
      }
    })
    Write-Utf8Json $openCodePath $openCode
  }
}

if ($DryRun) {
  Write-Host "Dry-run complete. No files were modified."
} else {
  Write-Host "Sync complete. Backup at: $backupDir"
}
