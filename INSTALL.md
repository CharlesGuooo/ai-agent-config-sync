# INSTALL — set up the harness on a machine

Audience: an agent or a human on a fresh Windows, macOS or Linux machine.
How it works and why: `docs/harness-v2.md`.

## Prerequisites

| Required | Why |
| --- | --- |
| `git` | Clone this repo. |
| Node 20+ | The installer, the guard/format hooks, and most MCP servers (`npx`). Node 22+ to run the tests; 22.13+ for `doctor --deep` to check Cursor's rules (`node:sqlite`). |
| The agents you want | Install them first. The installer configures agents; it does not install them. |

## Install

```bash
git clone https://github.com/CharlesGuooo/ai-agent-config-sync.git
cd ai-agent-config-sync
node harness.mjs install --agents claude --dry-run --verbose   # list every change it would make
node harness.mjs install --agents claude                       # then do it
```

Read the dry run before the first real install: nothing the installer replaces or removes is
backed up. On Windows, some skill files sit deep in the tree; clone to a short path (say
`C:\src`) or run `git config --global core.longpaths true` first, or the clone fails with
"Filename too long".

Name the agents you have — any of `claude`, `codex`, `cursor`, `opencode`, `pi`. Only those
agents' files are touched, plus the pack folders in your home (`~/dev-project/`, …) where each
pack's skills are linked. The first install takes all eight packs; narrow them with
`--packs dev,research`. A later `install` without `--packs` (to add an agent, say) keeps the packs
this machine already has.

Close Claude Code before installing if you can: while it runs it rewrites `~/.claude.json`, and it
can drop an entry the installer has just written there.

Where the clone lives matters: every agent's skills are links into it, and its `.local/` folder
holds this machine's install state. Pick a stable place before installing. To move it later, move
the whole folder and run `node harness.mjs update` from the new place. For a fresh clone, copy
`.local/` over from the old one, and remove or rename the old clone before running `update` from
the new one; while the old clone exists, every skill link into it is a conflict (settle them with
`node harness.mjs resolve repo all`). Without `.local/`, `update` finds nothing installed; run
`install --agents …` again and expect conflicts for the instruction blocks and hooks, which name
the old path — settle them as on a first install (below).

Install from the main checkout, never from a `git worktree` — the installer refuses, because the
worktree would become what your agents run.

### Coming from the old sync scripts

On a machine that the v1 `sync` scripts set up, `install` also takes out what they left behind,
and only what is recognisably theirs: the copies in your home (`~/HARNESS.md`, `~/PLAYBOOK.md`,
`~/.agent-hooks/`, `~/MCP-Templates/`), their hook entries and whole-file configs, and skill copies
identical to the repo's, which become links. A skill copy you changed is a conflict instead.
`~/.agent-hooks/` goes only once no agent's hooks still run it: install only some agents and it
stays, with a note naming the agents still using it.
An instruction file v1 wrote (the ones with `<!-- SKILLS:BEGIN -->` markers, such as
`~/.claude/CLAUDE.md`) is replaced whole: copy any lines of your own out of it first.
`install --dry-run --verbose` lists every one of these first; none of them is backed up.

## After installing

- **Codex** runs a new or changed hook only after you trust it. After the first install, and after
  anything that changes the hook command (moving the clone), open Codex and approve the `guard`
  and `format` hooks; the installer prints a note when that is due.
- **Cursor** reads global rules only from its settings, not from a file. Paste
  `.local/cursor-rules.md` (in this clone) into **Cursor Settings → Rules → User Rules**, and again
  whenever the installer says it changed. `node harness.mjs doctor --deep` tells you when it is
  missing or out of date.
- **Cursor, OpenCode and Pi** get no guard hook; their instructions tell them to confirm
  destructive commands and to leave credential files alone instead.
- **Claude Code**: the installer turns on four LSP plugins but does not install them;
  `doctor --deep` names the missing ones and the `/plugin install` command for each.

## Environment variables for MCP

