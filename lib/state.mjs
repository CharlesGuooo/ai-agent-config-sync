// Per-machine install state: which agents and packs are installed and what was
// last written for every managed item. Lives in <local>, never committed.
import { join } from 'node:path';
import { readJson, writeJson } from './util.mjs';

export function loadState(local) {
  const state = readJson(join(local, 'state.json')) ?? { version: 1, agents: [], packs: [], entries: {} };
  // Project links added with `add`, by project path.
  state.projects ??= {};
  return state;
}

export function saveState(local, state) {
  writeJson(join(local, 'state.json'), state);
}
