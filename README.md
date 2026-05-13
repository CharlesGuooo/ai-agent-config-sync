# AI Agent Config Sync

One repo to rebuild a uniform 4-agent setup (Claude Code / Cursor / Codex / OpenCode) on any machine. Clone, fill `.env`, run one install command — the same 30 global skills, 7 project packs, 19 MCPs, and 7-principle system prompts apply across all four CLIs.

Optimised for **agent-driven install**: a new-machine agent reads `INVENTORY.md` and either runs the script or copies files directly.

> 想读人话版本的总览（skill 怎么用、什么时候去哪个目录、敲哪条命令）？看 **[AGENTS_OVERVIEW.md](AGENTS_OVERVIEW.md)**。

## What's inside

| Layer | Count | Purpose |
| --- | --- | --- |
| Global skills | 30 | Process, routing, escalation, code-review, OpenSpec, document handling — identical across 4 agents |
| Codex `.system/` vendor skills | 5 | Codex-only built-ins (image-gen, plugin-creator, etc.) |
| Project packs | 7 | Domain expertise — loaded when `cd` into the matching directory |
| MCP servers (always-on) | 9 | github, memory, filesystem, context7, sequential-thinking, brave-search, playwright, chrome-devtools, web-reader |
| MCP servers (opt-in templates) | 10 | supabase, vercel, railway, expo-mcp, magic, zai-mcp-server, cloudflare-{docs,workers-builds,workers-bindings,observability} |
| Agent system prompts | 4 | CLAUDE.md, cursor rules, codex AGENTS.md, opencode AGENTS.md — all aligned to the same 7 core principles |

## Project packs

| Pack | Sub-routing |
| --- | --- |
| `dev-project/` | 11 top + frontend(4) + backend(4) + cloud-platform(18) + testing-qa(4) + devops-sre(9) + agent-dev(15) + ml(22) |
| `finance-project/` | trading(14) + research(21) + macro(16) + modeling(15) + portfolio(21) + quant-methods(15) + advisory/{ib(8),pe(8),wealth(3),fund-admin(6),compliance(2)} |
| `ios-project/` | 14 skills (Swift / SwiftUI / iOS) |
| `data-analysis-project/` | 18 skills (EDA, viz, statistics) |
| `marketing-project/` | 38 skills (SEO, ads, ElevenLabs audio, copywriting) |
| `research-project/` | 18 skills (papers, grants, peer review) |
| `productivity-project/` | 20 skills (Obsidian, Jira, Notion, PM) |

## Repo layout

```
ai-agent-config-sync/
├── README.md                       ← you are here
├── INSTALL.md                      ← step-by-step install for an agent to follow
├── INVENTORY.md                    ← machine-readable source→target map
├── .env.example                    ← env-var names (no values)
├── agents/
│   ├── claude/  CLAUDE.md, commands/, profiles/
│   ├── cursor/  global-rules.md, rules/, skills-cursor/
│   ├── codex/   AGENTS.md, AGENTS.local.md, config.toml, profiles/
│   └── opencode/ AGENTS.md, command/, opencode.json
├── skills/
│   ├── global/                     ← 30 skills × 4 agents
│   ├── codex-system/               ← 5 Codex-only vendor skills
│   └── project-packs/              ← 7 packs, mirroring live directory layout
│       ├── dev-project/{frontend,backend,cloud-platform,testing-qa,devops-sre,agent-dev,ml}
│       ├── finance-project/{trading,research,macro,modeling,portfolio,quant-methods,advisory/{ib,pe,wealth,fund-admin,compliance}}
│       └── {ios,data-analysis,marketing,research,productivity}-project/
├── mcp/
│   ├── always-on/                  ← 4 sanitized templates (one per agent), env-var refs only
│   └── opt-in/                     ← 10 templates + scenario bundles, copied to ~/MCP-Templates/
├── claude-mem/README.md            ← persistent memory addon (install steps only, not bundled)
├── scripts/install.{ps1,sh}        ← entry — supports --agents= --packs= --skip-mcp --global-only
└── scripts/sync.{ps1,sh}           ← internal copy logic
```

## How to install on a new machine

```bash
git clone <this-repo>
cd ai-agent-config-sync
cp .env.example .env                   # then fill in keys
./scripts/install.sh                   # everything

# selective:
./scripts/install.sh --agents=claude   # only Claude Code
./scripts/install.sh --packs=dev,finance  # only those project packs
./scripts/install.sh --skip-mcp        # skills + agent configs only
./scripts/install.sh --global-only     # 30 global skills, no project packs
```

If you're an AI agent doing the install, read **`INSTALL.md`** + **`INVENTORY.md`** first. You may also `cp` files directly instead of running the script — whichever fits the situation.

## Core principles (embedded in every agent's system prompt)

1. Think before acting.
2. When multiple interpretations exist, present them — don't pick silently.
3. Push back when a simpler approach exists; don't just follow.
4. Touch only what the task requires — mention unrelated dead code, don't delete.
5. Exhaust reasonable options before claiming something cannot be done.
6. Verify results before claiming success.
7. Preserve context and align with the user's actual goal.

Loaded at system-prompt level (`CLAUDE.md`, `AGENTS.md`, `global-rules.md`) — zero skill-match cost.

## Secrets

- `.env` lists API keys for MCP auth. Never commit it (`.gitignore` enforces this).
- The repo contains **no plaintext secrets** — sanitized MCP templates use env-var references (`${VAR}` / `${env:VAR}` / `{env:VAR}` / `bearer_token_env_var`).
- On Windows, `install.ps1` persists keys as User-scope environment variables so Cursor/Codex/OpenCode can resolve `${env:VAR}` references.

## What's NOT in the repo

- `claude-mem` (persistent memory) — install separately via `npm install -g claude-mem` (see `claude-mem/README.md`).
- LM Studio configs — its MCP support is partial/diverging; documented separately on the source machine.
- Per-machine Claude account state (`~/.claude/auth`, etc.) — stays local.
