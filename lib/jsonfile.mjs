// Repo-owned entries in JSON config files that the agent itself also writes.
// An entry is one key path (["mcpServers", "github"]); a hook is a group in
// hooks.<Event>, found by the command it runs. Everything else is left alone.
import { readText, writeText, parseJson, hashValue, getPath, setPath, deletePath, isObj } from './util.mjs';

// Parsed here rather than by readJson so the file's line ending can be kept: a CRLF file is written back in CRLF (a new
// file in LF). A missing or blank file is an empty config.
function load(file) {
  const text = readText(file);
  const eol = text !== null && text.includes('\r\n') ? '\r\n' : '\n';
  if (text === null || text.trim() === '') return { obj: {}, eol };
  return { obj: parseJson(text, file), eol };
}

// JSON.stringify escapes the newlines inside strings, so every raw newline in its output is layout.
const save = (file, obj, eol) => writeText(file, JSON.stringify(obj, null, 2).replace(/\n/g, eol) + eol);

// A write would replace a container that holds something other than an object (an event: an array), so it is refused
// up front, before anything is recorded. Removal replaces nothing and does not check.
function checkShapes(file, obj, entries, hooks) {
  // Set on an array or a primitive, entries would be dropped by JSON.stringify while the state says they were written.
  if (!isObj(obj)) throw new Error(`${file}: the top level is not an object`);
  const need = (path, what, is) => {
    const v = getPath(obj, path);
    if (v !== undefined && !is(v)) throw new Error(`${file}: ${path.join('.')} is not ${what}`);
  };
  for (const e of entries) {
    if (e.skip) continue;
    for (let i = 1; i < e.path.length; i++) need(e.path.slice(0, i), 'an object', isObj);
  }
  for (const h of hooks) {
    need(['hooks'], 'an object', isObj);
    need(['hooks', h.event], 'an array', Array.isArray);
  }
}

const group = (h) => ({ matcher: h.matcher, hooks: [{ type: 'command', command: h.command }] });

// The command the repo writes for a hook is node "<absolute path>/scripts/hooks/<name>.mjs", and that tail names the same
// hook whichever clone runs it. Only a whole command of this shape counts, so the machine's own commands (another
// interpreter, arguments, a path built from a variable) are never taken for ours.
const HOOK_COMMAND = /^node "(?:[A-Za-z]:)?[\\/](?:[^"]*[\\/])?(scripts[\\/]hooks[\\/][^\\/"]+\.mjs)"$/;
const scriptOf = (command) => HOOK_COMMAND.exec(command ?? '')?.[1].replace(/\\/g, '/');

const runs = (g, test) => (g.hooks ?? []).some((x) => test(x.command));

// A group is ours when it runs a command we know: the current one, or the one written last time. A repo that was moved
// or cloned again with its state lost has neither, so failing that the event's one group running the same script from
// another clone counts (with two or more it would be a guess), and `stale` is the command it runs. Removal passes no script.
function findGroup(obj, event, commands, script) {
  const groups = isObj(obj.hooks) && Array.isArray(obj.hooks[event]) ? obj.hooks[event] : [];
  let index = groups.findIndex((g) => runs(g, (c) => commands.includes(c)));
  let stale;
  if (index === -1 && script) {
    const same = groups.filter((g) => runs(g, (c) => scriptOf(c) === script));
    if (same.length === 1) {
      index = groups.indexOf(same[0]);
      stale = same[0].hooks.find((x) => scriptOf(x.command) === script).command;
    }
  }
  return { groups, index, stale };
}

// entries: [{ id, path, value }] or [{ id, skip: true }]; hooks: [{ id, event, matcher, command }].
export function applyJson({ file, entries = [], hooks = [] }, run) {
  const { obj, eol } = load(file);
  checkShapes(file, obj, entries, hooks);
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
    const { groups, index, stale } = findGroup(obj, h.event, [h.command, last].filter(Boolean), scriptOf(h.command));
    const meta = { kind: 'hook', file, event: h.event, command: h.command };
    // A group taken over from another clone says which command it runs, so it is clear what resolving to the repo replaces.
    const label = `hook ${h.event} ${h.command} in ${file}${stale ? ` (in place of ${stale})` : ''}`;
    if (run.step(h.id, meta, index === -1 ? null : hashValue(groups[index]), hashValue(group(h)), label)) {
      if (!isObj(obj.hooks)) obj.hooks = {};
      obj.hooks[h.event] = groups;
      if (index === -1) groups.push(group(h));
      else groups[index] = group(h);
      dirty = true;
    }
  }
  if (dirty && !run.dryRun) save(file, obj, eol);
}

// Removes entries and hooks written earlier; items are state entries with their id.
export function removeJson(file, items, run) {
  const { obj, eol } = load(file);
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
  if (dirty && !run.dryRun) save(file, obj, eol);
}
