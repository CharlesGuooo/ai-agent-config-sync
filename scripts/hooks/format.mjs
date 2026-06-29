#!/usr/bin/env node
// PostToolUse formatter. Reads the tool-call JSON on stdin, finds the edited
// file, and runs a formatter ONLY when the project opts in (a formatter config
// is present up the tree) and the formatter binary is installed. Otherwise it
// no-ops. Always exits 0 — a formatter must never break or block the session.
//
// Defensive by design: global config synced across many project types, so it
// stays silent unless a project clearly wants formatting.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname, parse as parsePath } from 'node:path';
import { execFileSync } from 'node:child_process';

function readStdin() { try { return readFileSync(0, 'utf8'); } catch { return ''; } }

let payload = {};
try { payload = JSON.parse(readStdin() || '{}'); } catch { process.exit(0); }

const input = payload.tool_input || payload.toolInput || payload.input || {};
const file = input.file_path || input.path || input.filePath || '';
if (!file || !existsSync(file)) process.exit(0);

// Walk up from the file's directory looking for any of `names`.
function findUp(names, startDir) {
  let dir = startDir;
  const root = parsePath(dir).root;
  while (true) {
    for (const n of names) if (existsSync(join(dir, n))) return join(dir, n);
    if (dir === root) return null;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function has(bin) {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'which', [bin], { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

function run(bin, args) {
  try { execFileSync(bin, args, { stdio: 'ignore', timeout: 10000 }); } catch { /* never block */ }
}

const ext = extname(file).toLowerCase();
const dir = dirname(file);

// Prettier family — only if a prettier config exists in the project.
const PRETTIER_EXT = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.css', '.scss', '.md', '.html', '.yaml', '.yml'];
if (PRETTIER_EXT.includes(ext)) {
  const cfg = findUp(
    ['.prettierrc', '.prettierrc.json', '.prettierrc.yml', '.prettierrc.yaml', '.prettierrc.js', '.prettierrc.cjs', 'prettier.config.js', 'prettier.config.cjs'],
    dir
  );
  if (cfg && has('prettier')) run('prettier', ['--write', file]);
  process.exit(0);
}

// Python — ruff (preferred) or black, only if their config opts in.
if (ext === '.py') {
  const ruffCfg = findUp(['ruff.toml', '.ruff.toml'], dir) || pyprojectHas(dir, 'tool.ruff');
  if (ruffCfg && has('ruff')) { run('ruff', ['format', file]); process.exit(0); }
  const blackCfg = pyprojectHas(dir, 'tool.black');
  if (blackCfg && has('black')) run('black', ['-q', file]);
  process.exit(0);
}

// Go — gofmt needs no config; gofmt is the canonical formatter.
if (ext === '.go' && has('gofmt')) { run('gofmt', ['-w', file]); process.exit(0); }

// Shell — shfmt, only if installed (no config required, but opt-in via presence).
if (ext === '.sh' && has('shfmt')) { run('shfmt', ['-w', file]); process.exit(0); }

process.exit(0);

// Returns a truthy path if pyproject.toml up-tree contains the given table.
function pyprojectHas(startDir, table) {
  const p = findUp(['pyproject.toml'], startDir);
  if (!p) return null;
  try {
    const txt = readFileSync(p, 'utf8');
    return txt.includes(`[${table}]`) || txt.includes(`[${table.split('.').join('.')}`) ? p : null;
  } catch { return null; }
}
