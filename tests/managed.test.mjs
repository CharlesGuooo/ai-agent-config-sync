import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tempDir, newRun } from './helpers.mjs';
import { applyBlock, removeBlock, applyFile, removeFile, isV1Prompt, BEGIN, END } from '../lib/managed.mjs';

const read = (f) => readFileSync(f, 'utf8');

test('writes a block into a new file, then has nothing to do', () => {
  const file = join(tempDir(), 'CLAUDE.md');
  const run = newRun();
  applyBlock({ id: 'p', file, content: 'v1' }, run);
  assert.equal(read(file), `${BEGIN}\nv1\n${END}\n`);
  const again = newRun({ state: run.state });
  applyBlock({ id: 'p', file, content: 'v1' }, again);
  assert.deepEqual(again.report.changes, []);
});

test('keeps a user file below the block; replaces a v1 prompt whole', () => {
  const dir = tempDir();
  const mine = join(dir, 'mine.md');
  writeFileSync(mine, 'my notes\n');
  applyBlock({ id: 'a', file: mine, content: 'gen' }, newRun());
  assert.equal(read(mine), `${BEGIN}\ngen\n${END}\n\nmy notes\n`);
  const v1 = join(dir, 'v1.md');
  writeFileSync(v1, '# old\n<!-- SKILLS:BEGIN -->\nx\n<!-- SKILLS:END -->\n');
  applyBlock({ id: 'b', file: v1, content: 'gen' }, newRun());
  assert.equal(read(v1), `${BEGIN}\ngen\n${END}\n`);
});

test('follows the repo when untouched, keeps text outside, flags a hand edit', () => {
  const file = join(tempDir(), 'AGENTS.md');
  const run = newRun();
  applyBlock({ id: 'p', file, content: 'v1' }, run);
  writeFileSync(file, `${read(file)}\nlocal note\n`);
  applyBlock({ id: 'p', file, content: 'v2' }, newRun({ state: run.state }));
  assert.equal(read(file), `${BEGIN}\nv2\n${END}\n\nlocal note\n`);
  writeFileSync(file, read(file).replace('\nv2\n', '\nhand edit\n'));
  const conflicted = newRun({ state: run.state });
  applyBlock({ id: 'p', file, content: 'v3' }, conflicted);
  assert.deepEqual(conflicted.report.conflicts.map((c) => c.id), ['p']);
  assert.match(read(file), /hand edit/);
  applyBlock({ id: 'p', file, content: 'v3' }, newRun({ state: run.state, resolutions: { p: 'repo' } }));
  assert.equal(read(file), `${BEGIN}\nv3\n${END}\n\nlocal note\n`);
});

test('removeBlock keeps the rest and deletes a file left empty', () => {
  const dir = tempDir();
  const shared = join(dir, 'a.md');
  const run = newRun();
  applyBlock({ id: 'a', file: shared, content: 'gen' }, run);
  writeFileSync(shared, `${read(shared)}\nmine\n`);
  removeBlock({ id: 'a', file: shared }, run);
  assert.equal(read(shared), 'mine\n');
  const alone = join(dir, 'b.md');
  applyBlock({ id: 'b', file: alone, content: 'gen' }, run);
  removeBlock({ id: 'b', file: alone }, run);
  assert.ok(!existsSync(alone));
});

test('applyFile writes, accepts an identical file, conflicts on a different one; removeFile removes', () => {
  const dir = tempDir();
  const fresh = join(dir, 'x.md');
  const run = newRun();
  applyFile({ id: 'x', file: fresh, content: 'body\n' }, run);
  assert.equal(read(fresh), 'body\n');
  const same = join(dir, 'y.md');
  writeFileSync(same, 'body\r\n');
  const ok = newRun();
  applyFile({ id: 'y', file: same, content: 'body\n' }, ok);
  assert.deepEqual([ok.report.changes, ok.report.conflicts], [[], []]);
  const other = join(dir, 'z.md');
  writeFileSync(other, 'different\n');
  const bad = newRun();
  applyFile({ id: 'z', file: other, content: 'body\n' }, bad);
  assert.equal(bad.report.conflicts.length, 1);
  removeFile({ id: 'x', file: fresh }, run);
  assert.ok(!existsSync(fresh));
});

