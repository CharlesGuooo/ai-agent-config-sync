# Registering a skill in this repo

Contents: 1. Place the directory · 2. Catalog the skill · 3. Regenerate · 4. Scan it · 5. Link it
· 6. Confirm · Declare what it costs · Optional: activation rules

Narrow bridge. Run these commands as written, in this order, from the repo root.

## 1. Place the directory

| Layer | Path | Reaches |
|---|---|---|
| Global | `skills/global/<name>/` | every agent, every directory |
| Local pack | `skills/project-packs/<pack>/skills/<name>/` | that pack's directory only |
| Local sub-pack | `skills/project-packs/<pack>/<sub>/skills/<name>/` | that sub-pack's directory only |

Author it **inside the repo**. Agents reach skills through links into the repo, so a skill written
straight into `~/.claude/skills/` exists for that one agent on that one machine only — and if its
name matches a repo skill, the installer reports a conflict.

A skill copied from someone else's repository gets an entry in `skills/sources.json`, keyed by its
path under `skills/`:

```json
"project-packs/media-project/skills/ffmpeg": { "repo": "n0an/ffmpeg-skill", "path": ".", "commit": "<sha>", "date": "2026-10-19", "license": "MIT" }
```

`commit` is the newest upstream commit touching `path` that this copy reflects; `node harness.mjs
upstream` compares it with GitHub to say when upstream has moved on. `check` fails on an entry
whose folder does not exist. A skill written here has no entry; a skill drawn from several
upstreams takes a list of entries, one per upstream.

A user-invoked skill (`disable-model-invocation: true`) also needs `agents/openai.yaml` beside its
`SKILL.md`, holding:

```yaml
policy:
  allow_implicit_invocation: false
```

Codex ignores the frontmatter key and reads only this file, so without it the skill stays in
Codex's skill list and its description fires on its own. When the file already exists, add the
`policy` block to it.

## 2. Catalog the skill — global only

Add one line to `skills/global/catalog.json` under `skills`, choosing a `category` key that already
exists in that file's `categories` array:

```json
"<name>": { "category": "process", "tagline": "One line, imperative, no trailing period" },
```

`node harness.mjs check` reconciles the catalog against the actual directories and **fails if they
disagree**, so a skill cannot silently drift out of the generated tables.

Local-pack skills skip this step — `scripts/gen-harness.mjs` finds them by scanning for `SKILL.md`.

## 3. Regenerate, then prove it is clean

```bash
node scripts/gen-harness.mjs
node harness.mjs check
```

`check` must exit 0 before going further.

## 4. Scan it

```bash
(cd skills/global/skill-scanner && uv run scripts/scan_skill.py <absolute-path-to-skill>)
```

Expect `findings: 0`, `urls.untrusted: []`, and `tools.unrestricted: false`. A vendored skill that
loads instructions from a remote URL fails here — that is the check's purpose.

Then the second engine (setup and how to read it: the `skillspector` skill):

```bash
skillspector scan <absolute-path-to-skill> --no-llm --format json > <report-outside-the-skill>.json
```

Expect `risk_assessment.recommendation` `SAFE` and `analysis_completeness.is_complete` true. Read
every issue it lists; a quoted attack used as an example is a false positive, a real one is fixed
or the skill stays out.

## 5. Link it into every installed agent

```bash
node harness.mjs update
```

Each installed agent gets one link to the new directory. Nothing is copied, and nothing in the
agents' directories that the repo does not own is touched.

## 6. Confirm

```bash
node harness.mjs doctor
```

Expect no pending changes and no conflicts. Until the skill is committed, `doctor` also warns about
uncommitted changes in shipped content; that warning goes once you commit. On disk, a global skill
is at `~/.claude/skills/<name>` (and in each other agent's skill directory), a pack skill at
`~/<pack>/[<sub>/].claude/skills/<name>` (and the other agents' folders there): a link that
resolves into this repo — a junction on Windows.

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
