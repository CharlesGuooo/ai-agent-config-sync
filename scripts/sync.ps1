# sync.ps1 — copy repo content to live machine locations (Windows)
# Called by install.ps1; can be invoked directly.

[CmdletBinding()]
param(
    [string[]]$Agents = @('claude','cursor','codex','opencode'),
    [string[]]$Packs = @('dev','finance','ios','data','marketing','research','productivity','craft'),
    [switch]$SkipMcp,
    [switch]$GlobalOnly,
    [switch]$DryRun,
    [switch]$PersistEnv
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$homeDir = $HOME
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $homeDir ".agent-config-backup\$timestamp"

if ($GlobalOnly) { $Packs = @() }

$packDirMap = @{
    'dev'          = 'dev-project'
    'finance'      = 'finance-project'
    'ios'          = 'ios-project'
    'data'         = 'data-analysis-project'
    'marketing'    = 'marketing-project'
    'research'     = 'research-project'
    'productivity' = 'productivity-project'
    'craft'        = 'craft-project'
}

function Get-AgentSkillDir($agent) {
    switch ($agent) {
        'claude'   { '.claude\skills' }
        'cursor'   { '.cursor\skills' }
        'codex'    { '.codex\skills' }
        'opencode' { '.opencode\skills' }
    }
}

function Log($msg) { Write-Host "[sync] $msg" }

function Load-EnvFile {
    $envFile = Join-Path $repoRoot '.env'
    if (-not (Test-Path $envFile)) { return }
    Get-Content $envFile | ForEach-Object {
        $line = $_ -replace '#.*$', ''
        $line = $line.Trim()
        if ($line -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
        }
    }
}

function Backup-Target($path) {
    if (-not (Test-Path $path)) { return }
    if ($DryRun) { return }
    $rel = ($path -replace [regex]::Escape($homeDir + '\'), '') -replace '\\', '_'
    $bk = Join-Path $backupDir $rel
    New-Item -ItemType Directory -Force -Path $bk | Out-Null
    Copy-Item -Path "$path\*" -Destination $bk -Recurse -Force -ErrorAction SilentlyContinue
}

function Sync-Dir($src, $dst) {
    if (-not (Test-Path $src)) { return }
    if ($DryRun) {
        Write-Host "[dry-run] SYNC $src -> $dst"
        return
    }
    Backup-Target $dst
    New-Item -ItemType Directory -Force -Path $dst | Out-Null
    # robocopy: /MIR mirror, /XJ exclude junctions, /XD __pycache__
    robocopy $src $dst /MIR /XJ /XD __pycache__ .git /NJH /NJS /NDL /NC /NS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) {
        Write-Warning "robocopy reported issues syncing $src -> $dst (exit=$LASTEXITCODE)"
    }
}

function Copy-File($src, $dst) {
    if (-not (Test-Path $src)) { return }
    if ($DryRun) {
        Write-Host "[dry-run] COPY $src -> $dst"
        return
    }
    $parent = Split-Path -Parent $dst
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
    Copy-Item -Path $src -Destination $dst -Force
}

Load-EnvFile

# ---- 0. Regenerate skill tables from the single source (skills/global/) ----
# Keeps every agent's "Global Skills" table in lockstep with the actual skill
# directories. In dry-run we only verify (non-mutating); a drift failure aborts.
function Invoke-SkillTableGen {
    $gen = Join-Path $repoRoot 'scripts\gen-skill-table.mjs'
    if (-not (Test-Path $gen)) { return }
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Warning "node not found — skipping skill-table regen (using committed tables)"
        return
    }
    if ($DryRun) {
        Write-Host "[dry-run] node scripts/gen-skill-table.mjs --check"
        & node $gen --check
        if ($LASTEXITCODE -ne 0) { throw "skill tables are out of date — run: node scripts/gen-skill-table.mjs" }
    } else {
        & node $gen
        if ($LASTEXITCODE -ne 0) { throw "skill-table generation failed (exit=$LASTEXITCODE)" }
    }
}
Log "Regenerating skill tables..."
Invoke-SkillTableGen

# ---- 0b. Regenerate HARNESS.md pack index, then copy it to home ----
function Invoke-HarnessGen {
    $gen = Join-Path $repoRoot 'scripts\gen-harness.mjs'
    if (-not (Test-Path $gen)) { return }
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return }
    if ($DryRun) {
        & node $gen --check
        if ($LASTEXITCODE -ne 0) { throw "HARNESS.md is out of date — run: node scripts/gen-harness.mjs" }
    } else {
        & node $gen
        if ($LASTEXITCODE -ne 0) { throw "gen-harness failed (exit=$LASTEXITCODE)" }
    }
}
Invoke-HarnessGen
Log "Copying HARNESS.md -> home..."
Copy-File (Join-Path $repoRoot 'HARNESS.md') (Join-Path $homeDir 'HARNESS.md')

