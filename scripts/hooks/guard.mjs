#!/usr/bin/env node
// PreToolUse safety guard. Reads the tool-call JSON on stdin and BLOCKS
// (exit code 2 — Claude/Codex show stderr to the model) when a call would
// touch a secret file or run a clearly destructive shell command.
//
// Designed to be shared across agents: it tolerates the small differences in
// the stdin payload shape (Claude vs Codex) by probing several field names.
// Fails OPEN on anything it doesn't understand — a guard that breaks normal
// work is worse than no guard. It only blocks on high-confidence matches.

import { readFileSync } from 'node:fs';

function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

function block(reason) {
  process.stderr.write(`[guard] blocked: ${reason}\n`);
  process.exit(2);
}

let payload = {};
try { payload = JSON.parse(readStdin() || '{}'); } catch { process.exit(0); }

// Normalise across agents.
const tool = payload.tool_name || payload.toolName || payload.tool || '';
const input = payload.tool_input || payload.toolInput || payload.input || payload.arguments || {};
const filePath = input.file_path || input.path || input.filePath || input.notebook_path || '';
const command = input.command || input.cmd || (Array.isArray(input.command) ? input.command.join(' ') : '') || '';

// --- secret-file patterns (block read & write) ---
const SECRET_FILE = [
  /(^|[\\/])\.env(\.[^\\/]*)?$/i,      // .env, .env.local, .env.production
  /(^|[\\/])auth\.json$/i,
  /(^|[\\/])id_(rsa|ed25519|ecdsa)\b/i,
  /\.(pem|p12|pfx)$/i,
  /(^|[\\/])\.?(aws|gcp|ssh)[\\/]credentials?$/i,
  /(secret|credential)s?[\\/]/i,
];
// don't trip on obvious non-secret samples
const SAFE_SUFFIX = /\.(example|sample|template|dist)$/i;

if (filePath && !SAFE_SUFFIX.test(filePath)) {
  for (const re of SECRET_FILE) {
    if (re.test(filePath)) block(`access to secret-like file "${filePath}" (${re})`);
  }
}

// --- destructive shell patterns ---
if (command) {
  const DANGER = [
    { re: /\brm\s+-[a-z]*r[a-z]*f[a-z]*\s+(-[a-z]+\s+)*(\/|~|\$HOME|\.\s*$|\*)/i, why: 'recursive force-delete of a root/home/glob path' },
    { re: /\brm\s+-[a-z]*f[a-z]*r[a-z]*\s+(-[a-z]+\s+)*(\/|~|\$HOME|\.\s*$|\*)/i, why: 'recursive force-delete of a root/home/glob path' },
    { re: /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, why: 'fork bomb' },
    { re: /\bmkfs\.[a-z0-9]+\b/i, why: 'filesystem format' },
    { re: /\bdd\b[^\n]*\bof=\/dev\/(sd|nvme|disk|hd)/i, why: 'raw write to a block device' },
    { re: /\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z|d)?sh\b/i, why: 'pipe remote script straight into a shell' },
    { re: /\bgit\s+push\b(?!.*--force-with-lease)[^\n]*\s(--force|-f)\b/i, why: 'unguarded force-push (use --force-with-lease)' },
    { re: /\bchmod\s+-R\s+0?777\s+\//i, why: 'world-writable recursive chmod on /' },
  ];
  for (const d of DANGER) {
    if (d.re.test(command)) block(`${d.why} — "${command.trim().slice(0, 120)}"`);
  }
}

process.exit(0);
