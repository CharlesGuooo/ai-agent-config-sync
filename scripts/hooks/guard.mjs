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
import { homedir } from 'node:os';

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

// --- recursive force-delete of a broad target ---
// Broad: root, a drive or a top-level folder (/tmp, /usr, /d, C:/), any two-level path outside /tmp, the home folder
// or a folder directly in it, the current or parent directory, or a glob over any of these. A concrete deeper path
// (/tmp/build/out, /d/Projects2/app/node_modules, ~/projects/scratch) is ordinary cleanup and passes.
const segs = (p) => p.split('/').filter((s) => s && s !== '.');
// "C:\Users\me" and "/c/Users/me" are the same folder: compare in the Git Bash form, case-insensitively.
const posix = (p) => p.replace(/\\/g, '/').replace(/^([A-Za-z]):(?=\/|$)/, (_, d) => `/${d.toLowerCase()}`);
const homes = [process.env.HOME, process.env.USERPROFILE, homedir()].filter(Boolean).map((h) => segs(posix(h)).join('/').toLowerCase());

function broadTarget(token) {
  const t = posix(token.replace(/["']/g, ''));
  if (!t) return false;
  const home = /^(~|\$HOME|\$\{HOME\})(?=\/|$)/.exec(t);
  const parts = segs(home ? t.slice(home[0].length) : t);
  const glob = parts.findIndex((s) => /[*?[]/.test(s));
  const fixed = glob < 0 ? parts : parts.slice(0, glob);   // the folders before any glob
  if (home) return fixed.length <= 1 || fixed.includes('..');
  if (!t.startsWith('/')) return fixed.every((s) => s === '..');
  if (fixed.length <= 1 || fixed.includes('..')) return true;
  if (fixed.length === 2 && fixed[0] !== 'tmp') return true;
  const path = fixed.join('/').toLowerCase();
  return homes.some((h) => path === h || (path.startsWith(`${h}/`) && fixed.length === segs(h).length + 1));
}

function broadDelete(cmd) {
  for (const part of cmd.split(/[;&|()\n]/)) {
    const tokens = part.match(/(?:"[^"]*"|'[^']*'|[^\s"'])+/g) ?? [];
    const at = tokens.findIndex((t) => /(^|\/)rm$/.test(t));
    if (at < 0) continue;
    let recursive = false, force = false, i = at + 1;
    for (; i < tokens.length && tokens[i].startsWith('-'); i++) {
      const f = tokens[i];
      if (f === '--') { i++; break; }
      if (f === '--recursive' || (!f.startsWith('--') && /r/i.test(f))) recursive = true;
      if (f === '--force' || (!f.startsWith('--') && /f/.test(f))) force = true;
    }
    if (recursive && force && tokens.slice(i).some(broadTarget)) return true;
  }
  return false;
}

if (command && broadDelete(command)) block(`recursive force-delete of a root/home/glob path — "${command.trim().slice(0, 120)}"`);

// --- destructive shell patterns ---
if (command) {
  const DANGER = [
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
