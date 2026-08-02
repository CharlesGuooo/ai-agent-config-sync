#!/usr/bin/env bash
# sync.sh — copy repo content to live machine locations
# Called by install.sh; can also be invoked directly.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
home_dir="$HOME"
backup_dir="$home_dir/.agent-config-backup/$(date +%Y%m%d-%H%M%S)"

# ---- Parse flags ----
agents="claude,cursor,codex,opencode"
packs="dev,finance,ios,data,marketing,research,productivity,craft"
skip_mcp=0
global_only=0
dry_run=0

for arg in "$@"; do
  case "$arg" in
    --agents=*)    agents="${arg#--agents=}" ;;
    --packs=*)     packs="${arg#--packs=}" ;;
    --skip-mcp)    skip_mcp=1 ;;
    --global-only) global_only=1; packs="" ;;
    --dry-run)     dry_run=1 ;;
    --persist-env) ;; # no-op on Unix
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

IFS=',' read -ra AGENTS <<< "$agents"
IFS=',' read -ra PACKS <<< "$packs"

# ---- Helpers ----
log() { echo "[sync] $*"; }
dryecho() { if [[ "$dry_run" -eq 1 ]]; then echo "[dry-run] $*"; fi; }

need_cmd() {
  for c in "$@"; do
    command -v "$c" >/dev/null 2>&1 || { echo "missing required command: $c" >&2; exit 1; }
  done
}
if [[ "$dry_run" -eq 0 ]]; then
  need_cmd rsync jq
fi

# ---- Load .env ----
if [[ -f "$repo_root/.env" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" ]] && continue
    if [[ "$line" == *=* ]]; then
      key="${line%%=*}"
      value="${line#*=}"
      export "$key=$value"
    fi
  done < "$repo_root/.env"
fi

# ---- Backup + sync helpers ----
backup_target() {
  local target="$1"
  if [[ -d "$target" && "$dry_run" -eq 0 ]]; then
    local rel; rel="${target#"$home_dir/"}"
    rel="${rel//\//_}"
    local bk="$backup_dir/$rel"
    mkdir -p "$bk"
    rsync -a "$target"/ "$bk"/
  fi
}

sync_dir() {
  local src="$1" dst="$2"
  if [[ ! -d "$src" ]]; then return; fi
  if [[ "$dry_run" -eq 1 ]]; then
    echo "[dry-run] SYNC $src -> $dst"
    return
  fi
  backup_target "$dst"
  mkdir -p "$dst"
  rsync -a --delete --exclude ".git" --exclude "__pycache__" --exclude "*.pyc" "$src"/ "$dst"/
}

copy_file() {
  local src="$1" dst="$2"
  if [[ ! -f "$src" ]]; then return; fi
  if [[ "$dry_run" -eq 1 ]]; then
    echo "[dry-run] COPY $src -> $dst"
    return
  fi
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
}

agent_in() {
  local a="$1"; shift
  for x in "${AGENTS[@]}"; do [[ "$x" == "$a" ]] && return 0; done
  return 1
}

pack_in() {
  local p="$1"; shift
  for x in "${PACKS[@]}"; do [[ "$x" == "$p" ]] && return 0; done
  return 1
}

# Map agent-name → live dir suffix
agent_skill_dir() {
  case "$1" in
    claude)   echo ".claude/skills" ;;
    cursor)   echo ".cursor/skills" ;;
    codex)    echo ".codex/skills" ;;
    opencode) echo ".opencode/skills" ;;
  esac
}

# ---- 0. Regenerate skill tables from the single source (skills/global/) ----
# Keeps every agent's "Global Skills" table in lockstep with the actual skill
# directories. In dry-run we only verify (non-mutating); drift aborts the run.
gen_script="$repo_root/scripts/gen-skill-table.mjs"
if [[ -f "$gen_script" ]]; then
  if command -v node >/dev/null 2>&1; then
    log "Regenerating skill tables..."
    if [[ "$dry_run" -eq 1 ]]; then
      node "$gen_script" --check || { echo "skill tables out of date — run: node scripts/gen-skill-table.mjs" >&2; exit 1; }
    else
      node "$gen_script"
    fi
  else
    echo "[sync] node not found — skipping skill-table regen (using committed tables)" >&2
  fi
