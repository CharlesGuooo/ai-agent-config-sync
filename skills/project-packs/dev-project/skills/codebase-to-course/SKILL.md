---
name: codebase-to-course
description: >-
  Turn a codebase into an interactive single-page HTML course that teaches non-technical readers
  how the code works: scroll navigation, animated diagrams, quizzes, code beside plain-language
  explanations. Use for "turn this codebase into a course", "explain this codebase
  interactively", "把这个代码库做成教程". Pointer skill: install it into the project first
  (see Install).
allowed-tools: Read, Bash
compatibility: "network — clones the upstream repo from GitHub once; the skill itself then needs bash and loads Google Fonts in the generated page"
source: https://github.com/zarazhangrui/codebase-to-course
---

# codebase-to-course (pointer)

**Source:** https://github.com/zarazhangrui/codebase-to-course

**Why a pointer:** upstream publishes no license, so its files are all rights reserved and are
not copied into this public repo. Install it into the project that needs it, for that project's
own use.

## Install

Put it in the project's own skills folder, not in `~/.claude/skills` or `~/dev-project/`: those
entries are links into this repo, and files written there would land in the repo.

```bash
git clone --depth 1 https://github.com/zarazhangrui/codebase-to-course.git <project>/.claude/skills/codebase-to-course
rm -rf <project>/.claude/skills/codebase-to-course/.git
```

Use the project's folder for the agent at hand (`.claude/skills`, `.cursor/skills`,
`.opencode/skills`, `.agents/skills`, …). Then start a new session in the project and follow
the installed `SKILL.md`.
