#!/usr/bin/env bash
set -euo pipefail

persist_env=0
if [[ "${1:-}" == "--persist-env" ]]; then
  persist_env=1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
home_dir="$HOME"

for cmd in rsync jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "missing required command: $cmd" >&2
    exit 1
  fi
done

if [[ -f "$repo_root/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$repo_root/.env"
  set +a
fi

required_env=(
  GITHUB_PERSONAL_ACCESS_TOKEN
  Z_AI_API_KEY
  SUPABASE_ACCESS_TOKEN
  EXPO_TOKEN
  BRAVE_API_KEY
)

for name in "${required_env[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "missing required environment variable: $name" >&2
    exit 1
  fi
done

sync_dir() {
  local source="$1"
  local dest="$2"
  mkdir -p "$dest"
  rsync -a --delete --exclude ".git" --exclude "__pycache__" --exclude "*.pyc" --exclude "*.pyo" "$source"/ "$dest"/
}

project_packs=(
  scientific-project
  database-project
  data-analysis-project
  dev-project
  marketing-project
  research-project
  office-project
  productivity-project
)

sync_dir "$repo_root/skills/global/common" "$home_dir/.claude/skills"
sync_dir "$repo_root/skills/global/common" "$home_dir/.codex/skills"
sync_dir "$repo_root/skills/global/common" "$home_dir/.cursor/skills"
sync_dir "$repo_root/skills/global/common" "$home_dir/.config/opencode/skills"
sync_dir "$repo_root/skills/global/common" "$home_dir/.opencode/skills"
sync_dir "$repo_root/skills/global/codex-system" "$home_dir/.codex/skills/.system"
sync_dir "$repo_root/agents/cursor/skills-cursor" "$home_dir/.cursor/skills-cursor"
sync_dir "$repo_root/agents/opencode/command" "$home_dir/.opencode/command"
sync_dir "$repo_root/agents/opencode/command" "$home_dir/.config/opencode/command"

for pack in "${project_packs[@]}"; do
  sync_dir "$repo_root/skills/project-packs/$pack/skills" "$home_dir/$pack/.claude/skills"
done

mkdir -p "$home_dir/.codex/profiles" "$home_dir/.cursor" "$home_dir/.claude" "$home_dir/.config/opencode"
cp "$repo_root/agents/codex/config.toml" "$home_dir/.codex/config.toml"
cp "$repo_root/agents/codex/profiles/full.toml" "$home_dir/.codex/profiles/full.toml"
cp "$repo_root/agents/codex/profiles/development.toml" "$home_dir/.codex/profiles/development.toml"
cp "$repo_root/agents/codex/profiles/minimal.toml" "$home_dir/.codex/profiles/minimal.toml"
cp "$repo_root/agents/codex/profiles/switch.sh" "$home_dir/.codex/profiles/switch.sh"
cp "$repo_root/agents/codex/AGENTS.md" "$home_dir/AGENTS.md"
cp "$repo_root/agents/cursor/mcp.json" "$home_dir/.cursor/mcp.json"
cp "$repo_root/agents/cursor/global-rules.md" "$home_dir/.cursor/global-rules.md"
cp "$repo_root/agents/opencode/opencode.json" "$home_dir/.config/opencode/opencode.json"
cp "$repo_root/agents/opencode/AGENTS.md" "$home_dir/.config/opencode/AGENTS.md"
cp "$repo_root/agents/claude/CLAUDE.md" "$home_dir/.claude/CLAUDE.md"

claude_template="$(cat "$repo_root/agents/claude/mcp-servers.template.json")"
claude_template="${claude_template//__GITHUB_PERSONAL_ACCESS_TOKEN__/$GITHUB_PERSONAL_ACCESS_TOKEN}"
claude_template="${claude_template//__Z_AI_API_KEY__/$Z_AI_API_KEY}"
claude_template="${claude_template//__SUPABASE_ACCESS_TOKEN__/$SUPABASE_ACCESS_TOKEN}"
claude_template="${claude_template//__EXPO_TOKEN__/$EXPO_TOKEN}"
claude_template="${claude_template//__BRAVE_API_KEY__/$BRAVE_API_KEY}"

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
  jq --arg key "$FIRECRAWL_API_KEY" '.mcpServers.firecrawl = {command:"npx",args:["-y","firecrawl-mcp"],env:{FIRECRAWL_API_KEY:$key}}' "$home_dir/.cursor/mcp.json" > "$home_dir/.cursor/mcp.json.tmp"
  mv "$home_dir/.cursor/mcp.json.tmp" "$home_dir/.cursor/mcp.json"

  jq --arg key "$FIRECRAWL_API_KEY" '.mcp.firecrawl = {type:"local",command:["npx","-y","firecrawl-mcp"],environment:{FIRECRAWL_API_KEY:$key}}' "$home_dir/.config/opencode/opencode.json" > "$home_dir/.config/opencode/opencode.json.tmp"
  mv "$home_dir/.config/opencode/opencode.json.tmp" "$home_dir/.config/opencode/opencode.json"

  jq --arg key "$FIRECRAWL_API_KEY" '.mcpServers.firecrawl = {command:"cmd",args:["/c","npx","-y","firecrawl-mcp"],env:{FIRECRAWL_API_KEY:$key}}' "$home_dir/.claude.json" > "$home_dir/.claude.json.tmp"
  mv "$home_dir/.claude.json.tmp" "$home_dir/.claude.json"

  jq --arg key "$FIRECRAWL_API_KEY" '.mcpServers.firecrawl = {command:"cmd",args:["/c","npx","-y","firecrawl-mcp"],env:{FIRECRAWL_API_KEY:$key}}' "$home_dir/.claude/settings.json" > "$home_dir/.claude/settings.json.tmp"
  mv "$home_dir/.claude/settings.json.tmp" "$home_dir/.claude/settings.json"
fi

if [[ "$persist_env" -eq 1 ]]; then
  echo "Environment persistence is not automated on Unix. Export the variables in your shell profile." >&2
fi

echo "Sync complete."