fi

# ---- 0b. Regenerate HARNESS.md pack index, then copy it to home ----
harness_gen="$repo_root/scripts/gen-harness.mjs"
if [[ -f "$harness_gen" ]] && command -v node >/dev/null 2>&1; then
  if [[ "$dry_run" -eq 1 ]]; then
    node "$harness_gen" --check || { echo "HARNESS.md out of date — run: node scripts/gen-harness.mjs" >&2; exit 1; }
  else
    node "$harness_gen"
  fi
fi
copy_file "$repo_root/HARNESS.md" "$home_dir/HARNESS.md"
# PLAYBOOK.md — human-facing usage manual; also lets an agent on this machine
# answer "how do I use these skills?" without reading the repo.
copy_file "$repo_root/PLAYBOOK.md" "$home_dir/PLAYBOOK.md"

# ---- 1. Global skills (38) → all 4 agents ----
log "Syncing global skills..."
for a in "${AGENTS[@]}"; do
  sync_dir "$repo_root/skills/global" "$home_dir/.${a}/skills"
done

# ---- 2. Codex .system (5) → Codex only ----
if agent_in codex; then
  log "Syncing Codex .system skills..."
  sync_dir "$repo_root/skills/codex-system" "$home_dir/.codex/skills/.system"
fi

# ---- 3. Project packs ----
# Pack name map: short flag → repo dir name
declare -A PACK_DIR=(
  [dev]=dev-project
  [finance]=finance-project
  [ios]=ios-project
  [data]=data-analysis-project
  [marketing]=marketing-project
  [research]=research-project
  [productivity]=productivity-project
  [craft]=craft-project
)

if [[ "$global_only" -eq 0 ]]; then
  log "Syncing project packs..."
  for p in "${PACKS[@]}"; do
    pack_root_repo="$repo_root/skills/project-packs/${PACK_DIR[$p]:-$p}"
    pack_root_live="$home_dir/${PACK_DIR[$p]:-$p}"
    [[ ! -d "$pack_root_repo" ]] && { log "  skip $p (not in repo)"; continue; }

    # Walk every 'skills/' subdir under pack_root_repo
    while IFS= read -r -d '' skills_src; do
      parent="$(dirname "$skills_src")"
      rel="${parent#"$pack_root_repo"}"
      rel="${rel#/}"            # e.g. '' or 'frontend' or 'advisory/ib'
      sub_path="${pack_root_live}"
      [[ -n "$rel" ]] && sub_path="${pack_root_live}/${rel}"
      for a in "${AGENTS[@]}"; do
        sync_dir "$skills_src" "${sub_path}/$(agent_skill_dir "$a")"
      done
    done < <(find "$pack_root_repo" -type d -name skills -print0)
  done
fi

# ---- 4. Agent system prompts ----
log "Syncing agent system prompts..."
if agent_in claude; then
  copy_file "$repo_root/agents/claude/CLAUDE.md" "$home_dir/.claude/CLAUDE.md"
  sync_dir  "$repo_root/agents/claude/commands"  "$home_dir/.claude/commands"
fi
if agent_in cursor; then
  copy_file "$repo_root/agents/cursor/global-rules.md"        "$home_dir/.cursor/global-rules.md"
  copy_file "$repo_root/agents/cursor/rules/global-rules.md"  "$home_dir/.cursor/rules/global-rules.md"
  sync_dir  "$repo_root/agents/cursor/skills-cursor"          "$home_dir/.cursor/skills-cursor"
fi
if agent_in codex; then
  copy_file "$repo_root/agents/codex/AGENTS.md"       "$home_dir/.codex/AGENTS.md"
  copy_file "$repo_root/agents/codex/AGENTS.local.md" "$home_dir/AGENTS.md"
  sync_dir  "$repo_root/agents/codex/profiles"        "$home_dir/.codex/profiles"
