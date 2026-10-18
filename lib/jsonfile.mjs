// Repo-owned entries in JSON config files that the agent itself also writes.
// An entry is one key path (["mcpServers", "github"]); a hook is a group in
// hooks.<Event>, found by the command it runs. Everything else is left alone.
import { readText, readJson, writeJson, hashValue, getPath, setPath, deletePath, isObj } from './util.mjs';

// A missing or blank file is an empty config. Anything else must parse, and readJson names the file when it does not.
function load(file) {
  const text = readText(file);
  return text === null || text.trim() === '' ? {} : readJson(file);
}

const group = (h) => ({ matcher: h.matcher, hooks: [{ type: 'command', command: h.command }] });

function findGroup(obj, event, commands) {
  const groups = isObj(obj.hooks) && Array.isArray(obj.hooks[event]) ? obj.hooks[event] : [];
  return { groups, index: groups.findIndex((g) => (g.hooks ?? []).some((x) => commands.includes(x.command))) };
}

// entries: [{ id, path, value }] or [{ id, skip: true }]; hooks: [{ id, event, matcher, command }].
export function applyJson({ file, entries = [], hooks = [] }, run) {
  const obj = load(file);
  let dirty = false;
  for (const e of entries) {
    if (e.skip) {
      run.seen.add(e.id);
      continue;
    }
    if (run.step(e.id, { kind: 'json', file, path: e.path }, hashValue(getPath(obj, e.path)), hashValue(e.value), `set ${e.path.join('.')} in ${file}`)) {
      setPath(obj, e.path, e.value);
      dirty = true;
    }
  }
  for (const h of hooks) {
    // The command we wrote last time finds our group even after the repo moved.
    const last = run.state.entries[h.id]?.command;
    const { groups, index } = findGroup(obj, h.event, [h.command, last].filter(Boolean));
    const meta = { kind: 'hook', file, event: h.event, command: h.command };
    if (run.step(h.id, meta, index === -1 ? null : hashValue(groups[index]), hashValue(group(h)), `hook ${h.event} ${h.command} in ${file}`)) {
      if (!isObj(obj.hooks)) obj.hooks = {};
      obj.hooks[h.event] = groups;
      if (index === -1) groups.push(group(h));
      else groups[index] = group(h);
      dirty = true;
    }
  }
  if (dirty && !run.dryRun) writeJson(file, obj);
}

// Removes entries and hooks written earlier; items are state entries with their id.
export function removeJson(file, items, run) {
  const obj = load(file);
  let dirty = false;
  for (const it of items) {
    if (it.kind === 'json') {
      if (run.step(it.id, { kind: 'json', file, path: it.path }, hashValue(getPath(obj, it.path)), null, `remove ${it.path.join('.')} from ${file}`)) {
        deletePath(obj, it.path);
        dirty = true;
      }
      continue;
    }
    const { groups, index } = findGroup(obj, it.event, [it.command]);
    const meta = { kind: 'hook', file, event: it.event, command: it.command };
    if (run.step(it.id, meta, index === -1 ? null : hashValue(groups[index]), null, `remove-hook ${it.event} ${it.command} from ${file}`) && index !== -1) {
      groups.splice(index, 1);
      dirty = true;
    }
  }
  if (dirty && !run.dryRun) writeJson(file, obj);
}
