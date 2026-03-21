---
name: skillshare
description: Sync Claude Code skills to Codex CLI and other AI coding tools. Use when you want to share skills between different AI agents, set up cross-tool skill directories, or manage skills across multiple AI CLIs.
user-invocable: true
---

# Skillshare - Cross-Tool Skill Synchronization

Sync Claude Code skills to Codex CLI and other AI coding tools, enabling a single skill library across multiple agents.

## Overview

This skill helps you share Claude Code skills with:
- **Codex CLI** (OpenAI)
- **Cursor**
- **GitHub Copilot**
- **Windsurf**
- And 40+ other AI CLI tools

## Quick Start

### Option 1: Install skillshare CLI (Recommended)

```bash
# Linux/Mac
curl -fsSL https://raw.githubusercontent.com/runkids/skillshare/main/install.sh | sh

# Initialize (detects your AI CLIs)
skillshare init

# Collect existing skills from Claude
skillshare collect --all

# Sync to all targets
skillshare sync
```

### Option 2: Manual Symlink (Simple)

**Linux/Mac:**
```bash
# Create Codex skills directory if not exists
mkdir -p ~/.codex/skills

# Create symlinks for all Claude skills
ln -s ~/.claude/skills/* ~/.codex/skills/
```

**Windows (PowerShell as Admin):**
```powershell
# Create Codex skills directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\skills"

# Create symbolic link
cmd /c mklink /D "$env:USERPROFILE\.codex\skills" "$env:USERPROFILE\.claude\skills"
```

### Option 3: Copy Directly

```bash
# Linux/Mac
cp -r ~/.claude/skills/* ~/.codex/skills/

# Windows
Copy-Item -Recurse -Force "$env:USERPROFILE\.claude\skills\*" "$env:USERPROFILE\.codex\skills\"
```

## Day-to-Day Workflow

After initial setup:

```bash
# Pull changes made in Codex back to source
skillshare collect codex

# Sync to all targets
skillshare sync
```

## Configuration Files

### AGENTS.md (Universal)

Create `AGENTS.md` in your project root for cross-tool compatibility:

```markdown
# Project Instructions

## Code Style
- Use TypeScript strict mode
- Prefer functional components

## Commands
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`

## Boundaries
- ✅ Always run tests before commit
- ⚠️ Ask before adding dependencies
- 🚫 Never commit .env files
```

### CLAUDE.md vs AGENTS.md

| File | Scope | Tools |
|------|-------|-------|
| CLAUDE.md | Claude-specific | Claude Code only |
| AGENTS.md | Universal standard | Claude, Codex, Cursor, Copilot, etc. |

**Best Practice**: Maintain both files:
- `AGENTS.md` - Universal conventions (code style, commands, boundaries)
- `CLAUDE.md` - Claude-specific features (MCP servers, auto-memory)

## Skill Directory Structure

```
~/.config/skillshare/skills/     # Central skill store
    ├── ~/.claude/skills/        # Symlink → Claude Code
    ├── ~/.codex/skills/         # Symlink → Codex CLI
    └── ~/.cursor/skills/        # Symlink → Cursor
```

## Supported Tools

skillshare supports 40+ AI CLI targets including:
- Claude Code
- Codex CLI (OpenAI)
- Cursor
- GitHub Copilot
- Windsurf
- Aider
- Continue
- And more...

## Troubleshooting

### Symlink not working on Windows
1. Run PowerShell as Administrator
2. Enable Developer Mode in Windows Settings
3. Use `cmd /c mklink /D` instead of `New-Item -ItemType SymbolicLink`

### Skills not appearing in Codex
1. Check `~/.codex/skills/` directory exists
2. Verify symlinks are valid: `ls -la ~/.codex/skills/`
3. Restart Codex CLI

### Conflicts when syncing
```bash
# View conflicts
skillshare status

# Force overwrite
skillshare sync --force
```

## References

- skillshare CLI: https://github.com/runkids/skillshare
- AGENTS.md Standard: https://agents.md/
- sync-claude-skills-to-codex: https://github.com/search?q=sync-claude-skills-to-codex
