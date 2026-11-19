import test from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// The guard reads a tool call as JSON on stdin and exits 2 to block it. These commands are only ever fed to it as
// data; nothing here runs them.
const guard = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'hooks', 'guard.mjs');
const env = { ...process.env, HOME: '/home/tester', USERPROFILE: 'C:\\Users\\tester' };
const exitFor = (command) => spawnSync(process.execPath, [guard], {
  input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }), env, encoding: 'utf8',
}).status;

test('a recursive force-delete of a concrete deeper path is allowed', () => {
  for (const command of [
    'rm -rf /tmp/build-123/out',
    'rm -rf /tmp/build-123',
    'rm -rf /d/Projects2/foo/node_modules',
    'rm -rf "C:/Users/PC/AppData/Local/Temp/x/y"',
    'rm -rf "D:/My Projects/foo/bar"',
    'rm -rf ./dist',
    'rm -rf dist build',
    'rm -rf ../sibling-build',
    'rm -rf ~/projects/scratch',
    'rm -rf /home/tester/projects/scratch',
    'rm -rf /tmp/build-123/*',
  ]) assert.equal(exitFor(command), 0, command);
});

test('a recursive force-delete of root, a drive, home, the current directory or a bare glob is blocked', () => {
  for (const command of [
    'rm -rf /',
    'rm -rf /*',
    'rm -fr /',
    'rm -Rf /',
    'rm -r -f /',
    'sudo rm -rf /',
    'cd /tmp && rm -rf /',
    'rm -rf -- /',
    'rm -rf /tmp',
    'rm -rf /tmp/*',
    'rm -rf /d',
    'rm -rf /c/',
    'rm -rf /d/*',
    'rm -rf C:/',
    'rm -rf C:\\',
    'rm -rf "C:"',
    'rm -rf /usr/lib',
    'rm -rf /c/Users',
    'rm -rf /home/tester',
    'rm -rf /home/tester/Documents',
    'rm -rf C:\\Users\\tester',
    'rm -rf ~',
    'rm -rf ~/',
    'rm -rf ~/*',
    'rm -rf ~/Documents',
    'rm -rf ~/projects/..',
    'rm -rf $HOME',
    'rm -rf "$HOME"',
    'rm -rf ${HOME}/Documents',
    'rm -rf .',
    'rm -rf ./',
    'rm -rf ..',
    'rm -rf *',
    'rm -rf ./*',
    'rm -rf /tmp/build-123/out /',
  ]) assert.equal(exitFor(command), 2, command);
});

test('commands that only look like a delete are allowed', () => {
  for (const command of ['rm -r /tmp/x', 'git rm -rf --cached src/old', 'rm -f /tmp/one-file', 'echo rm', 'npm run rm -- --rf']) {
    assert.equal(exitFor(command), 0, command);
  }
});
