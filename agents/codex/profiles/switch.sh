#!/usr/bin/env bash
set -euo pipefail

profile="${1:-}"
case "$profile" in
  full|development|minimal) ;;
  *)
    echo "usage: ./switch.sh <full|development|minimal>" >&2
    exit 1
    ;;
esac

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
source_file="$repo_root/agents/codex/profiles/$profile.toml"
target_dir="$HOME/.codex"
target_file="$target_dir/config.toml"

mkdir -p "$target_dir"
cp "$source_file" "$target_file"
echo "Switched Codex profile to '$profile'."
