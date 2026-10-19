// Applies agents' plans: skill links, instruction blocks, managed files, JSON and
// TOML entries, the v1 cleanup, and removal of whatever the repo stopped shipping.
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { readText, writeText } from './util.mjs';
import { samePath, resolvesInto } from './platform.mjs';
import { loadState, saveState } from './state.mjs';
import { makeRun } from './run.mjs';
import { PACKS, globalSkills, packSkillSets } from './skills.mjs';
import { syncLinks, pruneLinks } from './links.mjs';
import { applyBlock, removeBlock, applyFile, removeFile } from './managed.mjs';
import { applyJson, removeJson } from './jsonfile.mjs';
import { applyCodexMcp } from './toml.mjs';
import { loadCatalog, catalogProblems, serversFor, mcpSection } from './mcp.mjs';
import { renderPrompt, catalogErrors } from './prompt.mjs';
import { cleanHome, cleanAgent, cleanSkillDir, cleanHooksDir } from './legacy.mjs';
import claude from './agents/claude.mjs';
import codex from './agents/codex.mjs';
import cursor from './agents/cursor.mjs';
import opencode from './agents/opencode.mjs';
import pi from './agents/pi.mjs';

export const ADAPTERS = { claude, codex, cursor, opencode, pi };

// Codex runs a new or changed hook only after the user has trusted it inside Codex.
const CODEX_TRUST = 'Codex: open Codex and trust the updated hooks (until then they do not run)';

// Selected or not: the links of a pack dropped from the selection are still ours to remove.
const ALL_PACKS = Object.keys(PACKS);

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

// The file is ours to remove; what was pasted from it stays in Cursor until the user takes it out.
function removeManual(file, run) {
  if (!existsSync(file)) return;
  run.change(`remove ${file}`);
  run.note('remove the pasted harness rules from Cursor Settings → Rules → User Rules');
  if (!run.dryRun) unlinkSync(file);
}

// For pruning a set's folder: our own links go, and dangling ones into the repo; a working link the user made to
// anything else in the repo stays.
const keepOthers = (src) => (name, target) => existsSync(target) && !samePath(target, join(src, name));

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

