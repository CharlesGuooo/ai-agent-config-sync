// One install/update pass: the machine state, the resolutions given on the
// command line, and the report. step() applies decide() to one managed item and
// records the outcome in the state.
import { decide } from './decide.mjs';

export function makeRun({ state, resolutions = {}, dryRun = false }) {
  const report = { changes: [], conflicts: [], warnings: [], notes: [] };
  const run = {
    state,
    report,
    dryRun,
    agent: null,
    seen: new Set(),
    resolution: (id) => resolutions[id] ?? resolutions.all,
    change: (msg) => report.changes.push(msg),
    warn: (msg) => report.warnings.push(msg),
    note: (msg) => report.notes.push(msg),
    conflict: (id, msg) => report.conflicts.push({ id, msg }),
    // True when the caller should write `desired` (or remove, when desired is null).
    step(id, meta, current, desired, label) {
      run.seen.add(id);
      const entry = state.entries[id];
      const resolution = run.resolution(id);
      const verdict = decide({ current, desired, last: entry?.hash ?? null, written: Boolean(entry), pinned: Boolean(entry?.pinned), resolution });
      if (verdict === 'conflict') {
        run.conflict(id, label);
        return false;
      }
      if (verdict === 'skip') {
        if (resolution === 'keep' && !entry?.pinned) {
          state.entries[id] = { agent: run.agent, ...meta, hash: entry?.hash ?? null, pinned: true };
          run.note(`kept this machine's version and stopped managing it: ${id}`);
        }
        return false;
      }
      if (desired === null) delete state.entries[id];
      else state.entries[id] = { agent: run.agent, ...meta, hash: desired };
      if (verdict === 'ok') return false;
      run.change(label);
      return true;
    },
  };
  return run;
}
