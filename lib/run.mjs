// One install/update pass: the machine state, the resolutions given on the
// command line, and the report. step() applies decide() to one managed item and
// records the outcome in the state. A dry run reports the same things but never
// changes the state.
import { decide } from './decide.mjs';

export function makeRun({ state, resolutions = {}, dryRun = false }) {
  const report = { changes: [], conflicts: [], warnings: [], notes: [] };
  const run = {
    state,
    report,
    dryRun,
    agent: null,
    seen: new Set(),
    // For an item the caller already knows is a conflict (links.mjs asks only after it finds a real
    // directory that differs from the repo's copy). step() applies the same rule on its own.
    resolution: (id) => resolutions[id] ?? resolutions.all,
    change: (msg) => report.changes.push(msg),
    warn: (msg) => report.warnings.push(msg),
    note: (msg) => report.notes.push(msg),
    conflict: (id, msg) => report.conflicts.push({ id, msg }),
    // True when the caller should write `desired` (or remove, when desired is null).
    step(id, meta, current, desired, label) {
      run.seen.add(id);
      const entry = state.entries[id];
      const facts = { current, desired, last: entry?.hash ?? null, written: Boolean(entry), pinned: Boolean(entry?.pinned) };
      // A choice for this id always applies. "all" only settles what would otherwise be a conflict:
      // it must not freeze a plain repo update, and it must not lift a pin the user chose earlier.
      let resolution = resolutions[id];
      let verdict = decide({ ...facts, resolution });
      if (verdict === 'conflict' && resolutions.all) {
        resolution = resolutions.all;
        verdict = decide({ ...facts, resolution });
      }
      if (verdict === 'conflict') {
        run.conflict(id, label);
        return false;
      }
      if (verdict === 'skip') {
        if (resolution === 'keep' && !entry?.pinned) {
          // The entry keeps its identity: a hook is found again by the command recorded here.
          if (!run.dryRun) state.entries[id] = entry ? { ...entry, pinned: true } : { agent: run.agent, ...meta, hash: null, pinned: true };
          run.note(`kept this machine's version and stopped managing it: ${id}`);
        }
        return false;
      }
      if (!run.dryRun) {
        if (desired === null) delete state.entries[id];
        else state.entries[id] = { agent: run.agent, ...meta, hash: desired };
      }
      if (verdict === 'ok') return false;
      run.change(label);
      return true;
    },
  };
  return run;
}
