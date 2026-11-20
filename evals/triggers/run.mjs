#!/usr/bin/env node
// Trigger test: for each query, does `claude -p` invoke the skill under test as its first tool call?
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const RESULTS = join(ROOT, '.local', 'trigger-results');
const TIMEOUT_MS = 90_000;

// Skill name if the first tool_use is Skill, null if it is another tool, undefined if none seen yet.
export function invokedSkill(lines) {
  for (const raw of lines) {
    let ev;
    try { ev = JSON.parse(raw); } catch { continue; }
    if (ev?.type !== 'assistant' || !Array.isArray(ev.message?.content)) continue;
    for (const block of ev.message.content) {
      if (block?.type !== 'tool_use') continue;
      return block.name === 'Skill' ? (block.input?.skill ?? null) : null;
    }
  }
  return undefined;
}

const sum = (entries, wantTrigger) => {
  let hits = 0, n = 0;
  for (const e of entries) if (e.should_trigger === wantTrigger) { hits += e.hits; n += e.runs; }
  return [hits, n];
};
const count = (entries, field) => entries.reduce((t, e) => t + (e[field] ?? 0), 0);

// Rates, not raw counts, so runs=3 can be compared with runs=1. A skill with any errored or timed-out call
// on either side is inconclusive: such calls look like "no trigger" and would hide or fake a change.
export function compare(before, after) {
  return Object.keys(before.results).map((skill) => {
    const b = before.results[skill];
    const a = after.results[skill] ?? [];
    const [bsh, bsn] = sum(b, true), [ash, asn] = sum(a, true);
    const [bfh, bfn] = sum(b, false), [afh, afn] = sum(a, false);
    const rate = (h, n) => (n ? h / n : 0);
    const should = [rate(bsh, bsn), rate(ash, asn)];
    const falsePos = [rate(bfh, bfn), rate(afh, afn)];
    const inconclusive = count(b, 'errors') + count(b, 'timeouts') + count(a, 'errors') + count(a, 'timeouts') > 0;
    // cross-multiplied so equal fractions with different denominators compare equal exactly
    const shouldOk = asn > 0 && ash * bsn >= bsh * asn;
    const falseOk = afn === 0 ? true : bfn === 0 ? afh === 0 : afh * bfn <= bfh * afn;
    const pass = !inconclusive && shouldOk && falseOk;
    return { skill, pass, inconclusive, should, falsePos, counts: { should: [[bsh, bsn], [ash, asn]], falsePos: [[bfh, bfn], [afh, afn]] } };
  });
}

// How to launch claude: on Windows the npm shim is a .cmd, so resolve it to the real executable or JS entry.
function claudeCommand() {
  if (process.platform !== 'win32') return { cmd: 'claude', pre: [] };
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    const shim = join(dir, 'claude.cmd');
    if (!dir || !existsSync(shim)) continue;
    const m = readFileSync(shim, 'utf8').match(/"%dp0%\\([^"]+\.(?:exe|js))"/i);
    if (!m) continue;
    const target = join(dir, m[1]);
    return target.endsWith('.js') ? { cmd: process.execPath, pre: [target] } : { cmd: target, pre: [] };
  }
  throw new Error('could not resolve the claude executable from claude.cmd');
}

let cleanupFailures = 0, stuckChildren = 0;
function removeDir(dir, retries = 10) {
  try { rmSync(dir, { recursive: true, force: true, maxRetries: retries, retryDelay: 200 }); } catch { cleanupFailures++; }
}

