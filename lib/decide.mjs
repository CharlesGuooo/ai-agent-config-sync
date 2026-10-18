// The one rule every managed item follows. current = what the machine has now,
// desired = what the repo wants, last = what this installer wrote the previous
// time (written = there was a previous time). Values are hashes; null = absent.
// Returns 'ok' (nothing to do), 'write', 'skip' (pinned or kept) or 'conflict'.
export function decide({ current, desired, last, written, pinned, resolution }) {
  if (resolution === 'repo') return current === desired ? 'ok' : 'write';
  if (pinned) return 'skip';
  if (current === desired) return 'ok';
  if (resolution === 'keep') return 'skip';
  if (!written) return current === null ? 'write' : 'conflict';
  return current === last ? 'write' : 'conflict';
}