# ---- 1. Global skills ----
Log "Syncing global skills..."
foreach ($a in $Agents) {
    Sync-Dir (Join-Path $repoRoot 'skills\global') (Join-Path $homeDir ".$a\skills")
}

# ---- 2. Codex .system ----
if ($Agents -contains 'codex') {
    Log "Syncing Codex .system skills..."
    Sync-Dir (Join-Path $repoRoot 'skills\codex-system') (Join-Path $homeDir '.codex\skills\.system')
}

# ---- 3. Project packs ----
if (-not $GlobalOnly) {
    Log "Syncing project packs..."
    foreach ($p in $Packs) {
        $packDirName = $packDirMap[$p]
        if (-not $packDirName) { Log "  skip $p (unknown pack)"; continue }
        $packRootRepo = Join-Path $repoRoot "skills\project-packs\$packDirName"
        $packRootLive = Join-Path $homeDir $packDirName
        if (-not (Test-Path $packRootRepo)) { Log "  skip $p (not in repo)"; continue }

        Get-ChildItem -Path $packRootRepo -Filter 'skills' -Directory -Recurse | ForEach-Object {
            $skillsSrc = $_.FullName
            $parent = Split-Path -Parent $skillsSrc
            $rel = $parent.Substring($packRootRepo.Length).TrimStart('\')
            $subPath = if ($rel) { Join-Path $packRootLive $rel } else { $packRootLive }
            foreach ($a in $Agents) {
                $dst = Join-Path $subPath (Get-AgentSkillDir $a)
                Sync-Dir $skillsSrc $dst
            }
        }
    }
}

# ---- 4. Agent system prompts ----
Log "Syncing agent system prompts..."
if ($Agents -contains 'claude') {
    Copy-File (Join-Path $repoRoot 'agents\claude\CLAUDE.md') (Join-Path $homeDir '.claude\CLAUDE.md')
    Sync-Dir  (Join-Path $repoRoot 'agents\claude\commands') (Join-Path $homeDir '.claude\commands')
}
if ($Agents -contains 'cursor') {
    Copy-File (Join-Path $repoRoot 'agents\cursor\global-rules.md') (Join-Path $homeDir '.cursor\global-rules.md')
    Copy-File (Join-Path $repoRoot 'agents\cursor\rules\global-rules.md') (Join-Path $homeDir '.cursor\rules\global-rules.md')
    Sync-Dir  (Join-Path $repoRoot 'agents\cursor\skills-cursor') (Join-Path $homeDir '.cursor\skills-cursor')
}
if ($Agents -contains 'codex') {
    Copy-File (Join-Path $repoRoot 'agents\codex\AGENTS.md') (Join-Path $homeDir '.codex\AGENTS.md')
    Copy-File (Join-Path $repoRoot 'agents\codex\AGENTS.local.md') (Join-Path $homeDir 'AGENTS.md')
    Sync-Dir  (Join-Path $repoRoot 'agents\codex\profiles') (Join-Path $homeDir '.codex\profiles')
}
if ($Agents -contains 'opencode') {
    Copy-File (Join-Path $repoRoot 'agents\opencode\AGENTS.md') (Join-Path $homeDir '.opencode\AGENTS.md')
    Copy-File (Join-Path $repoRoot 'agents\opencode\AGENTS.md') (Join-Path $homeDir '.config\opencode\AGENTS.md')
    Sync-Dir  (Join-Path $repoRoot 'agents\opencode\command') (Join-Path $homeDir '.opencode\command')
    Sync-Dir  (Join-Path $repoRoot 'agents\opencode\command') (Join-Path $homeDir '.config\opencode\command')
}

# ---- 4b. Hooks: shared guard + formatter scripts, plus Claude settings merge ----
$hooksDir = Join-Path $homeDir '.agent-hooks'
Log "Installing hook scripts -> $hooksDir"
Sync-Dir (Join-Path $repoRoot 'scripts\hooks') $hooksDir
if ($Agents -contains 'claude') {
    $frag   = Join-Path $repoRoot 'agents\claude\settings.fragment.json'
    $merge  = Join-Path $repoRoot 'scripts\merge-claude-settings.mjs'
    $target = Join-Path $homeDir '.claude\settings.json'
    if (Get-Command node -ErrorAction SilentlyContinue) {
        Log "Merging Claude settings fragment (LSP plugins + hooks)..."
        if ($DryRun) { & node $merge $frag $target $hooksDir --dry-run }
        else { & node $merge $frag $target $hooksDir }
    } else {
        Write-Warning "node not found — skipping Claude settings merge (LSP + hooks)"
    }
}

# ---- 5. MCP + main config files (skipped if -SkipMcp) ----
# Cursor's mcp.json, Codex's config.toml, and OpenCode's opencode.json carry
# the MCP blocks. The full live versions at agents/<agent>/<file> are the source
# of truth. mcp/always-on/ is used only for Claude's .claude.json merge.
if (-not $SkipMcp) {
    Log "Applying MCP + main configs..."
    if ($Agents -contains 'claude') {
        $template = Get-Content (Join-Path $repoRoot 'mcp\always-on\claude.template.json') -Raw | ConvertFrom-Json
        $target = Join-Path $homeDir '.claude.json'
        if ($DryRun) {
            Write-Host "[dry-run] MERGE claude.template.json -> $target"
        } else {
            $existing = if (Test-Path $target) { Get-Content $target -Raw | ConvertFrom-Json } else { @{} | ConvertTo-Json | ConvertFrom-Json }
            $existing | Add-Member -MemberType NoteProperty -Name 'mcpServers' -Value $template.mcpServers -Force
            $existing | ConvertTo-Json -Depth 20 | Set-Content -Path $target -Encoding UTF8
        }
    }
    if ($Agents -contains 'cursor') {
        Copy-File (Join-Path $repoRoot 'agents\cursor\mcp.json') (Join-Path $homeDir '.cursor\mcp.json')
    }
    if ($Agents -contains 'codex') {
        $codexTarget = Join-Path $homeDir '.codex\config.toml'
        Copy-File (Join-Path $repoRoot 'agents\codex\config.toml') $codexTarget
        # Resolve the {{HOOKS_DIR}} placeholder in the copied config.
        if (-not $DryRun -and (Test-Path $codexTarget)) {
            $hd = (Join-Path $homeDir '.agent-hooks') -replace '\\', '/'
            (Get-Content $codexTarget -Raw).Replace('{{HOOKS_DIR}}', $hd) | Set-Content -Path $codexTarget -Encoding UTF8
        }
    }
    if ($Agents -contains 'opencode') {
        Copy-File (Join-Path $repoRoot 'agents\opencode\opencode.json') (Join-Path $homeDir '.opencode\opencode.json')
        Copy-File (Join-Path $repoRoot 'agents\opencode\opencode.json') (Join-Path $homeDir '.config\opencode\opencode.json')
    }
    # opt-in templates → ~/MCP-Templates/
    Sync-Dir (Join-Path $repoRoot 'mcp\opt-in') (Join-Path $homeDir 'MCP-Templates')
}

# ---- 6. Persist env vars (Windows User scope) ----
if ($PersistEnv) {
    Log "Persisting .env keys to Windows User-scope environment..."
    $envFile = Join-Path $repoRoot '.env'
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            $line = $_ -replace '#.*$', ''
            if ($line -match '^\s*([^=]+)=(.+)$') {
                $k = $matches[1].Trim()
                $v = $matches[2].Trim()
                if ($v) {
                    if ($DryRun) {
                        Write-Host "[dry-run] setx $k = (***)"
                    } else {
                        [Environment]::SetEnvironmentVariable($k, $v, 'User')
                    }
                }
            }
        }
    }
}

# ---- Summary ----
if ($DryRun) {
    Log "Dry-run complete — no files modified."
} else {
    Log "Sync complete."
    Log "  Backups: $backupDir"
    Log "  Agents:  $($Agents -join ',')"
    Log "  Packs:   $(if ($Packs) { $Packs -join ',' } else { 'none' })"
    Log "  MCP:     $(if ($SkipMcp) { 'skipped' } else { 'applied' })"
}
