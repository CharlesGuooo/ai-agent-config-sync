---

## No safety hook here

This harness's `guard.mjs` hook (which blocks reads of secret files and destructive shell commands on Claude Code and Codex) does not run in Cursor. Confirm before any destructive or irreversible command, and never read credential files (`.env`, `auth.json`, `*.pem`, `id_rsa`, cloud credential stores) unless the user asked you to work on that exact file.