fi
if agent_in opencode; then
  copy_file "$repo_root/agents/opencode/AGENTS.md"      "$home_dir/.opencode/AGENTS.md"
  copy_file "$repo_root/agents/opencode/AGENTS.md"      "$home_dir/.config/opencode/AGENTS.md"
  sync_dir  "$repo_root/agents/opencode/command"        "$home_dir/.opencode/command"
  sync_dir  "$repo_root/agents/opencode/command"        "$home_dir/.config/opencode/command"
fi

# ---- 4b. Hooks: shared guard + formatter scripts, plus Claude settings merge ----
hooks_dir="$home_dir/.agent-hooks"
log "Installing hook scripts -> $hooks_dir"
sync_dir "$repo_root/scripts/hooks" "$hooks_dir"
if agent_in claude; then
  frag="$repo_root/agents/claude/settings.fragment.json"
  merge="$repo_root/scripts/merge-claude-settings.mjs"
  target="$home_dir/.claude/settings.json"
  if command -v node >/dev/null 2>&1; then
    log "Merging Claude settings fragment (LSP plugins + hooks)..."
    if [[ "$dry_run" -eq 1 ]]; then node "$merge" "$frag" "$target" "$hooks_dir" --dry-run; else node "$merge" "$frag" "$target" "$hooks_dir"; fi
  else
    echo "[sync] node not found — skipping Claude settings merge (LSP + hooks)" >&2
  fi
fi

# ---- 5. MCP + main config files (skipped if --skip-mcp) ----
# Cursor's mcp.json, Codex's config.toml, and OpenCode's opencode.json all carry
# MCP blocks. The full live versions are at agents/<agent>/<file>; the extracted
# MCP-only views are at mcp/always-on/. We copy the full files by default since
# they are the source of truth; mcp/always-on/ is used only for Claude's
# .claude.json merge (Claude has no equivalent full file in agents/claude/).
if [[ "$skip_mcp" -eq 0 ]]; then
  log "Applying MCP + main configs..."
  if agent_in claude; then
    template="$repo_root/mcp/always-on/claude.template.json"
    target="$home_dir/.claude.json"
    if [[ "$dry_run" -eq 1 ]]; then
      echo "[dry-run] MERGE $template -> $target (mcpServers block)"
    else
      [[ ! -f "$target" ]] && echo '{}' > "$target"
      jq --slurpfile inc "$template" '.mcpServers = $inc[0].mcpServers' "$target" > "${target}.tmp"
      mv "${target}.tmp" "$target"
    fi
  fi
  if agent_in cursor; then
    copy_file "$repo_root/agents/cursor/mcp.json" "$home_dir/.cursor/mcp.json"
  fi
  if agent_in codex; then
    codex_target="$home_dir/.codex/config.toml"
    copy_file "$repo_root/agents/codex/config.toml" "$codex_target"
    # Resolve the {{HOOKS_DIR}} placeholder in the copied config.
    if [[ "$dry_run" -eq 0 && -f "$codex_target" ]]; then
      hd="${hooks_dir//\\//}"
      sed -i.bak "s|{{HOOKS_DIR}}|$hd|g" "$codex_target" && rm -f "${codex_target}.bak"
    fi
  fi
  if agent_in opencode; then
    copy_file "$repo_root/agents/opencode/opencode.json" "$home_dir/.opencode/opencode.json"
    copy_file "$repo_root/agents/opencode/opencode.json" "$home_dir/.config/opencode/opencode.json"
  fi

  # Opt-in templates → ~/MCP-Templates/ (same path on Win/Mac/Linux)
  sync_dir "$repo_root/mcp/opt-in" "$home_dir/MCP-Templates"
fi

# ---- Summary ----
if [[ "$dry_run" -eq 1 ]]; then
  log "Dry-run complete — no files modified."
else
  log "Sync complete."
  log "  Backups: $backup_dir"
  log "  Agents: ${AGENTS[*]}"
  log "  Packs:  ${PACKS[*]:-none}"
  log "  MCP:    $([[ "$skip_mcp" -eq 1 ]] && echo skipped || echo applied)"
fi
