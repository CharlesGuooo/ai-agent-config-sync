---
name: impeccable
description: >-
  Points to Impeccable (pbakaus/impeccable), which gives a coding agent design craft for
  frontend UI: a shared design vocabulary of 24 commands (polish, audit, critique, shape…),
  live in-browser iteration, and 61 deterministic detector rules that catch AI-looking UI.
  Use on frontend work when the goal is distinctive, non-templated UI: "make this UI look
  designed", "界面一股 AI 味", "帮我审一下界面细节", "这个页面怎么做得更有设计感". Not
  vendored: install it into the project with its own installer (Setup below). Complements
  design-taste-frontend here and frontend-design in dev-project; for slide decks use impeccable-ppt.
allowed-tools: Read, Bash
compatibility: "local-tools — needs the Impeccable engine: npx impeccable install, whose launcher downloads a self-contained binary into ~/.impeccable/bin on first run"
metadata:
  category: design
  source: >-
    Pointer to https://github.com/pbakaus/impeccable (Apache-2.0); facts checked against
    its README at 46b822f (2026-10-19).
---

# impeccable (pointer)

Solves the "vocabulary problem": developers know what they want but the model lacks the
design language to produce it. Ships 1 skill, 24 commands (all under `/impeccable`), 61
deterministic detector rules plus LLM-only critique checks, and live browser iteration.

**Source:** https://github.com/pbakaus/impeccable (Paul Bakaus, Apache-2.0)
**Why pointer, not vendored:** its installer writes a different skill copy for each agent
and wires per-project hooks on Claude Code, Cursor and Codex. One shared copy linked by this
harness could do neither, and upstream changes almost daily.

## Setup (first use, per project)

Installing downloads and runs third-party code, so offer these steps and run them once the
user agrees.

1. From the project root:
   `npx impeccable install --providers=claude,codex,cursor,opencode,pi --scope=project`
   (`--scope=global` writes into the agents' home folders instead; the hooks stay per project
   either way).
2. Reload the agent, then run `/impeccable init`: it gathers product context into
   `PRODUCT.md` and recommends next steps.
3. Codex: open `/hooks` and approve the project hook, again after every update.
4. Refresh an install with `npx impeccable update`.

## Security notes

Each skill copy's launcher downloads a pinned engine binary into `~/.impeccable/bin/` on first
run. On Claude Code the installed hooks run on edits and on Stop even when the model's own
commands are denied, so read the hooks it added before an unattended run. Before installing
into an untrusted project, scan a clone with `skill-scanner` and `skillspector`.

## Use

After init, name the command: `/impeccable critique landing`, `/impeccable audit blog`,
`/impeccable polish settings`, `/impeccable shape <brief>`, `/impeccable live` for in-browser
variants, or `/impeccable <free description>`. `/impeccable pin <command>` makes a standalone
shortcut such as `/audit`.
