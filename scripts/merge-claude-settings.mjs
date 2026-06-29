#!/usr/bin/env node
// Deep-merge agents/claude/settings.fragment.json into ~/.claude/settings.json.
// Only the keys in the fragment are managed; everything else in the live file
// (env, permissions, API keys, OTHER plugins, the existing SessionStart hook)
// is preserved. Idempotent: re-running adds nothing new.
//
// Usage: node scripts/merge-claude-settings.mjs <fragment> <target> <hooksDir> [--dry-run]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [fragmentPath, targetPath, hooksDir] = process.argv.slice(2);
const dryRun = process.argv.includes('--dry-run');
if (!fragmentPath || !targetPath || !hooksDir) {
  console.error('usage: merge-claude-settings.mjs <fragment> <target> <hooksDir> [--dry-run]');
  process.exit(2);
}

// Fragment, with the {{HOOKS_DIR}} placeholder resolved to an absolute path
// (forward slashes work for `node` on every platform).
const fragRaw = readFileSync(fragmentPath, 'utf8').replaceAll('{{HOOKS_DIR}}', hooksDir.replaceAll('\\', '/'));
const fragment = JSON.parse(fragRaw);
delete fragment.__comment;

const target = existsSync(targetPath) ? JSON.parse(readFileSync(targetPath, 'utf8')) : {};

// enabledPlugins: merge keys (don't drop plugins the machine already enabled).
if (fragment.enabledPlugins) {
  target.enabledPlugins = { ...(target.enabledPlugins || {}), ...fragment.enabledPlugins };
}

// hooks: merge per event, appending our entries; skip if an identical command
// is already wired (idempotent) and never touch events we don't manage
// (e.g. an existing SessionStart -> any-buddy hook stays put).
if (fragment.hooks) {
  target.hooks = target.hooks || {};
  for (const [event, entries] of Object.entries(fragment.hooks)) {
    const existing = target.hooks[event] || [];
    const cmds = new Set(
      existing.flatMap((e) => (e.hooks || []).map((h) => h.command))
    );
    for (const entry of entries) {
      const newCmds = (entry.hooks || []).map((h) => h.command).filter((c) => !cmds.has(c));
      if (newCmds.length) {
        existing.push({ ...entry, hooks: entry.hooks.filter((h) => newCmds.includes(h.command)) });
      }
    }
    target.hooks[event] = existing;
  }
}

// Any other managed top-level keys: shallow-set.
for (const [k, v] of Object.entries(fragment)) {
  if (k === 'enabledPlugins' || k === 'hooks') continue;
  target[k] = v;
}

const out = JSON.stringify(target, null, 2) + '\n';
if (dryRun) {
  console.log(`[dry-run] would merge into ${targetPath}:`);
  console.log('  enabledPlugins:', Object.keys(target.enabledPlugins || {}).join(', '));
  console.log('  hook events:', Object.keys(target.hooks || {}).join(', '));
} else {
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, out);
  console.log(`merged Claude settings -> ${targetPath}`);
}