// A folder link made by hand on the way to any place the run touches (say ~/.claude pointing into the repo) would put
// the agent's files in the repo's working tree. A pack that is not selected is only pruned, so its skills folder
// counts only where it exists. Cursor's rules to paste go to <local>, which sits in the repo on purpose.
function refuseRepoTargets(ctx, name, packs) {
  const plan = buildPlan(ctx, name);
  const folders = (keys) => packSkillSets(ctx.repo, keys).map((set) => plan.skills.pack(packRoot(ctx, set)));
  const paths = [
    plan.skills.global,
    ...folders(packs),
    ...folders(ALL_PACKS.filter((p) => !packs.includes(p))).filter((p) => existsSync(p)),
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
  for (const set of packSkillSets(ctx.repo, ALL_PACKS.filter((p) => !packs.includes(p)))) {
    pruneLinks(ctx, plan.skills.pack(packRoot(ctx, set)), keepOthers(set.src), run);
  }
  if (plan.prompt.manual) writeManual(plan.prompt.manual, plan.prompt.text, run);
  else applyBlock({ id: plan.prompt.id, file: plan.prompt.file, content: plan.prompt.text }, run);
  // Before this run's writes, so the v1 rules see the same state in a dry run as in a real one and can never take
  // out an entry this run has just written.
  // A server v2 writes into Cursor's mcp.json is the conflict rule's to decide, so the v1 Cursor rule never sees its name.
  const managed = name === 'cursor' ? plan.json.flatMap((j) => j.entries ?? []).map((e) => e.path?.[1]) : [];
  cleanAgent(ctx, name, plan.catalogNames.filter((n) => !managed.includes(n)), run);
  for (const f of plan.files) applyFile(f, run);
  for (const j of plan.json) {
    const before = run.report.changes.length;
    applyJson(j, run);
    // Codex's hooks.json item carries only hooks, so any change while applying it is a hook written.
    if (name === 'codex' && j.hooks?.length && run.report.changes.length > before && !run.report.notes.includes(CODEX_TRUST)) run.note(CODEX_TRUST);
  }
  for (const t of plan.toml) applyCodexMcp(t, run);
}

// Removes what this agent had installed that the run did not touch (the repo
// stopped shipping it, or the agent is being uninstalled).
function pruneAgent(name, run, uninstalling = false) {
  const stale = Object.entries(run.state.entries)
    .filter(([id, e]) => e.agent === name && !run.seen.has(id))
    .map(([id, e]) => ({ id, ...e }));
  const jsonByFile = new Map();
  for (const it of stale) {
    // A pinned item is the user's and stays as it is. A link entry only ever records such a pin (links.mjs handles
    // the links themselves), so one without a pin is only forgotten too.
    if (it.pinned || it.kind === 'link') {
      if (!run.dryRun) delete run.state.entries[it.id];
      if (it.pinned) run.note(uninstalling ? `uninstalled; left as it is (kept on this machine): ${it.id}` : `no longer shipped, left as it is: ${it.id}`);
    } else if (it.kind === 'file') removeFile(it, run);
    else if (it.kind === 'block') removeBlock(it, run);
    else if (it.kind === 'toml') applyCodexMcp({ file: it.file, servers: [{ id: it.id, name: it.name, value: undefined }] }, run);
    else jsonByFile.set(it.file, [...(jsonByFile.get(it.file) ?? []), it]);
  }
  for (const [file, items] of jsonByFile) removeJson(file, items, run);
}

function uninstallAgent(ctx, name, run) {
  // Only paths are taken from the plan, so its warnings would say nothing about this run.
  const plan = buildPlan(ctx, name);
  pruneLinks(ctx, plan.skills.global, keepOthers(globalSkills(ctx.repo).src), run);
  for (const set of packSkillSets(ctx.repo, ALL_PACKS)) pruneLinks(ctx, plan.skills.pack(packRoot(ctx, set)), keepOthers(set.src), run);
  if (plan.prompt.manual) removeManual(plan.prompt.manual, run);
  pruneAgent(name, run, true);
  // Whatever was kept (an edit met here, or an earlier pin) is the machine's now, so the agent leaves nothing behind in the state.
  if (!run.dryRun) {
    for (const [id, e] of Object.entries(run.state.entries)) if (e.agent === name) delete run.state.entries[id];
  }
}

export function runInstall(ctx, { agents, packs, dryRun = false, resolutions = {}, uninstall = false }) {
  if (!agents.length) throw new Error(`no agents given — known: ${Object.keys(ADAPTERS).join(', ')}`);
  for (const name of agents) {
    if (!ADAPTERS[name]) throw new Error(`unknown agent "${name}" — known: ${Object.keys(ADAPTERS).join(', ')}`);
  }
  for (const key of packs) {
    if (!PACKS[key]) throw new Error(`unknown pack "${key}" — known: ${ALL_PACKS.join(', ')}`);
  }
  checkRepo(ctx.repo);
  // Every agent is checked before the first one is applied, so a refusal leaves the machine as it was.
  for (const name of agents) refuseRepoTargets(ctx, name, packs);
  const state = loadState(ctx.local);
  // An uninstall has to finish: once the agent is gone from the state, `resolve` could not reach a conflict met here,
  // so an item edited on this machine is kept as it is (and noted) unless the command line says otherwise.
  const run = makeRun({ state, resolutions: uninstall ? { all: 'keep', ...resolutions } : resolutions, dryRun });
  // The machine keeps one pack selection, which this run saves; agents installed earlier get it on their next update.
  const others = state.agents.filter((a) => !agents.includes(a));
  if (!uninstall && others.length && [...packs].sort().join() !== [...state.packs].sort().join()) {
    run.note(`the pack selection applies to every installed agent: run \`node harness.mjs update\` to apply it to ${others.join(', ')}`);
  }
  if (!uninstall) cleanHome(ctx, run);
  for (const name of agents) {
    run.agent = name;
    if (uninstall) uninstallAgent(ctx, name, run);
    else {
      applyAgent(ctx, name, packs, run);
      pruneAgent(name, run);
    }
  }
  if (!uninstall) cleanHooksDir(ctx, agents, run);
  // Saved only once the whole run has succeeded: an item is recorded before it is written, so the state of a run that
  // failed partway would claim writes and removals that never happened.
  if (!dryRun) {
    state.agents = uninstall ? state.agents.filter((a) => !agents.includes(a)) : [...new Set([...state.agents, ...agents])].sort();
    if (!uninstall) state.packs = packs;
    saveState(ctx.local, state);
  }
  return run.report;
}
