---
name: skillspector
description: >-
  Security-scan an agent skill with NVIDIA SkillSpector before it is installed, vendored into this
  repo, or published after a rewrite: prompt injection, data exfiltration, privilege escalation,
  excessive agency, supply chain, trigger abuse, dangerous code, MCP tool poisoning (71 patterns),
  with a 0-100 risk score. Use for "扫一下这个 skill 安不安全", "scan this skill", "is this skill
  safe to install", and as the second scanner after skill-scanner when registering a skill. It
  judges safety, not quality: whether a skill is well written is skill-creator's rubric.
allowed-tools: Read, Bash
metadata:
  category: routing
  source: >-
    Wrapper for NVIDIA/SkillSpector (Apache-2.0), installed as a command with uv, not vendored.
---

# skillspector

Runs [NVIDIA SkillSpector](https://github.com/NVIDIA/SkillSpector) on a skill folder and reads the
report. Pairs with `skill-scanner` (a different engine; run both) and with `skill-creator`, which
judges whether the skill is good; this one judges whether it is safe.

## Setup (once per machine)

```bash
uv tool install git+https://github.com/NVIDIA/skillspector.git
skillspector --version          # later: uv tool upgrade skillspector
```

## Scan

```bash
skillspector scan <skill-folder> --no-llm --format json > <report.json>
```

- `--no-llm` is the default here: static analysis only, offline apart from OSV.dev lookups for
  pinned dependencies, no cost.
- On Windows `--output` is refused ("Safe file output is unsupported"): redirect stdout to a file
  outside the scanned folder instead, as above.
- A whole collection: `skillspector scan <folder> --recursive --no-llm`.
- Deeper semantic pass only when the user asks for it: set `SKILLSPECTOR_PROVIDER` (for example
  `claude_cli`, which uses the local Claude Code login instead of an API key) and drop `--no-llm`.
  It spends model quota or money; say so before running it.

## Read the report

- `risk_assessment`: `score` 0-100, `severity`, `recommendation` (`SAFE` … `DO_NOT_INSTALL`).
- `issues`: each with pattern, severity, file and line. Read the flagged lines yourself: a skill
  that quotes an injection phrase in order to warn about it is a false positive, a skill that
  fetches and follows remote instructions is not.
- `analysis_completeness.is_complete` must be `true`; otherwise list the files it could not read.

Report to the user: score, recommendation, and each real issue with file:line and why it matters.
Never "fix" a finding by weakening what a script does; change the skill only where the behaviour
itself is the problem, and say what changed.