test('a CRLF file keeps its line endings and the text around the block; a second run has nothing to do', () => {
  const file = join(tempDir(), 'CLAUDE.md');
  const run = newRun();
  applyBlock({ id: 'p', file, content: 'v1' }, run);
  // A Windows editor saved the file with CRLF, and the user wrote above and below the block.
  writeFileSync(file, `top note\r\n\r\n${BEGIN}\r\nv1\r\n${END}\r\n\r\nbottom note\r\n`);
  applyBlock({ id: 'p', file, content: 'v2' }, newRun({ state: run.state }));
  const expected = `top note\r\n\r\n${BEGIN}\r\nv2\r\n${END}\r\n\r\nbottom note\r\n`;
  assert.equal(read(file), expected);
  const again = newRun({ state: run.state });
  applyBlock({ id: 'p', file, content: 'v2' }, again);
  assert.deepEqual([again.report.changes, again.report.conflicts], [[], []]);
  assert.equal(read(file), expected);
});

test('a user file saved with CRLF gets the block in CRLF, and removeBlock hands the text back unchanged', () => {
  const file = join(tempDir(), 'AGENTS.md');
  writeFileSync(file, 'my notes\r\nmore\r\n');
  const run = newRun();
  applyBlock({ id: 'p', file, content: 'gen\nsecond line' }, run);
  assert.equal(read(file), `${BEGIN}\r\ngen\r\nsecond line\r\n${END}\r\n\r\nmy notes\r\nmore\r\n`);
  const again = newRun({ state: run.state });
  applyBlock({ id: 'p', file, content: 'gen\nsecond line' }, again);
  assert.deepEqual(again.report.changes, []);
  removeBlock({ id: 'p', file }, newRun({ state: run.state }));
  assert.equal(read(file), 'my notes\r\nmore\r\n');
});

test('the block takes the file\'s line ending whatever line ending the content has', () => {
  const file = join(tempDir(), 'AGENTS.md');
  writeFileSync(file, 'notes\r\n');
  const run = newRun();
  // Ends with a newline, as a rendered prompt does.
  applyBlock({ id: 'p', file, content: 'a\r\nb\r\n' }, run);
  assert.equal(read(file), `${BEGIN}\r\na\r\nb\r\n\r\n${END}\r\n\r\nnotes\r\n`);
  const again = newRun({ state: run.state });
  applyBlock({ id: 'p', file, content: 'a\nb\n' }, again);
  assert.deepEqual([again.report.changes, again.report.conflicts], [[], []]);
});

test('a CRLF v1 prompt is still recognised and replaced whole, in CRLF', () => {
  const file = join(tempDir(), 'CLAUDE.md');
  writeFileSync(file, '# old\r\n<!-- SKILLS:BEGIN -->\r\nx\r\n<!-- SKILLS:END -->\r\n');
  applyBlock({ id: 'p', file, content: 'gen' }, newRun());
  assert.equal(read(file), `${BEGIN}\r\ngen\r\n${END}\r\n`);
});

test('isV1Prompt needs both v1 markers alone on their own lines, BEGIN first', () => {
  const v1 = '# old\n<!-- SKILLS:BEGIN -->\nx\n<!-- SKILLS:END -->\n';
  assert.ok(isV1Prompt(v1));
  assert.ok(isV1Prompt(v1.replace(/\n/g, '\r\n')));
  assert.ok(isV1Prompt('<!-- SKILLS:BEGIN -->\n<!-- SKILLS:END -->'));
  assert.ok(!isV1Prompt('The table sits between <!-- SKILLS:BEGIN --> and <!-- SKILLS:END --> in the old files.\n'));
  assert.ok(!isV1Prompt('`<!-- SKILLS:BEGIN -->`\nx\n`<!-- SKILLS:END -->`\n'));
  assert.ok(!isV1Prompt('<!-- SKILLS:BEGIN -->\nonly the start\n'));
  assert.ok(!isV1Prompt('<!-- SKILLS:END -->\nx\n<!-- SKILLS:BEGIN -->\n'));
});

test('a v1 prompt is replaced whole and reported as replace-v1; a file that only mentions the v1 markers keeps its text', () => {
  const dir = tempDir();
  const v1 = join(dir, 'v1.md');
  writeFileSync(v1, '# old\n<!-- SKILLS:BEGIN -->\nx\n<!-- SKILLS:END -->\n');
  const replaced = newRun();
  applyBlock({ id: 'a', file: v1, content: 'gen' }, replaced);
  assert.deepEqual(replaced.report.changes, [`replace-v1 ${v1}`]);
  assert.equal(read(v1), `${BEGIN}\ngen\n${END}\n`);
  const doc = join(dir, 'notes.md');
  const text = 'The v1 sync wrote a table between <!-- SKILLS:BEGIN --> and <!-- SKILLS:END --> in each prompt.\n';
  writeFileSync(doc, text);
  const kept = newRun();
  applyBlock({ id: 'b', file: doc, content: 'gen' }, kept);
  assert.equal(read(doc), `${BEGIN}\ngen\n${END}\n\n${text}`);
  assert.deepEqual(kept.report.changes, [`write ${doc}`]);
});

