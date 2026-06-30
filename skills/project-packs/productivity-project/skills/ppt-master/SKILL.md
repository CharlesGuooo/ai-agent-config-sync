---
name: ppt-master
description: >-
  Generate truly EDITABLE PowerPoint (.pptx) from any document — native shapes
  and native animations (not slide images), optional speaker-note audio
  narration, custom .pptx templates. Use when the user wants a polished,
  hand-editable deck rather than the simpler output of the global `pptx` skill or
  `pptx-author`. POINTER skill: the tool is NOT vendored here (137-file Python
  toolchain). On first use, install from source per Setup below.
---

# ppt-master (pointer)

A heavyweight, high-quality PPTX generator: full content analysis → visual design
→ SVG generation → native-shape PPTX export. Differentiator vs. the global `pptx`
skill is *editability* + native animations.

**Source:** https://github.com/hugohe3/ppt-master (13.9k★)
**Why pointer, not vendored:** ~137 Python files, runs a local confirmation-UI
web server, and calls **external image-generation APIs** (BFL / FAL / Gemini)
that require your own API keys. Too heavy and too much network surface to mirror
into the config-sync repo across machines.

## Setup (first use)
1. `git clone https://github.com/hugohe3/ppt-master ~/tools/ppt-master`
2. `pip install -r ~/tools/ppt-master/requirements.txt`
3. Set image-backend keys in a `.env` (only if you use AI image gen): `BFL_API_KEY` / `FAL_API_KEY`.
4. Copy the skill into your agent: `cp -r ~/tools/ppt-master/skills/ppt-master ~/.claude/skills/` (and/or the other agents).

## Security notes
Before trusting it, run the global `skill-scanner`. Known behaviors from the
intake scan: external API calls with your keys, a local HTTP server
(`confirm_ui/server.py`), and `shutil.rmtree` on its own working dirs. No malware
found, but treat the image-gen keys as the sensitive surface.

## Use
Once installed, ask the agent to "make an editable PPTX from <doc>" and it will
route to the installed `ppt-master` skill.