API keys are read from the environment, never written into files. This table is every variable
`mcp/catalog.json` refers to; nothing reads a `.env` file. A server that is off by default needs its
variable only once you turn it on.

| Variable | Used by | Server on by default? |
| --- | --- | --- |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | `github` | yes |
| `BRAVE_API_KEY` | `brave-search` | yes |
| `Z_AI_API_KEY` | `web-reader`, `zai-mcp-server` | `web-reader` yes (off in Codex); `zai-mcp-server` no |
| `SUPABASE_ACCESS_TOKEN` | `supabase` | no |
| `SUPABASE_PROJECT_REF` | `supabase` (part of its URL) | no |
| `EXPO_TOKEN` | `expo-mcp` | no |
| `REVENUECAT_API_V2_KEY` | `revenuecat` | no |

Windows (PowerShell):

```powershell
[Environment]::SetEnvironmentVariable('BRAVE_API_KEY', '<value>', 'User')
```

A terminal that was already open does not see the new value: open a new one before `install` or
`update`, and restart your agents.

macOS / Linux: add `export BRAVE_API_KEY=<value>` to `~/.zshrc` or `~/.bashrc`, then open a new
terminal (or `source` the file).

Codex and Pi cannot read variables inside a URL, so `SUPABASE_PROJECT_REF` is filled in at install
time: set it before `install` or `update` (until then the run warns and leaves their `supabase`
entry as it is). `node harness.mjs doctor` lists the variables that servers which are on by
default need and that are not set.

## Conflicts on the first install

On a machine that already has its own settings, the first install can list conflicts: where it
wants to write, it found a value it did not write, so it left that alone. Go through them
(`node harness.mjs resolve` lists them):

- a value you set on purpose — OpenCode's `lsp` set your own way or to `false`, a Claude LSP
  plugin you switched off: `node harness.mjs resolve keep <id>`;
- anything else: `node harness.mjs resolve repo <id>`, or `resolve repo all` once only those are left.

## Keeping it current

```bash
git pull
node harness.mjs update          # re-apply for the agents and packs installed here
node harness.mjs doctor          # drift, conflicts, leftovers, missing variables
```

`--dry-run` on `install`, `update`, `resolve` or `uninstall` shows what would change and writes
nothing; `--verbose` lists every change instead of a count per kind.

If something the repo manages was changed on this machine, `update` leaves it alone and lists it
as a conflict:

```bash
node harness.mjs resolve                 # list conflicts and the items kept on this machine
node harness.mjs resolve repo <id|all>   # take the repo's version
node harness.mjs resolve keep <id|all>   # keep this machine's version and stop managing it
```

`all` settles only the conflicts listed right now; it never undoes an earlier `keep`. To hand a
kept item back to the repo, name it: `resolve repo <id>`. A kept item is also managed again on its
own once the machine's version matches the repo's.

An entry that has disappeared from a config (a running Claude Code can write `~/.claude.json` over
it) is a conflict too: `resolve repo <id>` puts it back.

`node harness.mjs doctor --deep` also starts the installed agents (`opencode debug skill`,
`codex debug prompt-input`) to see which skills they really load, compares Cursor's pasted rules
with `.local/cursor-rules.md`, and checks Claude's LSP plugins. The agents may write their own logs
and caches while it runs.

## When a run stops with an error

The message names the file. Fix it and run the command again; nothing is recorded as done until a
whole run succeeds. On Windows, a config file with the Hidden attribute cannot be rewritten in
place (`EPERM`): unhide it (`attrib -h <file>`) first. More known limits: `docs/harness-v2.md`.

## Removing an agent

```bash
node harness.mjs uninstall --agents codex
```

Removes that agent's skill links and what the installer wrote for it; your own content stays. A
file or entry you changed since it was installed is left as it is, and the report says so. For
Cursor, also take the pasted rules out of Cursor Settings → Rules.

## Do not install

- **`claude-mem` — do NOT install it.** Retired 2026-07 (unused in practice). Never add it back
  to this repo or to a machine.
- Anything not described here or in `docs/harness-v2.md`.
