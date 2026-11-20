// Every agent the harness can configure, by name.
import claude from './claude.mjs';
import codex from './codex.mjs';
import cursor from './cursor.mjs';
import opencode from './opencode.mjs';
import pi from './pi.mjs';

export const ADAPTERS = { claude, codex, cursor, opencode, pi };
