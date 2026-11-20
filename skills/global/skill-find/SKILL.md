---
name: skill-find
description: >-
  Finds skills for the project at hand among this harness's local packs and,
  once the user agrees, links them into the project. Use when the user
  describes a project or task and asks what skills would help, or asks for a
  skill: "这个项目需要什么 skill", "找个 X 的 skill", "帮我装 skill",
  "有没有做 X 的技能", "find a skill for X", "set up skills for this project".
  Not for a skill another skill mentions: read that one straight from the repo.
---

# skill-find

`<repo>` is the directory that holds `HARNESS.md`, named in your global instructions.

1. **Pin down the work.** Ask one question if the project or task is too thin to search on.
2. **Search the index.** Take 2-4 keywords, in Chinese and English, and run `grep -n -i` over `<repo>/HARNESS.md`. Read only the `#### <pack>` sections that hit; the file is 54 KB.
3. **Check each candidate.** Open `<repo>/skills/project-packs/**/skills/<name>/SKILL.md` and confirm it fits the work.
4. **Offer a shortlist** of at most 5, one reason each. A skill that is already global needs no install; say so.
5. **Install once the user agrees.** Run `node <repo>/harness.mjs add <name>[,<name>...] <project-dir>`. The project is the session's working directory unless the user names another. Relay every warning as printed: "left as it is" means the project already had something under that name and it was not touched. If the sandbox blocks the write, give the user the command to run themselves. Running `add` waits for the user's yes.
6. **Say how to pick them up.** Claude Code reads `<project>/.claude/skills/` in the current session; a folder created just now needs `/reload-skills` first. Codex, Cursor, OpenCode and Pi load them in a new session opened in the project.
7. **Undo with** `node <repo>/harness.mjs remove <name>|all <project-dir>`.
