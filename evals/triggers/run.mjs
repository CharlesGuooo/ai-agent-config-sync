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

export function compare(before, after) {
  return Object.keys(before.results).map((skill) => {
    const b = before.results[skill];
    const a = after.results[skill] ?? [];
    const should = [sum(b, true)[0], sum(a, true)[0]];
    const falsePos = [sum(b, false)[0], sum(a, false)[0]];
    return { skill, pass: should[1] >= should[0] && falsePos[1] <= falsePos[0], should, falsePos };
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

function runQuery(query) {
  const { cmd, pre } = claudeCommand();
  const cwd = mkdtempSync(join(tmpdir(), 'trigger-'));
  const env = { ...process.env };
  delete env.CLAUDECODE;
  return new Promise((resolve) => {
    const child = spawn(cmd, [...pre, '-p', query, '--output-format', 'stream-json', '--verbose'], { cwd, env, stdio: ['ignore', 'pipe', 'ignore'] });
    const lines = [];
    let buf = '', done = false, timedOut = false;
    const finish = (res) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      child.kill();
      setTimeout(() => { try { rmSync(cwd, { recursive: true, force: true }); } catch {} }, 500);
      resolve({ result: res, timedOut });
    };
    const timer = setTimeout(() => { timedOut = true; finish(undefined); }, TIMEOUT_MS);
    child.stdout.on('data', (d) => {
      buf += d.toString('utf8');
      const parts = buf.split('\n');
      buf = parts.pop();
      lines.push(...parts);
      const r = invokedSkill(lines);
      if (r !== undefined) finish(r);
    });
    child.on('error', () => finish(undefined));
    child.on('close', () => { if (buf) lines.push(buf); finish(invokedSkill(lines)); });
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
          const { result, timedOut } = await runQuery(e.query);
          if (result === skill) e.hits++;
          if (timedOut) e.timeouts = (e.timeouts ?? 0) + 1;
        });
      }
    });
    await pool(tasks, jobs);
    out.results[skill] = entries;
    out.dates[skill] = new Date().toISOString();
    const [sh, sn] = sum(entries, true), [fh, fn] = sum(entries, false);
    console.log(`${skill}: should ${sh}/${sn}  false ${fh}/${fn}`);
    mkdirSync(RESULTS, { recursive: true });
    writeFileSync(file, JSON.stringify(out, null, 2));
  }
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
    for (const r of rows) console.log(`${r.pass ? 'ok  ' : 'FAIL'} ${r.skill}: should ${r.should[0]} -> ${r.should[1]}  false ${r.falsePos[0]} -> ${r.falsePos[1]}`);
    if (rows.some((r) => !r.pass)) process.exitCode = 1;
  } else {
    throw new Error('usage: run.mjs run <label> | compare <before> <after>');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exit(2); });
}
