---
name: skill-router
description: Route the task to the correct project directory and tell the user which local project directory to start from.
---

# Skill Router

## Purpose

Use this skill to decide:

1. Which project directory should own the task.
2. Whether the task spans more than one domain.

This skill is a router, not a domain handbook. It should not teach frontend, backend, research, data-analysis, or office practices directly. Its job is to send the session to the right place.

## Routing Principles

- Prefer one clear primary domain.
- Add one secondary domain only if it materially changes execution.
- Route before loading domain-specific skills.
- Keep the global layer thin. Domain guardrails belong in local project skill packs.
- If the current directory already matches the best domain, stay there instead of asking for a move.
- The global layer should route to a directory, not curate a local skill list.

## Global Process Skills

These remain globally available regardless of directory:

- `using-superpowers`
- `brainstorming`
- `systematic-debugging`
- `test-driven-development`
- `writing-plans`
- `executing-plans`
- `verification-before-completion`
- `high-agency`
- `pua`

## Domain Map

| Domain | Directory | Typical task shape |
| --- | --- | --- |
| Scientific computing | `~/scientific-project/` | ML, biology, chemistry, simulation, model training |
| Database lookup | `~/database-project/` | Literature, public datasets, biomedical and business database queries |
| Data analysis | `~/data-analysis-project/` | EDA, statistics, visualization, notebooks, forecasting |
| Development | `~/dev-project/` | Frontend, backend, APIs, CI/CD, infra, agent engineering |
| Marketing | `~/marketing-project/` | SEO, ads, landing pages, messaging, campaigns |
| Research | `~/research-project/` | Papers, reviews, grants, scientific writing, peer review |
| Office | `~/office-project/` | PDF, Word, Excel, PowerPoint, document manipulation |
| Productivity | `~/productivity-project/` | Obsidian, Jira, Google Workspace, PM workflows |

## Domain Heuristics

Use these to break ties:

- If the user is building software, default to `~/dev-project/` even when the software uses AI.
- If the user is analyzing data for insight, default to `~/data-analysis-project/`.
- If the user is querying external scientific or business sources, default to `~/database-project/`.
- If the user is writing research artifacts rather than building systems, default to `~/research-project/`.
- If the task centers on business messaging or acquisition, default to `~/marketing-project/`.
- If the task is primarily document transformation, default to `~/office-project/`.
- If the task is workflow tooling or organizational operations, default to `~/productivity-project/`.

## Cross-Domain Rules

Many tasks are mixed. Use this format:

- `Primary domain`: the directory where most implementation or reasoning should happen
- `Secondary domain`: optional, only if it materially changes where supporting work belongs

Examples:

- Build a LangGraph app for literature synthesis
  - Primary: `~/dev-project/`
  - Secondary: `~/research-project/`
- Analyze experiment results and plot figures
  - Primary: `~/data-analysis-project/`
  - Secondary: `~/scientific-project/`
- Build a dashboard for marketing metrics
  - Primary: `~/dev-project/`
  - Secondary: `~/marketing-project/`

## Output Format

When routing a task, answer in this structure:

```text
Primary domain: <domain>
Directory: <path>
Secondary domain: <domain or none>
Why: <one or two sentences>
Switch command: cd <path> && claude
```

If already in the correct directory:

```text
Primary domain: <domain>
Directory: <current path>
Secondary domain: <domain or none>
Why: <one or two sentences>
Switch command: none
```

## Startup Guidance

After routing, tell the user to start from the target project directory and let that local pack govern domain-specific skill choice.

- Do not enumerate local skills from the global layer.
- Do not dump a long list of next steps.
- If the current directory is already correct, say so and continue there.

## What Not To Do

- Do not duplicate local domain skill content here.
- Do not block work with domain-specific guardrails from the global layer.
- Do not recommend changing directories when the current one is already correct.
- Do not suggest more than one secondary domain.
- Do not turn a routing answer into a full design or implementation plan.
- Do not recommend specific local skills from the global layer.