// Options are a test seam: a fake spawn, short timers, and the command to run.
export function runQuery(query, { spawnFn = spawn, command, timeoutMs = TIMEOUT_MS, killGraceMs = 5000 } = {}) {
  const { cmd, pre } = command ?? claudeCommand();
  const cwd = mkdtempSync(join(tmpdir(), 'trigger-'));
  const env = { ...process.env };
  delete env.CLAUDECODE;
  return new Promise((resolve) => {
    const child = spawnFn(cmd, [...pre, '-p', query, '--output-format', 'stream-json', '--verbose'], { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const lines = [];
    let buf = '', stderr = '', decided = false, settled = false, timedOut = false, result, error, grace;
    const settle = (stuck = false) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(grace);
      if (stuck) stuckChildren++;
      removeDir(cwd, stuck ? 0 : 10);
      resolve({ result, timedOut, error });
    };
    const decide = (res) => {
      if (decided) return;
      decided = true;
      result = res;
      child.kill();
      // close only fires once the process and its pipes are gone; do not wait for it forever
      grace = setTimeout(() => settle(true), killGraceMs);
    };
    const timer = setTimeout(() => { timedOut = true; decide(undefined); }, timeoutMs);
    child.stderr.on('data', (d) => { stderr = (stderr + d.toString('utf8')).slice(-500); });
    child.stdout.on('data', (d) => {
      buf += d.toString('utf8');
      const parts = buf.split('\n');
      buf = parts.pop();
      lines.push(...parts);
      const r = invokedSkill(lines);
      if (r !== undefined) decide(r);
    });
    child.on('error', (e) => { error ??= `spawn error: ${e.message}`; decided = true; settle(); });
    child.on('close', (code) => {
      if (buf) lines.push(buf);
      if (!decided) {
        decided = true;
        result = invokedSkill(lines);
        if (result === undefined && code !== 0) error ??= `exit code ${code}: ${stderr.trim()}`;
      }
      settle();
    });
  });
}

async function pool(tasks, jobs) {
  let next = 0;
  await Promise.all(Array.from({ length: jobs }, async () => {
    while (next < tasks.length) await tasks[next++]();
  }));
}

async function run(label, { skills, runs, jobs }) {
  const all = ['brainstorming', 'officecli', 'requesting-code-review', 'pdf', 'skill-creator', 'handoff', 'skill-find'];
  const names = skills ?? all;
  const file = join(RESULTS, `${label}.json`);
  const out = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { label, runs, results: {}, dates: {} };
  out.label = label; out.runs = runs; out.dates ??= {};
  for (const skill of names) {
    const set = JSON.parse(readFileSync(join(HERE, `${skill}.json`), 'utf8'));
    const entries = set.map((q) => ({ query: q.query, should_trigger: q.should_trigger, hits: 0, runs }));
    const tasks = [];
    entries.forEach((e) => {
      for (let i = 0; i < runs; i++) {
        tasks.push(async () => {
          const { result, timedOut, error } = await runQuery(e.query);
          if (result === skill) e.hits++;
          if (timedOut) e.timeouts = (e.timeouts ?? 0) + 1;
          if (error) {
            e.errors = (e.errors ?? 0) + 1;
            e.firstError ??= error;
          }
        });
      }
    });
    await pool(tasks, jobs);
    out.results[skill] = entries;
    out.dates[skill] = new Date().toISOString();
    const [sh, sn] = sum(entries, true), [fh, fn] = sum(entries, false);
    console.log(`${skill}: should ${sh}/${sn}  false ${fh}/${fn}  errors ${count(entries, 'errors')}  timeouts ${count(entries, 'timeouts')}`);
    const firstError = entries.find((e) => e.firstError)?.firstError;
    if (firstError) console.log(`  first error: ${firstError}`);
    mkdirSync(RESULTS, { recursive: true });
    writeFileSync(file, JSON.stringify(out, null, 2));
  }
  if (cleanupFailures) console.warn(`warning: ${cleanupFailures} temp dir(s) named trigger-* could not be removed from ${tmpdir()}`);
  if (stuckChildren) console.warn(`warning: ${stuckChildren} claude process(es) did not close after being killed`);
  console.log(`wrote ${file}`);
}

function load(label) {
  return JSON.parse(readFileSync(join(RESULTS, `${label}.json`), 'utf8'));
}

async function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === 'run') {
    const label = rest[0];
    const opt = (name, d) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : d; };
    if (!label) throw new Error('usage: run <label> [--skills a,b] [--runs N] [--jobs N]');
    await run(label, { skills: opt('--skills')?.split(','), runs: Number(opt('--runs', 1)), jobs: Number(opt('--jobs', 4)) });
  } else if (cmd === 'compare') {
    const rows = compare(load(rest[0]), load(rest[1]));
const pct = (r, [h, n]) => `${Math.round(r * 100)}% (${h}/${n})`;
    for (const r of rows) {
      const tag = r.inconclusive ? 'INCONCLUSIVE' : r.pass ? 'ok  ' : 'FAIL';
      const c = r.counts;
      console.log(`${tag} ${r.skill}: should ${pct(r.should[0], c.should[0])} -> ${pct(r.should[1], c.should[1])}  false ${pct(r.falsePos[0], c.falsePos[0])} -> ${pct(r.falsePos[1], c.falsePos[1])}`);
    }
    if (rows.some((r) => !r.pass)) process.exitCode = 1;
  } else {
    throw new Error('usage: run.mjs run <label> | compare <before> <after>');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exit(2); });
}
