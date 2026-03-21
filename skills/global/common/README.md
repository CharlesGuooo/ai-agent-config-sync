# Skills

Reference material for Claude Code skills and activation rules.

---

## What Skills Are

Skills are modular instruction packs that Claude loads when needed. They can provide:

- domain guidance
- best practices
- examples
- anti-patterns

This repository now follows a two-layer model:

- Global layer: process and routing only
- Local layer: domain-specific guidance and guardrails

---

## Global Layer

The global layer should stay small and stable.

### Global process skills

- `using-superpowers`
- `brainstorming`
- `systematic-debugging`
- `test-driven-development`
- `writing-plans`
- `executing-plans`
- `verification-before-completion`
- `high-agency`
- `pua`

### Global workflow skills

- `playwright-interactive`
- `gh-fix-ci`
- `gh-address-comments`

### Global routing skill

- `skill-router`

The router decides which project directory should own the task and where the local pack should start.

---

## Local Layer

Domain-specific skills belong in project directories such as:

- `~/dev-project/.claude/skills/`
- `~/scientific-project/.claude/skills/`
- `~/database-project/.claude/skills/`
- `~/data-analysis-project/.claude/skills/`
- `~/marketing-project/.claude/skills/`
- `~/research-project/.claude/skills/`
- `~/office-project/.claude/skills/`
- `~/productivity-project/.claude/skills/`

Examples:

- frontend, backend, CI/CD, agents: `dev-project`
- omics, chemistry, scientific ML: `scientific-project`
- database lookup and evidence retrieval: `database-project`
- EDA, visualization, statistics: `data-analysis-project`
- SEO, copy, campaigns: `marketing-project`
- literature review, grants, peer review: `research-project`
- PDF, Word, Excel, PowerPoint: `office-project`
- Obsidian, Jira, planning workflows: `productivity-project`

---

## Design Rules

- Do not duplicate domain guardrails in the global layer.
- Do not use global file path triggers for domain code.
- Route first, then load local skills.
- Prefer one primary domain and at most one secondary domain.
- Route to the local pack rather than enumerating domain-specific skills from the global layer.

---

## Key Files

- Global rules: [`skill-rules.json`](skill-rules.json)
- Global router: [`skill-router/SKILL.md`](skill-router/SKILL.md)
- Global architecture guide: [`C:\\Users\\PC\\.claude\\CLAUDE.md`](C:\Users\PC\.claude\CLAUDE.md)
- Routing regression cases: [`C:\\Users\\PC\\.claude\\ROUTING_REGRESSION_TESTS.md`](C:\Users\PC\.claude\ROUTING_REGRESSION_TESTS.md)

---

## Maintenance Checklist

When changing global skill behavior:

1. Update `skill-rules.json`
2. Update `skill-router/SKILL.md` if routing behavior changes
3. Update `CLAUDE.md` if the architecture contract changes
4. Re-check `ROUTING_REGRESSION_TESTS.md`
5. Keep domain details in local project packs, not in the global layer
