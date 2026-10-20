---
name: aoci-code
description: >-
  Points to AOCI-CODE (aoci-spec/aoci-code): a Git-versioned index of a whole codebase, one line
  per file written by the agent (what it does, what it depends on, what must not break), served
  by a local MCP server so an agent knows the system before it touches it, across sessions and
  agents. Use when the user wants an agent to take over or keep developing a large system, or
  says "给这个项目建索引", "让 agent 先读懂整个系统", "AOCI". Not vendored: install it into the
  project (Setup below). For precise lookups (who calls X, the path between two symbols), the
  global graphify skill is the tool.
allowed-tools: Read, Bash
compatibility: "local-tools — needs the aoci binary from the project's GitHub releases; building the index costs model tokens, about an hour per 200,000 lines"
metadata:
  category: dev
  source: >-
    Pointer to https://github.com/aoci-spec/aoci-code (FSL-1.1-MIT, source-available); facts
    checked against its README at v0.1.0-rc21 (2026-10-16).
---

# aoci-code (pointer)

AOCI-CODE keeps a plain-text index of the system next to the code: `aoci.txt` (entry point),
`aoci.meta.txt` (tag dictionary and rules) and `aoci.code.txt`, one entry per file in the form
`F:` responsibility · `R:` files to read with it · `A:` what callers depend on · `S:` what cannot
be inferred from the code but must not be broken. An agent reads the index once and knows the
system; the MCP server notices code changes and asks the agent to refresh the affected entries
as it finishes each task. MySQL and PostgreSQL schemas can be indexed too, table by table.

**Source:** https://github.com/aoci-spec/aoci-code
**Why pointer, not vendored:** it is a Go binary plus an MCP server that writes into the project;
there is no skill text to copy.

## Before installing

Installing downloads and runs a third-party binary, writes files into the project, and the first
index costs model tokens. Offer the steps below with that cost, and run them once the user agrees.

- The index files and the `AGENTS.md` that `init` writes are meant to be committed: they are how
  the next session and the next agent pick up the system. In a public repository they are public
  too. Leave them out of `.gitignore` and `.git/info/exclude`, since `scan` skips ignored files.
- It is local-only: it reads source and table structures, never business data, and opens no
  Internet connection. Database credentials are referenced by environment-variable name.
- License FSL-1.1-MIT: free to use, not to build a competing product on; each release turns MIT
  two years later.

## Setup (per project)

1. Download the release for this OS and CPU from https://github.com/aoci-spec/aoci-code/releases,
   verify it as the release page says, and put `aoci` (`aoci.exe` on Windows) at a stable
   absolute path.
2. From the project root: `<path>/aoci init` (wires the MCP server into the current agent; for
   Cursor it prints the configuration to paste), then `<path>/aoci scan`.
3. Restart the agent so it loads the new MCP server, confirm the server is connected, then ask:
   "Build the AOCI index for this project." It works in batches and resumes if interrupted.
4. Optional: `aoci ui --detach --json` starts the status panel and prints its link.

After a context compaction, or to rebuild the picture of the system: "Using only AOCI, establish
whole-framework cognition of this project and tell me your mastery of each area."
