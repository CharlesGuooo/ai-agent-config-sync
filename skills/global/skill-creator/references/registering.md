# Registering a skill in this repo

Narrow bridge. Run these commands as written, in this order, from the repo root
(`D:/Projects2/ai-agent-config-sync`).

## 1. Place the directory

| Layer | Path | Reaches |
|---|---|---|
| Global | `skills/global/<name>/` | every agent, every directory |
| Local pack | `skills/project-packs/<pack>/skills/<name>/` | that pack's directory only |

Author it **inside the repo**. `sync.ps1` mirrors with `robocopy /MIR`, so a skill written straight
into `~/.claude/skills/` and not present in the repo is deleted on the next sync without a warning.

## 2. Catalog the skill — global only

Add one line to `skills/global/catalog.json` under `skills`, choosing a `category` key that already
exists in that file's `categories` array:

```json
"<name>": { "category": "process", "tagline": "One line, imperative, no trailing period" },
```

`gen-skill-table.mjs` reconciles this against the actual directories and **fails if they disagree**,
so a skill cannot silently drift out of the tables.

Local-pack skills skip this step — `gen-harness.mjs` finds them by scanning for `SKILL.md`.

## 3. Regenerate, then prove it is clean

```bash
node scripts/gen-skill-table.mjs
node scripts/gen-harness.mjs
node scripts/gen-skill-table.mjs --check
node scripts/gen-harness.mjs --check
```

Both `--check` runs must exit 0 before going further.

## 4. Scan it

```bash
cd skills/global/skill-scanner && uv run scripts/scan_skill.py <absolute-path-to-skill>
```

Expect `findings: 0`, `urls.untrusted: []`, and `tools.unrestricted: false`. A vendored skill that
loads instructions from a remote URL fails here — that is the check's purpose.

## 5. Sync to all five agents

```powershell
.\scripts\sync.ps1 -SkipMcp
```

`-SkipMcp` is required. A full sync overwrites `~/.codex/config.toml` and destroys the Codex
plugins, marketplaces, and MCP servers installed on the machine that the repo copy does not carry.
Backups land in `~/.agent-config-backup/<timestamp>/`.

Scope it further when only one pack changed: `-Packs research`.

## 6. Confirm on disk

Read the sync output for what it claims, then check what actually landed:

```powershell
foreach ($p in '.claude\skills','.cursor\skills','.codex\skills','.opencode\skills','.pi\agent\skills') {
  $d = Join-Path $HOME $p
  "{0,-24} {1,-4} {2}" -f $p, (Get-ChildItem $d -Directory).Count, (Test-Path (Join-Path $d '<name>\SKILL.md'))
}
```

Codex reports one extra directory: `.system`, created by the sync. Project-pack skills live under
`~/<pack-name>/` and use `.pi\skills` rather than `.pi\agent\skills` for Pi.

## Declare what it costs

Every pack skill states its cost tier on a `compatibility:` line. The first token is one of four
values and is greppable; the rest is prose for a human.

```yaml
compatibility: "offline — no scripts, no network, no credentials"
compatibility: "network — public APIs, no credentials required; optional NCBI_API_KEY raises rate limits"
compatibility: "local-tools — needs a TeX engine (Tectonic auto-installs its own packages)"
compatibility: "paid — requires OPENROUTER_API_KEY; billed per generated image"
```

**The propagation rule, which is the point of the convention:**

> A skill may not instruct the agent to invoke a `paid` skill unless the calling skill itself
> declares `paid`, names the key, and carries a `## Cost` section in its body.

This exists because of a real failure. One image-generation skill required a billed key, and
twelve others told the agent to call it through a copied boilerplate block — none of which
disclosed the cost in frontmatter. On a machine where the key happens to be set, that does not
fail with an error. It charges, silently, and the only way to find out is the invoice.

Audit a pack with:

```bash
grep -rL "^compatibility:" <pack>/**/SKILL.md          # any skill that declares nothing
grep -rn '^compatibility: "paid' <pack>/               # every billed skill, by name
```

A `paid` skill is not a defect. An undeclared one is.


## Optional: activation rules

`skills/global/skill-rules.json` carries keyword and intent patterns for a minority of global
skills. Add an entry only when the skill needs trigger phrasing beyond what its description
already covers.