test('damaged markers are a conflict with a warning, with or without state, and the file stays as it is; resolving to the repo puts a fresh block on top and keeps the rest', () => {
  const damaged = {
    'END deleted': `${BEGIN}\nv1\n\nmy notes\n`,
    'BEGIN deleted': `v1\n${END}\n\nmy notes\n`,
    'END above BEGIN': `${END}\nv1\n${BEGIN}\n\nmy notes\n`,
  };
  for (const [what, text] of Object.entries(damaged)) {
    const file = join(tempDir(), 'CLAUDE.md');
    const run = newRun();
    applyBlock({ id: 'p', file, content: 'v1' }, run);
    writeFileSync(file, text);
    // After an earlier install, and on a machine that has no state at all.
    for (const state of [run.state, undefined]) {
      const conflicted = newRun({ state });
      applyBlock({ id: 'p', file, content: 'v2' }, conflicted);
      assert.deepEqual(conflicted.report.conflicts.map((c) => c.id), ['p'], what);
      assert.deepEqual(conflicted.report.warnings, [`managed markers damaged in ${file}; fix them by hand`], what);
      assert.equal(read(file), text, what);
    }
    applyBlock({ id: 'p', file, content: 'v2' }, newRun({ state: run.state, resolutions: { p: 'repo' } }));
    assert.ok(read(file).startsWith(`${BEGIN}\nv2\n${END}\n`), what);
    assert.match(read(file), /my notes/, what);
    const again = newRun({ state: run.state });
    applyBlock({ id: 'p', file, content: 'v2' }, again);
    assert.deepEqual([again.report.changes, again.report.conflicts, again.report.warnings], [[], [], []], what);
  }
});

test('removeBlock leaves a file whose block lost a marker alone, warns, and stops tracking it', () => {
  const file = join(tempDir(), 'CLAUDE.md');
  const run = newRun();
  applyBlock({ id: 'p', file, content: 'gen' }, run);
  writeFileSync(file, `${read(file).replace(`${END}\n`, '')}\nmy notes\n`);
  const damaged = read(file);
  const removal = newRun({ state: run.state });
  removeBlock({ id: 'p', file }, removal);
  assert.equal(read(file), damaged);
  assert.deepEqual([removal.report.changes, removal.report.conflicts], [[], []]);
  assert.deepEqual(removal.report.warnings, [`managed markers damaged in ${file}; fix them by hand`]);
  assert.ok(!('p' in run.state.entries));
});

test('a stray END or an orphan BEGIN above a valid block does not hide it; the block is updated and removed exactly', () => {
  const above = { 'stray END': `${END}\n\n`, 'orphan BEGIN': `${BEGIN}\nleft over\n\n` };
  for (const [what, top] of Object.entries(above)) {
    const file = join(tempDir(), 'CLAUDE.md');
    const run = newRun();
    applyBlock({ id: 'p', file, content: 'v1' }, run);
    writeFileSync(file, `${top}${read(file)}\nmy notes\n`);
    const update = newRun({ state: run.state });
    applyBlock({ id: 'p', file, content: 'v2' }, update);
    assert.equal(read(file), `${top}${BEGIN}\nv2\n${END}\n\nmy notes\n`, what);
    assert.deepEqual([update.report.conflicts, update.report.warnings], [[], []], what);
    const again = newRun({ state: run.state });
    applyBlock({ id: 'p', file, content: 'v2' }, again);
    assert.deepEqual([again.report.changes, again.report.conflicts, again.report.warnings], [[], [], []], what);
    removeBlock({ id: 'p', file }, newRun({ state: run.state }));
    assert.equal(read(file), `${top}my notes\n`, what);
  }
});

test('applyBlock refuses content that contains a managed marker, naming the block', () => {
  const file = join(tempDir(), 'AGENTS.md');
  for (const marker of [BEGIN, END]) {
    assert.throws(() => applyBlock({ id: 'claude:prompt', file, content: `text\n${marker}\nmore` }, newRun()), (e) => e.message.includes('claude:prompt'));
  }
  assert.ok(!existsSync(file));
});

test('removeBlock right after applyBlock gives back the original bytes, blank lines and all', () => {
  const originals = ['my notes\n', '\n\nfoo\n', 'no newline at the end', 'a\n\n\nb\n', 'my notes\r\nmore\r\n', '\r\n\r\nfoo\r\n'];
  for (const original of originals) {
    const file = join(tempDir(), 'AGENTS.md');
    writeFileSync(file, original);
    const run = newRun();
    applyBlock({ id: 'p', file, content: 'gen' }, run);
    removeBlock({ id: 'p', file }, newRun({ state: run.state }));
    assert.equal(read(file), original, JSON.stringify(original));
  }
});

