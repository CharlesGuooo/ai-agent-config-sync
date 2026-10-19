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
import { loadSources, upstreamStatus } from './lib/upstream.mjs';

const USAGE = `usage:
  node harness.mjs install --agents claude,codex,cursor,opencode,pi [--packs ${Object.keys(PACKS).join(',')}] [--dry-run]
  node harness.mjs update [--dry-run]
  node harness.mjs uninstall --agents <list> [--dry-run]
  node harness.mjs resolve                            list conflicts and the items kept on this machine
  node harness.mjs resolve repo <id|all> [--dry-run]  use the repo's version
  node harness.mjs resolve keep <id|all> [--dry-run]  keep this machine's version and stop managing it
      all settles the current conflicts only: it never lifts an earlier keep (give that item's id for that)
  node harness.mjs doctor [--deep]                    health check; --deep also starts the agents themselves
                                                      (they may write their own logs and caches)
  node harness.mjs check                              repo self-check
  node harness.mjs upstream                           which vendored skills have a newer upstream (skills/sources.json;
                                                      reads GitHub, set GITHUB_TOKEN for more than 60 lookups an hour)
  node harness.mjs help
install without --packs keeps the packs already installed (all of them the first time)
add --verbose to install, update, uninstall or resolve to list every change`;

// Each command's flags (true: takes a comma-separated list) and how many words may follow it. Anything else is refused,
// so a misspelled --dry-run stops the command instead of letting it write.
const COMMANDS = {
  install: { flags: { agents: true, packs: true, 'dry-run': false, verbose: false }, words: [0] },
  update: { flags: { 'dry-run': false, verbose: false }, words: [0] },
  uninstall: { flags: { agents: true, 'dry-run': false, verbose: false }, words: [0] },
  resolve: { flags: { 'dry-run': false, verbose: false }, words: [0, 1, 2] },
  doctor: { flags: { deep: false }, words: [0] },
  check: { flags: {}, words: [0] },
  upstream: { flags: {}, words: [0] },
};

const repo = dirname(fileURLToPath(import.meta.url));
// HARNESS_HOME points the installer at another home (tests use it); its state then
// lives in that home too, so the real machine state is never touched.
const home = process.env.HARNESS_HOME || undefined;
const ctx = makeContext({ repo, home, local: home ? join(home, '.harness-local') : undefined });

function die(msg, code = 2) {
  console.error(msg);
  process.exit(code);
}

const usageError = (why) => die(`${why}\n${USAGE}`);

function parse(cmd, argv) {
  const spec = COMMANDS[cmd];
  const flags = {};
  const words = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('-')) {
      words.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (!arg.startsWith('--') || !Object.hasOwn(spec.flags, name)) usageError(`${cmd}: unknown option ${arg}`);
    if (Object.hasOwn(flags, name)) usageError(`${cmd}: ${arg} is given twice`);
    if (!spec.flags[name]) {
      flags[name] = true;
      continue;
    }
    const value = argv[++i];
    const items = value === undefined || value.startsWith('-') ? [] : [...new Set(value.split(',').map((s) => s.trim()).filter(Boolean))];
    if (!items.length) usageError(`${cmd}: ${arg} needs a comma-separated list`);
    flags[name] = items;
  }
  if (!spec.words.includes(words.length)) usageError(`${cmd}: unexpected arguments: ${words.join(' ') || '(none)'}`);
  return { flags, words };
}

const argv = process.argv.slice(2);
if (argv[0] === 'help' || argv.includes('--help') || argv.includes('-h')) {
  console.log(USAGE);
  process.exit(0);
}
const [cmd, ...rest] = argv;
if (!cmd) die(USAGE);
if (!Object.hasOwn(COMMANDS, cmd)) usageError(`unknown command: ${cmd}`);
const { flags, words } = parse(cmd, rest);
const dryRun = Boolean(flags['dry-run']);

// Links make the checkout live; a worktree must never become what agents run.
function liveGuard() {
  if (isWorktree(repo) && !home) die('This checkout is a git worktree: links would point into it. Run install/update from the main checkout.');
}

function installedState() {
  const state = loadState(ctx.local);
  if (!state.agents.length) die('nothing installed yet — run: node harness.mjs install --agents <list>');
  return state;
}

