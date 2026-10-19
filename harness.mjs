#!/usr/bin/env node
// Installs and maintains this repo's agent harness on the current machine.
// Design: docs/harness-v2.md.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { makeContext, isWorktree } from './lib/platform.mjs';
import { loadState } from './lib/state.mjs';
import { runInstall } from './lib/engine.mjs';
import { PACKS } from './lib/skills.mjs';
import { doctor, repoProblems } from './lib/doctor.mjs';

const USAGE = `usage:
  node harness.mjs install --agents claude,codex,cursor,opencode,pi [--packs ${Object.keys(PACKS).join(',')}] [--dry-run]
  node harness.mjs update [--dry-run]
  node harness.mjs doctor [--deep]
  node harness.mjs resolve                  list conflicts and the items kept on this machine
  node harness.mjs resolve repo <id|all>    use the repo's version
  node harness.mjs resolve keep <id|all>    keep this machine's version and stop managing it
                                            all settles the current conflicts only: it never lifts
                                            an earlier keep (give that item's id for that)
  node harness.mjs uninstall --agents <list>
  node harness.mjs check                    repo self-check
install without --packs keeps the packs already installed (all of them the first time)
add --verbose to list every change`;

const repo = dirname(fileURLToPath(import.meta.url));
// HARNESS_HOME points the installer at another home (tests use it); its state then
// lives in that home too, so the real machine state is never touched.
const home = process.env.HARNESS_HOME || undefined;
const ctx = makeContext({ repo, home, local: home ? join(home, '.harness-local') : undefined });
const [cmd, ...args] = process.argv.slice(2);
const has = (flag) => args.includes(`--${flag}`);
const list = (flag) => {
  const i = args.indexOf(`--${flag}`);
  return i === -1 ? null : (args[i + 1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
};

function die(msg, code = 2) {
  console.error(msg);
  process.exit(code);
}

// Links make the checkout live; a worktree must never become what agents run.
function liveGuard() {
  if (isWorktree(repo) && !home) die('This checkout is a git worktree: links would point into it. Run install/update from the main checkout.');
}

function agentList() {
  const agents = list('agents');
  if (!agents?.length) die(USAGE);
  return agents;
}

function installedState() {
  const state = loadState(ctx.local);
  if (!state.agents.length) die('nothing installed yet — run: node harness.mjs install --agents <list>');
  return state;
}

function printReport(r) {
  if (!r.changes.length) console.log('no changes');
  else if (has('verbose') || r.changes.length <= 40) {
    console.log(`changes (${r.changes.length}):`);
    for (const c of r.changes) console.log(`  ${c}`);
  } else {
    const byVerb = new Map();
    for (const c of r.changes) byVerb.set(c.split(' ')[0], (byVerb.get(c.split(' ')[0]) ?? 0) + 1);
    console.log(`changes (${r.changes.length}): ${[...byVerb].map(([v, n]) => `${v} ×${n}`).join(', ')} — add --verbose to list them`);
  }
  for (const w of r.warnings) console.log(`warning: ${w}`);
  for (const n of r.notes) console.log(`note: ${n}`);
  if (!r.conflicts.length) return 0;
  console.log(`conflicts (${r.conflicts.length}) — nothing was written for these:`);
  for (const c of r.conflicts) console.log(`  ${c.id}\n      ${c.msg}`);
  console.log('  resolve with: node harness.mjs resolve repo <id|all>   or   node harness.mjs resolve keep <id|all>');
  return 1;
}

try {
  switch (cmd) {
    case 'install': {
      liveGuard();
      const agents = agentList();
      const state = loadState(ctx.local);
      // Adding an agent must not quietly widen the packs this machine chose; only a first install takes them all.
      const packs = list('packs') ?? (state.packs.length ? state.packs : Object.keys(PACKS));
      process.exit(printReport(runInstall(ctx, { agents, packs, dryRun: has('dry-run') })));
    }
    case 'update': {
      liveGuard();
      const state = installedState();
      process.exit(printReport(runInstall(ctx, { agents: state.agents, packs: state.packs, dryRun: has('dry-run') })));
    }
    case 'resolve': {
      liveGuard();
      const state = installedState();
      const [how, id] = args;
      if (!how) {
        const r = runInstall(ctx, { agents: state.agents, packs: state.packs, dryRun: true });
        if (!r.conflicts.length) console.log('no conflicts');
        for (const c of r.conflicts) console.log(`${c.id}\n    ${c.msg}`);
        for (const [key, e] of Object.entries(state.entries)) if (e.pinned) console.log(`kept local, not managed: ${key}`);
        process.exit(0);
      }
      if (!['repo', 'keep'].includes(how) || !id) die(USAGE);
      process.exit(printReport(runInstall(ctx, { agents: state.agents, packs: state.packs, resolutions: { [id]: how } })));
    }
    case 'uninstall': {
      liveGuard();
      const agents = agentList();
      process.exit(printReport(runInstall(ctx, { agents, packs: loadState(ctx.local).packs, uninstall: true })));
    }
    case 'doctor': {
      const found = await doctor(ctx, { deep: has('deep') });
      if (!found.length) console.log('all good');
      for (const f of found) console.log(`${f.level === 'fail' ? 'FAIL' : 'warn'}: ${f.msg}`);
      process.exit(found.some((f) => f.level === 'fail') ? 1 : 0);
    }
    case 'check': {
      const problems = repoProblems(ctx);
      for (const p of problems) console.error(`FAIL: ${p}`);
      if (!problems.length) console.log('repo is consistent');
      process.exit(problems.length ? 1 : 0);
    }
    default:
      die(USAGE, cmd ? 2 : 0);
  }
} catch (e) {
  // The message only: a stack or a cause chain could carry text read from a config file, and that may hold a token.
  console.error(`error: ${e.message}`);
  process.exit(1);
}