test('removing a block or a file that was edited by hand is a conflict and leaves it alone', () => {
  const dir = tempDir();
  const run = newRun();
  const blockFile = join(dir, 'a.md');
  applyBlock({ id: 'a', file: blockFile, content: 'v1' }, run);
  writeFileSync(blockFile, read(blockFile).replace('\nv1\n', '\nhand edit\n'));
  const editedBlock = read(blockFile);
  const blockRemoval = newRun({ state: run.state });
  removeBlock({ id: 'a', file: blockFile }, blockRemoval);
  assert.deepEqual(blockRemoval.report.conflicts.map((c) => c.id), ['a']);
  assert.equal(read(blockFile), editedBlock);
  const cmdFile = join(dir, 'cmd.md');
  applyFile({ id: 'c', file: cmdFile, content: 'body\n' }, run);
  writeFileSync(cmdFile, 'my version\n');
  const fileRemoval = newRun({ state: run.state });
  removeFile({ id: 'c', file: cmdFile }, fileRemoval);
  assert.deepEqual(fileRemoval.report.conflicts.map((c) => c.id), ['c']);
  assert.equal(read(cmdFile), 'my version\n');
  assert.ok('a' in run.state.entries && 'c' in run.state.entries);
});

test('a file that is not UTF-8 stops the run and is left as it was', () => {
  const file = join(tempDir(), 'AGENTS.md');
  // "hi" as UTF-16LE with a byte order mark, the way Windows PowerShell 5.1 writes a file.
  const utf16 = Buffer.from([0xff, 0xfe, 0x68, 0x00, 0x69, 0x00]);
  writeFileSync(file, utf16);
  const names = (e) => e.message.includes(file);
  assert.throws(() => applyBlock({ id: 'p', file, content: 'x' }, newRun()), names);
  assert.throws(() => removeBlock({ id: 'p', file }, newRun()), names);
  assert.throws(() => applyFile({ id: 'p', file, content: 'x' }, newRun()), names);
  assert.throws(() => removeFile({ id: 'p', file }, newRun()), names);
  assert.ok(readFileSync(file).equals(utf16));
});

test('a dry run reports what a real run then does, and changes neither the files nor the state', () => {
  const dir = tempDir();
  const at = (name) => join(dir, name);
  const setup = newRun();
  applyBlock({ id: 'upd', file: at('upd.md'), content: 'v1' }, setup);
  applyBlock({ id: 'alone', file: at('alone.md'), content: 'v1' }, setup);
  applyBlock({ id: 'shared', file: at('shared.md'), content: 'v1' }, setup);
  writeFileSync(at('shared.md'), `${read(at('shared.md'))}\nmine\n`);
  applyFile({ id: 'cmd', file: at('cmd.md'), content: 'body\n' }, setup);
  applyFile({ id: 'gone', file: at('gone.md'), content: 'body\n' }, setup);
  writeFileSync(at('mine.md'), 'my notes\r\n');
  writeFileSync(at('v1.md'), '# old\n<!-- SKILLS:BEGIN -->\nx\n<!-- SKILLS:END -->\n');
  const ops = (r) => {
    applyBlock({ id: 'new', file: at('new.md'), content: 'x' }, r);
    applyBlock({ id: 'upd', file: at('upd.md'), content: 'v2' }, r);
    applyBlock({ id: 'mine', file: at('mine.md'), content: 'x' }, r);
    applyBlock({ id: 'v1', file: at('v1.md'), content: 'x' }, r);
    removeBlock({ id: 'alone', file: at('alone.md') }, r);
    removeBlock({ id: 'shared', file: at('shared.md') }, r);
    applyFile({ id: 'cmd', file: at('cmd.md'), content: 'body2\n' }, r);
    applyFile({ id: 'fresh', file: at('fresh.md'), content: 'x\n' }, r);
    removeFile({ id: 'gone', file: at('gone.md') }, r);
  };
  const snapshot = () => readdirSync(dir).sort().map((name) => [name, read(at(name))]);
  const filesBefore = snapshot();
  const stateBefore = structuredClone(setup.state);
  const dry = newRun({ state: setup.state, dryRun: true });
  ops(dry);
  assert.deepEqual(snapshot(), filesBefore);
  assert.deepEqual(setup.state, stateBefore);
  assert.equal(dry.report.changes.length, 9);
  const real = newRun({ state: setup.state });
  ops(real);
  assert.deepEqual(real.report.changes, dry.report.changes);
  assert.notDeepEqual(snapshot(), filesBefore);
});