function printReport(r) {
  if (dryRun) console.log('dry run — nothing was written');
  const changed = dryRun ? 'would change' : 'changes';
  if (!r.changes.length) console.log('no changes');
  else if (flags.verbose || r.changes.length <= 40) {
    console.log(`${changed} (${r.changes.length}):`);
    for (const c of r.changes) console.log(`  ${c}`);
  } else {
    const byVerb = new Map();
    for (const c of r.changes) byVerb.set(c.split(' ')[0], (byVerb.get(c.split(' ')[0]) ?? 0) + 1);
    console.log(`${changed} (${r.changes.length}): ${[...byVerb].map(([v, n]) => `${v} ×${n}`).join(', ')} — add --verbose to list them`);
  }
  for (const w of r.warnings) console.log(`warning: ${w}`);
  for (const n of r.notes) console.log(`note: ${n}`);
  if (!r.conflicts.length) return 0;
  console.log(`conflicts (${r.conflicts.length}) — nothing was written for these:`);
  for (const c of r.conflicts) console.log(`  ${c.id}\n      ${c.msg}`);
  console.log('  resolve with: node harness.mjs resolve repo <id|all>   or   node harness.mjs resolve keep <id|all>');
  return 1;
}

const kept = (state) => Object.entries(state.entries).filter(([, e]) => e.pinned).map(([id]) => `kept on this machine, not managed: ${id}`);

try {
  switch (cmd) {
    case 'install': {
      liveGuard();
      if (!flags.agents) usageError('install: --agents is required');
      const state = loadState(ctx.local);
      // Adding an agent must not quietly widen the packs this machine chose; only a first install takes them all.
      const packs = flags.packs ?? (state.packs.length ? state.packs : Object.keys(PACKS));
      process.exit(printReport(runInstall(ctx, { agents: flags.agents, packs, dryRun })));
    }
    case 'update': {
      liveGuard();
      const state = installedState();
      process.exit(printReport(runInstall(ctx, { agents: state.agents, packs: state.packs, dryRun })));
    }
    case 'resolve': {
      const [how, id] = words;
      if (how && !['repo', 'keep'].includes(how)) usageError(`resolve: say repo or keep, not ${how}`);
      if (how && !id) usageError(`resolve ${how} needs an id or all`);
      liveGuard();
      const state = installedState();
      const run = (opts) => runInstall(ctx, { agents: state.agents, packs: state.packs, ...opts });
      if (!how) {
        const r = run({ dryRun: true });
        if (!r.conflicts.length) console.log('no conflicts');
        for (const c of r.conflicts) console.log(`${c.id}\n    ${c.msg}`);
        for (const line of kept(state)) console.log(line);
        process.exit(0);
      }
      // A mistyped id would settle nothing and still look like a run that worked.
      if (id !== 'all' && !Object.hasOwn(state.entries, id) && !run({ dryRun: true }).conflicts.some((c) => c.id === id)) {
        die(`no such conflict or managed item: ${id}`);
      }
      process.exit(printReport(run({ resolutions: { [id]: how }, dryRun })));
    }
    case 'uninstall': {
      liveGuard();
      if (!flags.agents) usageError('uninstall: --agents is required');
      process.exit(printReport(runInstall(ctx, { agents: flags.agents, packs: loadState(ctx.local).packs, uninstall: true, dryRun })));
    }
    case 'doctor': {
      const found = await doctor(ctx, { deep: Boolean(flags.deep) });
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
    case 'upstream': {
      const sources = loadSources(ctx.repo);
      const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
      const res = await upstreamStatus(sources, { token });
      const by = (s) => res.filter((r) => r.status === s);
      const newer = by('newer');
      for (const repoName of [...new Set(newer.map((r) => r.repo))].sort()) {
        console.log(repoName);
        for (const r of newer.filter((x) => x.repo === repoName)) console.log(`  ${r.dir}  (ours ${r.since}, upstream ${r.latest.date})`);
      }
      for (const r of [...by('gone'), ...by('error')]) console.log(`${r.status}: ${r.dir} — ${r.msg}`);
      console.log(`${res.length} sources: ${by('current').length} current, ${newer.length} newer upstream, ${by('gone').length} gone, ${by('error').length} errors`);
      process.exit(by('error').length && by('error').length === res.length ? 1 : 0);
    }
  }
} catch (e) {
  // The message only: a stack or a cause chain could carry text read from a config file, and that may hold a token.
  console.error(`error: ${e.message}`);
  process.exit(1);
}
