# claude-mem — persistent memory addon

`claude-mem` provides cross-session persistent memory for Claude Code via a Bun worker + SQLite + Chroma store. It runs as a plugin hook that auto-compresses prior conversations and surfaces relevant memories at session start.

**Not bundled in this repo** — version-sensitive and large. Install separately.

## Install

### Claude Code

```bash
npm install -g claude-mem
# Claude Code will auto-detect the package and prompt to enable hooks
```

### Codex (0.130+)

```bash
codex plugin marketplace add github.com/davepiet/claude-mem
codex features enable plugin_hooks
```

### Cursor / OpenCode

Add `claude-mem` as an MCP server in the respective config. On the source machine, Cursor has it as the 20th MCP entry:

```json
{
  "mcpServers": {
    "claude-mem": {
      "command": "npx",
      "args": ["-y", "claude-mem", "mcp"]
    }
  }
}
```

## Requirements

- Bun runtime — `curl -fsSL https://bun.sh/install | bash` (or PowerShell equivalent on Windows).
- Node 20+ for the npm package.
- ~200 MB free disk for the local SQLite + Chroma store.

## Where memories live

- Linux/macOS: `~/.claude-mem/`
- Windows: `C:\Users\<user>\.claude-mem\`

## Verify install

```bash
claude-mem --version
claude-mem status        # should report worker running + DB initialised
```

## Why it's not bundled

- The npm package updates often (≥ weekly).
- The SQLite DB is per-machine state, not config.
- Bundling Bun runtime would balloon the repo.

The single source of truth is the upstream package. This repo just documents the install.
