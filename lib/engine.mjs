// Applies agents' plans: skill links, instruction blocks, managed files, JSON and
// TOML entries, the v1 cleanup, and removal of whatever the repo stopped shipping.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readText, writeText } from './util.mjs';
import { samePath, resolvesInto } from './platform.mjs';
import { loadState, saveState } from './state.mjs';
import { makeRun } from './run.mjs';
import { globalSkills, packSkillSets } from './skills.mjs';
import { syncLinks, pruneLinks } from './links.mjs';
import { applyBlock, removeBlock, applyFile, removeFile } from './managed.mjs';
import { applyJson, removeJson } from './jsonfile.mjs';
import { applyCodexMcp } from './toml.mjs';
import { loadCatalog, catalogProblems, serversFor, mcpSection } from './mcp.mjs';
import { renderPrompt, catalogErrors } from './prompt.mjs';
import { cleanHome, cleanAgent, cleanSkillDir } from './legacy.mjs';
import claude from './agents/claude.mjs';
import codex from './agents/codex.mjs';
import cursor from './agents/cursor.mjs';
import opencode from './agents/opencode.mjs';
import pi from './agents/pi.mjs';

export const ADAPTERS = { claude, codex, cursor, opencode, pi };

// Codex runs a new or changed hook only after the user has trusted it inside Codex.
const CODEX_TRUST = 'Codex: open Codex and trust the updated hooks (until then they do not run)';

// The adapter's plan plus the rendered instruction text and the server list.
export function buildPlan(ctx, name, warn = () => {}) {
  const adapter = ADAPTERS[name];
  if (!adapter) throw new Error(`unknown agent "${name}" — known: ${Object.keys(ADAPTERS).join(', ')}`);
  const catalog = loadCatalog(ctx.repo);
  const servers = serversFor(catalog, name, ctx.os);
  const plan = adapter.plan(ctx, servers, warn);
  const text = renderPrompt(ctx, { title: adapter.title, agent: name, mcp: mcpSection(servers, adapter.enableHint) });
  return { ...plan, servers, catalogNames: Object.keys(catalog.servers), prompt: { ...plan.prompt, text } };
}

export const packRoot = (ctx, set) => join(ctx.home, set.pack, ...set.sub.split('/').filter(Boolean));

// Cursor reads user rules only from its settings UI, so the text goes to a file to paste.
function writeManual(file, text, run) {
  if (readText(file) === text) return;
  run.change(`write ${file}`);
  run.note(`Cursor rules changed — paste ${file} into Cursor Settings → Rules → User Rules`);
  if (!run.dryRun) writeText(file, text);
}

// Rendering from a broken catalog would write broken configs, so a run starts only from sound ones.
function checkRepo(repo) {
  let problems;
  try {
    problems = catalogProblems(loadCatalog(repo));
  } catch (e) {
    // An MCP catalog that does not even parse is one more problem to list.
    problems = [e.message];
  }
  problems = [...problems, ...catalogErrors(repo)];
  if (problems.length) throw new Error(`the repo's catalogs have problems; fix them first:\n  ${problems.join('\n  ')}`);
}

// A folder link made by hand on the way to any place the plan writes (say ~/.claude pointing into the repo) would put
// the agent's files in the repo's working tree. Cursor's rules to paste go to <local>, which sits in the repo on purpose.
function refuseRepoTargets(ctx, name, packs) {
  const plan = buildPlan(ctx, name);
  const paths = [
    plan.skills.global,
    ...packSkillSets(ctx.repo, packs).map((set) => plan.skills.pack(packRoot(ctx, set))),
    ...(plan.prompt.file ? [plan.prompt.file] : []),
    ...[...plan.files, ...plan.json, ...plan.toml].map((x) => x.file),
  ];
  const bad = paths.filter((p) => resolvesInto(ctx.repo, p));
  if (bad.length) {
    throw new Error(`${name}: these paths lead into the repo ${ctx.repo} through a folder link, so its files would land in the working tree; remove that link first:\n  ${bad.join('\n  ')}`);
  }
}

