#!/usr/bin/env bash
set -euo pipefail

persist_env=0
dry_run=0
for arg in "$@"; do
  case "$arg" in
    --persist-env) persist_env=1 ;;
    --dry-run)     dry_run=1 ;;
  esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
home_dir="$HOME"
backup_dir="$home_dir/.agent-config-backup"

for cmd in rsync jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "missing required command: $cmd" >&2
    exit 1
  fi
done

# Safe .env parsing — line-by-line key=value, no shell execution
if [[ -f "$repo_root/.env" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"          # strip comments
    line="${line#"${line%%[![:space:]]*}"}"  # trim leading whitespace
    line="${line%"${line##*[![:space:]]}"}"  # trim trailing whitespace
    [[ -z "$line" ]] && continue
    if [[ "$line" == *=* ]]; then
      key="${line%%=*}"
      value="${line#*=}"
      export "$key=$value"
    fi
  done < "$repo_root/.env"
fi

required_env=(
  GITHUB_PERSONAL_ACCESS_TOKEN
  Z_AI_API_KEY
  SUPABASE_ACCESS_TOKEN
  SUPABASE_PROJECT_REF
  EXPO_TOKEN
  BRAVE_API_KEY
)

for name in "${required_env[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "missing required environment variable: $name" >&2
    exit 1
  fi
done

backup_dir_fn() {
  local target="$1"
  if [[ -d "$target" ]]; then
    local ts; ts="$(date +%Y%m%d-%H%M%S)"
    local rel; rel="${target#"$home_dir/"}"
    rel="${rel//\//_}"
    local bk="$backup_dir/$ts/$rel"
    mkdir -p "$bk"
    rsync -a "$target"/ "$bk"/
  fi
}

sync_dir() {
  local source="$1"
  local dest="$2"
  if [[ "$dry_run" -eq 1 ]]; then
    echo "[dry-run] SYNC $source -> $dest"
    return
  fi
  backup_dir_fn "$dest"
  mkdir -p "$dest"
  rsync -a --delete --exclude ".git" --exclude "__pycache__" --exclude "*.pyc" --exclude "*.pyo" "$source"/ "$dest"/
}

# Auto-discover project packs from repo directory
project_packs=()
for d in "$repo_root"/skills/project-packs/*/; do
  [[ -d "$d" ]] && project_packs+=("$(basename "$d")")
done

sync_dir "$repo_root/skills/global/common" "$home_dir/.claude/skills"
sync_dir "$repo_root/skills/global/common" "$home_dir/.codex/skills"
sync_dir "$repo_root/skills/global/common" "$home_dir/.cursor/skills"
sync_dir "$repo_root/skills/global/common" "$home_dir/.config/opencode/skills"
sync_dir "$repo_root/skills/global/common" "$home_dir/.opencode/skills"
sync_dir "$repo_root/skills/global/codex-system" "$home_dir/.codex/skills/.system"

# Skill index (deploy to all 4 agents)
if [[ -d "$repo_root/skills/index" ]]; then
  sync_dir "$repo_root/skills/index" "$home_dir/.claude/index"
  sync_dir "$repo_root/skills/index" "$home_dir/.codex/index"
  sync_dir "$repo_root/skills/index" "$home_dir/.opencode/index"
  sync_dir "$repo_root/skills/index" "$home_dir/.cursor/index"
fi

sync_dir "$repo_root/agents/cursor/skills-cursor" "$home_dir/.cursor/skills-cursor"
sync_dir "$repo_root/agents/opencode/command" "$home_dir/.opencode/command"
sync_dir "$repo_root/agents/opencode/command" "$home_dir/.config/opencode/command"
sync_dir "$repo_root/agents/claude/commands" "$home_dir/.claude/commands"

for pack in "${project_packs[@]}"; do
  sync_dir "$repo_root/skills/project-packs/$pack/skills" "$home_dir/$pack/.claude/skills"
  sync_dir "$repo_root/skills/project-packs/$pack/skills" "$home_dir/$pack/.codex/skills"
  sync_dir "$repo_root/skills/project-packs/$pack/skills" "$home_dir/$pack/.opencode/skills"
  sync_dir "$repo_root/skills/project-packs/$pack/skills" "$home_dir/$pack/.cursor/skills"

  # Project-level instruction files
  instr_file="$repo_root/skills/project-packs/$pack/instructions.md"
  if [[ -f "$instr_file" ]]; then
    proj_dir="$home_dir/$pack"
    mkdir -p "$proj_dir/.claude" "$proj_dir/.cursor/rules"
    cp "$instr_file" "$proj_dir/.claude/CLAUDE.md"
    cp "$instr_file" "$proj_dir/AGENTS.md"
    cp "$instr_file" "$proj_dir/.cursor/rules/project.md"
  fi
done

mkdir -p "$home_dir/.codex/profiles" "$home_dir/.cursor" "$home_dir/.claude" "$home_dir/.config/opencode"
cp "$repo_root/agents/codex/config.toml" "$home_dir/.codex/config.toml"
cp "$repo_root/agents/codex/profiles/full.toml" "$home_dir/.codex/profiles/full.toml"
cp "$repo_root/agents/codex/profiles/development.toml" "$home_dir/.codex/profiles/development.toml"
cp "$repo_root/agents/codex/profiles/minimal.toml" "$home_dir/.codex/profiles/minimal.toml"
cp "$repo_root/agents/codex/profiles/switch.sh" "$home_dir/.codex/profiles/switch.sh"
cp "$repo_root/agents/codex/AGENTS.md" "$home_dir/AGENTS.md"
cp "$repo_root/agents/codex/AGENTS.local.md" "$home_dir/.codex/AGENTS.md"
cp "$repo_root/agents/cursor/mcp.json" "$home_dir/.cursor/mcp.json"
cp "$repo_root/agents/cursor/global-rules.md" "$home_dir/.cursor/global-rules.md"
mkdir -p "$home_dir/.cursor/rules"
cp "$repo_root/agents/cursor/rules/global-rules.md" "$home_dir/.cursor/rules/global-rules.md"
cp "$repo_root/agents/opencode/opencode.json" "$home_dir/.config/opencode/opencode.json"
cp "$repo_root/agents/opencode/AGENTS.md" "$home_dir/.config/opencode/AGENTS.md"
mkdir -p "$home_dir/.opencode"
cp "$repo_root/agents/opencode/opencode.json" "$home_dir/.opencode/opencode.json"
cp "$repo_root/agents/opencode/AGENTS.md" "$home_dir/.opencode/AGENTS.md"
cp "$repo_root/agents/claude/CLAUDE.md" "$home_dir/.claude/CLAUDE.md"

claude_template="$(cat "$repo_root/agents/claude/mcp-servers.template.json")"
claude_template="${claude_template//__GITHUB_PERSONAL_ACCESS_TOKEN__/$GITHUB_PERSONAL_ACCESS_TOKEN}"
claude_template="${claude_template//__Z_AI_API_KEY__/$Z_AI_API_KEY}"
claude_template="${claude_template//__SUPABASE_ACCESS_TOKEN__/$SUPABASE_ACCESS_TOKEN}"
claude_template="${claude_template//__EXPO_TOKEN__/$EXPO_TOKEN}"
claude_template="${claude_template//__BRAVE_API_KEY__/$BRAVE_API_KEY}"
claude_template="${claude_template//__SUPABASE_PROJECT_REF__/$SUPABASE_PROJECT_REF}"

merge_claude() {
  local target="$1"
  if [[ ! -f "$target" ]]; then
    echo '{}' > "$target"
  fi
  jq --argjson incoming "$claude_template" '.mcpServers = $incoming.mcpServers' "$target" > "$target.tmp"
  mv "$target.tmp" "$target"
}

merge_claude "$home_dir/.claude.json"
merge_claude "$home_dir/.claude/settings.json"

if [[ -n "${FIRECRAWL_API_KEY:-}" ]]; then
  jq --arg key "$FIRECRAWL_API_KEY" '.mcpServers.firecrawl = {command:"npx",args:["-y","firecrawl-mcp@3.11.0"],env:{FIRECRAWL_API_KEY:$key}}' "$home_dir/.cursor/mcp.json" > "$home_dir/.cursor/mcp.json.tmp"
  mv "$home_dir/.cursor/mcp.json.tmp" "$home_dir/.cursor/mcp.json"

  jq --arg key "$FIRECRAWL_API_KEY" '.mcp.firecrawl = {type:"local",command:["npx","-y","firecrawl-mcp@3.11.0"],environment:{FIRECRAWL_API_KEY:$key}}' "$home_dir/.config/opencode/opencode.json" > "$home_dir/.config/opencode/opencode.json.tmp"
  mv "$home_dir/.config/opencode/opencode.json.tmp" "$home_dir/.config/opencode/opencode.json"

  jq --arg key "$FIRECRAWL_API_KEY" '.mcp.firecrawl = {type:"local",command:["npx","-y","firecrawl-mcp@3.11.0"],environment:{FIRECRAWL_API_KEY:$key}}' "$home_dir/.opencode/opencode.json" > "$home_dir/.opencode/opencode.json.tmp"
  mv "$home_dir/.opencode/opencode.json.tmp" "$home_dir/.opencode/opencode.json"

  jq --arg key "$FIRECRAWL_API_KEY" '.mcpServers.firecrawl = {command:"cmd",args:["/c","npx","-y","firecrawl-mcp@3.11.0"],env:{FIRECRAWL_API_KEY:$key}}' "$home_dir/.claude.json" > "$home_dir/.claude.json.tmp"
  mv "$home_dir/.claude.json.tmp" "$home_dir/.claude.json"

  jq --arg key "$FIRECRAWL_API_KEY" '.mcpServers.firecrawl = {command:"cmd",args:["/c","npx","-y","firecrawl-mcp@3.11.0"],env:{FIRECRAWL_API_KEY:$key}}' "$home_dir/.claude/settings.json" > "$home_dir/.claude/settings.json.tmp"
  mv "$home_dir/.claude/settings.json.tmp" "$home_dir/.claude/settings.json"
fi

if [[ "$persist_env" -eq 1 ]]; then
  echo "Environment persistence is not automated on Unix. Export the variables in your shell profile." >&2
fi

if [[ "$dry_run" -eq 1 ]]; then
  echo "Dry-run complete. No files were modified."
else
  echo "Sync complete. Backup at: $backup_dir"
fi
