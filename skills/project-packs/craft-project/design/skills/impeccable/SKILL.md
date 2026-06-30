---
name: impeccable
description: >-
  Give an AI coding agent real design craft: a shared design vocabulary, live
  in-browser iteration, and 44 deterministic checks that catch "AI-looking" UI
  before it ships. Use on frontend work when the goal is distinctive,
  non-templated UI quality (complements `taste-skill` here in craft/design and
  `frontend-design` in dev). POINTER skill: impeccable is a full product with its
  own CLI — not vendored. Install via its own installer per Setup.
---

# impeccable (pointer)

Solves the "vocabulary problem": developers know what they want but the model
lacks the design language to produce it. Ships 1 skill + 23 commands + 44
deterministic checks + real-time browser iteration.

**Source:** https://github.com/pbakaus/impeccable (Paul Bakaus)
**Why pointer, not vendored:** it's a whole Astro product (CLI, site, tests,
demos, `bun.lock`) designed to be installed via `npx impeccable install`. Its
value lives in the CLI + commands, not a copyable SKILL.md, so mirroring it into
the sync repo would be both heavy and broken.

## Setup (first use)
1. In your project (or globally): `npx impeccable install`
2. In the agent: run `/impeccable init` to wire up the design vocabulary + checks.
3. It writes per-agent skill copies (`.claude/`, `.cursor/`, `.codex/`, `.opencode/` …) itself.

## Security notes
Installs its own CLI and commands and can iterate against a live browser. Review
what `npx impeccable install` does (or run the global `skill-scanner` against a
clone) before granting it in an untrusted project.

## Use
After init, design-related frontend requests pick up impeccable's vocabulary and
the 44 checks automatically.
