---
name: notebooklm
description: >-
  Drive Google NotebookLM from the agent — auto-upload PDFs/sources, then get
  grounded summaries and Q&A back. Use for research workflows that benefit from
  NotebookLM's source-grounded notebooks. POINTER skill: not vendored because it
  automates a browser logged into your Google account. Install + authenticate per
  Setup before use.
---

# notebooklm (pointer)

Bridges NotebookLM (Google's source-grounded research assistant) into the agent
so it can push documents in and pull summaries/answers out.

**Source:** https://github.com/PleasePrompto/notebooklm-skill
**Why pointer, not vendored:** it drives a **headless browser logged into your
Google account**, stores and injects Google session cookies, and auto-installs
its dependencies via subprocess. That is exactly the kind of sensitive,
machine-specific automation that should not be mirrored across machines by sync.

## Setup (first use)
1. `git clone https://github.com/PleasePrompto/notebooklm-skill ~/tools/notebooklm-skill`
2. Run its setup (installs Playwright + deps): `python ~/tools/notebooklm-skill/scripts/setup_environment.py`
3. Authenticate to Google once (see the repo's `AUTHENTICATION.md`).
4. Copy the skill into your agent: `cp -r ~/tools/notebooklm-skill ~/.claude/skills/notebooklm`

## Security notes
SENSITIVE. It can act as you inside NotebookLM/Google and handles your session
cookies (`auth_manager.py`, `browser_utils.py`). Install only if you trust it;
read `auth_manager.py` and run the global `skill-scanner` first. Keep the stored
browser state out of any synced/committed location.

## Use
Once authenticated, ask the agent to "put these PDFs in NotebookLM and summarize"
and it routes to the installed skill.