function applyAgent(ctx, name, packs, run) {
  const plan = buildPlan(ctx, name, run.warn);
  syncLinks(ctx, { ...globalSkills(ctx.repo), dst: plan.skills.global }, run);
  cleanSkillDir(ctx, plan.skills.global, run);
  for (const set of packSkillSets(ctx.repo, packs)) syncLinks(ctx, { src: set.src, names: set.names, dst: plan.skills.pack(packRoot(ctx, set)) }, run);
  if (plan.prompt.manual) writeManual(plan.prompt.manual, plan.prompt.text, run);
  else applyBlock({ id: plan.prompt.id, file: plan.prompt.file, content: plan.prompt.text }, run);
  for (const f of plan.files) applyFile(f, run);
  for (const j of plan.json) {
    const before = run.report.changes.length;
    applyJson(j, run);
    const hookWritten = run.report.changes.slice(before).some((c) => c.startsWith('hook '));
    if (name === 'codex' && hookWritten && !run.report.notes.includes(CODEX_TRUST)) run.note(CODEX_TRUST);
  }
  for (const t of plan.toml) applyCodexMcp(t, run);
  cleanAgent(ctx, name, plan.catalogNames, run);
}

// Removes what this agent had installed that the run did not touch (the repo
// stopped shipping it, or the agent is being uninstalled).
function pruneAgent(name, run) {
  const stale = Object.entries(run.state.entries)
    .filter(([id, e]) => e.agent === name && !run.seen.has(id))
    .map(([id, e]) => ({ id, ...e }));
  const jsonByFile = new Map();
  for (const it of stale) {
    // A pinned item is the user's and stays as it is. A link entry only ever records such a pin (links.mjs handles
    // the links themselves), so one without a pin is only forgotten too.
    if (it.pinned || it.kind === 'link') {
      if (!run.dryRun) delete run.state.entries[it.id];
      if (it.pinned) run.note(`no longer shipped, left as it is: ${it.id}`);
    } else if (it.kind === 'file') removeFile(it, run);
    else if (it.kind === 'block') removeBlock(it, run);
    else if (it.kind === 'toml') applyCodexMcp({ file: it.file, servers: [{ id: it.id, name: it.name, value: undefined }] }, run);
    else jsonByFile.set(it.file, [...(jsonByFile.get(it.file) ?? []), it]);
  }
  for (const [file, items] of jsonByFile) removeJson(file, items, run);
}

function uninstallAgent(ctx, name, packs, run) {
  const plan = buildPlan(ctx, name, run.warn);
  // Our own links go, and dangling ones into the repo; a working link the user made to anything else in it stays.
  const keepOthers = (src) => (n, target) => existsSync(target) && !samePath(target, join(src, n));
  pruneLinks(ctx, plan.skills.global, keepOthers(globalSkills(ctx.repo).src), run);
  for (const set of packSkillSets(ctx.repo, packs)) pruneLinks(ctx, plan.skills.pack(packRoot(ctx, set)), keepOthers(set.src), run);
  pruneAgent(name, run);
}

export function runInstall(ctx, { agents, packs, dryRun = false, resolutions = {}, uninstall = false }) {
  for (const name of agents) {
    if (!ADAPTERS[name]) throw new Error(`unknown agent "${name}" — known: ${Object.keys(ADAPTERS).join(', ')}`);
  }
  checkRepo(ctx.repo);
  // Every agent is checked before the first one is applied, so a refusal leaves the machine as it was.
  for (const name of agents) refuseRepoTargets(ctx, name, packs);
  const state = loadState(ctx.local);
  const run = makeRun({ state, resolutions, dryRun });
  if (!uninstall) cleanHome(ctx, run);
  for (const name of agents) {
    run.agent = name;
    if (uninstall) uninstallAgent(ctx, name, packs, run);
    else {
      applyAgent(ctx, name, packs, run);
      pruneAgent(name, run);
    }
  }
  if (!dryRun) {
    state.agents = uninstall ? state.agents.filter((a) => !agents.includes(a)) : [...new Set([...state.agents, ...agents])].sort();
    if (!uninstall) state.packs = packs;
    saveState(ctx.local, state);
  }
  return run.report;
}
