# skill-find 与按项目装技能 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户在真实项目里用 `skill-find` 找到 pack 技能、用 `node harness.mjs add/remove` 把它们链接进项目；全局技能精简为 14 个自动 + 6 个点名，描述压缩并由 `check` 守住总量。

**Architecture:** 新模块 `lib/projects.mjs` 负责项目里的链接、本机状态 `projects` 字段和 `.git/info/exclude` 受管块；`runInstall` 在 update / uninstall 末尾调用它。全局技能的移动、点名、描述预算都落在现有的 catalog / `lib/skillspec.mjs` / `lib/prompt.mjs` 上。触发测试用一个零依赖的 Node 脚本直接测本机已安装的技能。

**Tech Stack:** Node 20+ ESM，`node:test`，零第三方依赖；git CLI（只读查询 + 写 `info/exclude`）；`claude -p`（只在触发测试里用）。

**Spec:** `docs/skill-find.md`（2026-11-19 批准）。本计划实现其 F 节第 2–6 步；第 1 步已完成。

## Global Constraints

- 零第三方依赖；Windows / macOS / Linux 共用；目录链接一律用 `makeDirLink`（Windows junction，其他系统符号链接）。
- **在主 checkout 里、`skill-find` 分支上做**（`git switch -c skill-find`），不要用 worktree：安装器拒绝在 worktree 里运行，触发测试也要测本机通过链接读到的技能。每个改了 `skills/` 或 `prompt/` 的任务结束时跑 `node harness.mjs update`，让本机和 repo 一致。
- `add` 只往项目里写两样东西：技能链接，和 `.git/info/exclude` 里的受管块。**不替换、不删除**项目里的真实目录、文件、指向 repo 以外的链接——即使内容和 repo 一模一样。
- vendored 技能（`skills/sources.json` 里有条目的）只改 frontmatter：`description`、`disable-model-invocation`、`metadata.source`；正文不改。
- 测试：`node --test tests/*.test.mjs` 全过；`node harness.mjs check` 输出 `repo is consistent`。
- 报错只打印消息（沿用 `harness.mjs` 的 `error: <message>`）。
- 提交信息用现有风格（`feat(...)` / `fix(...)` / `docs(...)`），结尾 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。不 push；最后合并进 master 要用户同意。
- **与 spec E 的一处偏离（已在 spec 里同步）**：触发测试不用 skill-creator 的 `run_eval.py`，改用 `evals/triggers/run.mjs` 直接测已安装的真技能。理由：`run_eval.py` 在 Windows 上因 `select` 报错，而且它的临时副本会和同名真技能抢触发；直接测真技能这两个问题都不存在，邻近技能的竞争也更真实。

## Review Focus

1. **项目里已经有同名的真实目录或外来链接**（如 `D:/Research/Thesis/.claude/skills/*`）：必须原样保留并警告，不记进状态，不写进 exclude。测试在 Task 1。
2. **项目路径带空格、中文或 `[ ]`，或项目是某个 git 仓库的子目录**：链接要建对，exclude 里的路径要相对于仓库根、并转义 gitignore 通配符，`git status` 里看不到这些链接。测试在 Task 1。
3. **项目目录后来被删了**：`update` / `doctor` 只警告不中断，`remove all <已删的目录>` 能清掉状态。测试在 Task 2。
4. **把 home、home 下的 pack 目录（`~/dev-project` 等）或 repo 内的目录当项目**：会和全局 / pack 的链接管理打架，或把链接写进 repo 工作树，必须拒绝。测试在 Task 1。
5. **已加进项目的技能后来在 repo 里换了位置、被删、或变成全局技能**（Task 5 本身就会移动技能）：`update` 改指新位置，或删掉链接并说明原因。测试在 Task 2。

---

### Task 1: `lib/projects.mjs` — 项目链接、状态、git exclude

**Files:**
- Create: `lib/agents/index.mjs`, `lib/projects.mjs`, `tests/projects.test.mjs`
- Modify: `lib/engine.mjs`（`ADAPTERS` 改为从 `./agents/index.mjs` 导入并原样 re-export）、`lib/state.mjs`（`loadState` 补默认 `projects: {}`）、`lib/platform.mjs`（导出现有的 `abs`）

**Interfaces:**
- Consumes: `makeDirLink`, `removeLink`, `isLink`, `linkTarget`, `samePath`, `inside`, `resolvesInto`（`lib/platform.mjs`）；`globalSkills`, `packSkillSets`, `PACKS`（`lib/skills.mjs`）；`makeRun`（`lib/run.mjs`）；`loadState`, `saveState`。
- Produces:
  - `lib/agents/index.mjs`: `export const ADAPTERS = { claude, codex, cursor, opencode, pi }`。
  - `lib/platform.mjs`: `export function abs(p: string): string`（现有函数，只加 export）。
  - state: `state.projects: { [absProjectPath: string]: string[] }`，名字排序、去重；数组空了就删掉该键。
  - `skillIndex(repo): Map<string, { dir: string, global: boolean }>` — `skills/global` 和**全部 10 个** pack 里的每个技能。
  - `projectKey(state, project): string` — 状态里与 `project` `samePath` 的已有键，否则 `abs(project)`。
  - `excludeText(text: string | null, lines: string[]): string | null` — `info/exclude` 的新内容：受管块换成 `lines`（`lines` 空则去掉块）；块外文本原样保留；原文件不存在且 `lines` 空时返回 `null`。
  - `syncProject(ctx, { project, names, previous, agents, removeAgents = [] }, run): string[]` — 见 Step 3。
  - `addSkills(ctx, { project, names, dryRun = false }): report`
  - `removeSkills(ctx, { project, names /* string[] | 'all' */, dryRun = false }): report`
  - `report` 即 `makeRun().report`（`{ changes, conflicts, warnings, notes }`），CLI 的 `printReport` 直接可用。

- [ ] **Step 1: 写失败的测试 `tests/projects.test.mjs`**

公共准备：`fixtureRepo()` + 临时 home + 临时 project；直接写 `<repo>/.local/state.json` = `{ version: 1, agents: ['claude', 'pi'], packs: ['dev'], entries: {} }`。fixture 里 `gamma` 在 `dev-project/skills`，`delta` 在 `dev-project/frontend/skills`，`alpha` 是全局技能。`L(agent, name)` = `join(project, agent === 'claude' ? '.claude' : '.pi', 'skills', name)`。

```js
test('add links a pack skill into every installed agent and records it', () => {
  addSkills(ctx, { project, names: ['gamma', 'delta'] });
  assert.ok(samePath(linkTarget(L('claude', 'gamma')), join(repo, 'skills/project-packs/dev-project/skills/gamma')));
  assert.ok(samePath(linkTarget(L('pi', 'delta')), join(repo, 'skills/project-packs/dev-project/frontend/skills/delta')));
  assert.deepEqual(state().projects[projectKey(state(), project)], ['delta', 'gamma']);
  assert.deepEqual(addSkills(ctx, { project, names: ['gamma'] }).changes, []);   // 重复 add 不改任何东西
});

test('add refuses an unknown name, a global skill and a missing folder, and writes nothing', () => {
  assert.throws(() => addSkills(ctx, { project, names: ['gamma', 'nope'] }), /unknown skill "nope"/);
  assert.throws(() => addSkills(ctx, { project, names: ['alpha'] }), /"alpha" is a global skill/);
  assert.throws(() => addSkills(ctx, { project: join(project, 'missing'), names: ['gamma'] }), /no such folder/);
  assert.ok(!existsSync(join(project, '.claude')));
  assert.deepEqual(state().projects ?? {}, {});
});

test('a real folder or a foreign link with the same name is left alone and reported', () => {
  // 与 repo 完全相同的副本也不能动
  put(project, '.claude/skills/gamma/SKILL.md', readFileSync(join(repo, 'skills/project-packs/dev-project/skills/gamma/SKILL.md')));
  const elsewhere = tempDir('elsewhere-');
  makeDirLink(elsewhere, L('pi', 'gamma'));
  const r = addSkills(ctx, { project, names: ['gamma'] });
  assert.ok(!isLink(L('claude', 'gamma')) && existsSync(join(L('claude', 'gamma'), 'SKILL.md')));
  assert.ok(samePath(linkTarget(L('pi', 'gamma')), elsewhere));
  assert.equal(r.warnings.filter((w) => /left as it is/.test(w)).length, 2);
  assert.deepEqual(state().projects ?? {}, {});            // 一个位置都没链上 → 不记
});

test('a name linked in at least one place is recorded even when another place is skipped', () => {
  put(project, '.claude/skills/gamma/SKILL.md', 'mine\n');
  addSkills(ctx, { project, names: ['gamma'] });
  assert.ok(isLink(L('pi', 'gamma')));
  assert.deepEqual(Object.values(state().projects), [['gamma']]);
});

test('remove unlinks only the named skills and never a real folder', () => {
  put(project, '.claude/skills/own/SKILL.md', 'mine\n');
  addSkills(ctx, { project, names: ['gamma', 'delta'] });
  removeSkills(ctx, { project, names: ['gamma'] });
  assert.ok(!existsSync(L('claude', 'gamma')) && !existsSync(L('pi', 'gamma')));
  assert.ok(isLink(L('pi', 'delta')) && existsSync(join(L('claude', 'own'), 'SKILL.md')));
  assert.throws(() => removeSkills(ctx, { project, names: ['gamma'] }), /"gamma" was not added/);
  removeSkills(ctx, { project, names: 'all' });
  assert.ok(!existsSync(L('pi', 'delta')));
  assert.deepEqual(state().projects, {});
  assert.throws(() => removeSkills(ctx, { project, names: 'all' }), /no skills were added/);
});

test('a git project gets each link excluded, and the block goes with the last link', () => {
  git('init', '-q', project);
  put(project, '.git/info/exclude', '# mine\n*.tmp\n');
  addSkills(ctx, { project, names: ['gamma'] });
  const ex = readFileSync(join(project, '.git/info/exclude'), 'utf8');
  assert.match(ex, /^# mine\n\*\.tmp\n/);
  assert.ok(ex.includes('/.claude/skills/gamma\n') && ex.includes('/.pi/skills/gamma\n'));
  assert.equal(git('-C', project, 'status', '--porcelain').stdout, '');
  removeSkills(ctx, { project, names: 'all' });
  assert.equal(readFileSync(join(project, '.git/info/exclude'), 'utf8'), '# mine\n*.tmp\n');
});

test('a project in a sub-folder of a git repo, with spaces and brackets in its path', () => {
  const top = tempDir('top-');
  git('init', '-q', top);
  const sub = join(top, '我的 proj [v2]');
  mkdirSync(sub);
  addSkills(ctx, { project: sub, names: ['gamma'] });
  assert.ok(readFileSync(join(top, '.git/info/exclude'), 'utf8').includes('/我的 proj \\[v2]/.claude/skills/gamma\n'));
  assert.equal(git('-C', top, 'status', '--porcelain', '--untracked-files=all').stdout, '');
});

test('the home, a home pack folder and a folder inside the repo are refused', () => {
  mkdirSync(join(home, 'dev-project', 'x'), { recursive: true });
  mkdirSync(join(repo, 'inner'));
  for (const p of [home, join(home, 'dev-project'), join(home, 'dev-project', 'x'), join(repo, 'inner')]) {
    assert.throws(() => addSkills(ctx, { project: p, names: ['gamma'] }), /not a project folder/);
  }
});

test('a dry run reports the links and writes nothing', () => {
  const r = addSkills(ctx, { project, names: ['gamma'], dryRun: true });
  assert.ok(r.changes.some((c) => c.startsWith('link ') && c.endsWith('gamma')));
  assert.ok(!existsSync(join(project, '.claude')));
  assert.deepEqual(state().projects ?? {}, {});
});

test('the same project spelled in another case is one entry', { skip: process.platform === 'linux' }, () => {
  addSkills(ctx, { project: project.toUpperCase(), names: ['gamma'] });
  addSkills(ctx, { project: project.toLowerCase(), names: ['delta'] });
  assert.deepEqual(Object.values(state().projects), [['delta', 'gamma']]);
});
```

`git(...args)` = `spawnSync('git', args, { encoding: 'utf8' })`；`state()` 读 `<repo>/.local/state.json`。

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/projects.test.mjs`
Expected: FAIL（`Cannot find module '../lib/projects.mjs'`）

- [ ] **Step 3: 实现 `lib/projects.mjs`（以及 `agents/index.mjs`、`abs` 导出、`loadState` 默认值）**

`syncProject` 的规则（`addSkills` / `removeSkills` / Task 2 的 update 都走它）：

- 每个 agent 的项目技能目录 = `ADAPTERS[a].plan(ctx, [], () => {}).skills.pack(project)`。
- 对 `names` 里每个名字、`agents` 里每个 agent 的位置 `p`，目标 `t = skillIndex(repo).get(name).dir`：
  - 不存在 → `link p`；是链接且 `samePath(target, t)` → 不动；是链接且目标在 repo 内（存在或悬空）→ `relink p (was …)`；
  - 其他（真实目录、文件、指向 repo 外的链接、悬空到 repo 外）→ `run.warn('left as it is (not a link into the repo): ' + p)`，不动。
- 名字不在 `skillIndex` 里 → `run.note('<name>: no longer in the repo; its links were removed')`；在但 `global` → `run.note('<name>: now a global skill; its project links were removed')`。两种都从返回值里去掉，并按下一条删链接。
- 要删链接的名字 = `previous` 里不在保留名单里的；`removeAgents` 的位置上 `previous` 的全部名字。只删**指向 repo 内的链接**（`pruneLinks` 的判断），其余一律不碰。
- 项目目录不存在 → `run.warn('project folder is gone: <p> — run: node harness.mjs remove all "<p>"')`，原样返回 `previous`，不做别的。
- 返回值：保留名单里，至少在一个 `agents` 位置上已经是（或本次 dry run 将成为）指向 `t` 的链接的名字，排序。
- **git exclude**：`git -C <project> rev-parse --show-toplevel --path-format=absolute --git-path info/exclude`；失败（不是 git 仓库、没装 git）就跳过。受管块的每一行 = `/` + 链接相对仓库根的路径（`/` 分隔），对 `\ * ? [` 前加 `\`；列出所有 `agents` 位置上属于返回名单的链接，排序。内容变了才写，变更标签 `update <exclude file>`。块格式：

```
# >>> ai-agent-config-sync (managed: node harness.mjs add/remove)
/.claude/skills/gamma
# <<< ai-agent-config-sync
```

- dry run：只记变更，不写文件，不改状态。

`addSkills`：`state.agents` 为空 → 抛 `nothing installed yet — run: node harness.mjs install --agents <list>`；拒绝项目的规则（`not a project folder: <p>`）：`samePath(p, ctx.home)`，或在 `join(ctx.home, PACKS[k])` 处/之下，或 `resolvesInto(ctx.repo, p)`；然后校验名字（`unknown skill "<n>" — the pack index is in HARNESS.md` / `"<n>" is a global skill: every session has it already`）和目录（`no such folder: <p>`）。全部通过才开始写：`names = previous ∪ 新名字`，调 `syncProject`，非 dry run 时把返回值存进 `state.projects[key]`（空则删键）并 `saveState`。

`removeSkills`：项目不在状态里 → `no skills were added to <p>`；名字不在名单 → `"<n>" was not added to <p>`；`'all'` = 整个名单。项目目录不存在时**不报错**，只删状态。其余同上。

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tests/projects.test.mjs` → PASS；`node --test tests/*.test.mjs` → 全过（`ADAPTERS` 的 re-export 没破坏现有测试）。

- [ ] **Step 5: Commit**

```bash
git add lib/agents/index.mjs lib/projects.mjs lib/engine.mjs lib/state.mjs lib/platform.mjs tests/projects.test.mjs
git commit -m "feat(projects): link pack skills into a project and track them per machine"
```

---

### Task 2: CLI `add` / `remove`，update / uninstall / doctor 接上项目

**Files:**
- Modify: `harness.mjs`（`COMMANDS`、`USAGE`、两个 case）、`lib/engine.mjs`（`runInstall` 末尾）
- Test: `tests/projects.test.mjs`（追加）、`tests/cli.test.mjs`（追加）

**Interfaces:**
- Consumes: Task 1 的 `syncProject`, `addSkills`, `removeSkills`, `projectKey`。
- Produces: `node harness.mjs add <name>[,<name>…] <project-dir> [--dry-run] [--verbose]`；`node harness.mjs remove <name>[,<name>…]|all <project-dir> [--dry-run] [--verbose]`。退出码同 `printReport`（有冲突 1，否则 0；用法错误 2；异常 1）。

- [ ] **Step 1: 写失败的测试**

追加到 `tests/projects.test.mjs`（`update` = `runInstall(ctx, { agents: ['claude', 'pi'], packs: ['dev'] })`，先 `update()` 一次再 `add`）：

```js
test('update relinks a project skill that moved in the repo and drops one that was deleted', () => {
  addSkills(ctx, { project, names: ['gamma', 'delta'] });
  renameSync(join(repo, 'skills/project-packs/dev-project/skills/gamma'), join(repo, 'skills/project-packs/dev-project/frontend/skills/gamma'));
  rmSync(join(repo, 'skills/project-packs/dev-project/frontend/skills/delta'), { recursive: true });
  const r = update();
  assert.ok(samePath(linkTarget(L('pi', 'gamma')), join(repo, 'skills/project-packs/dev-project/frontend/skills/gamma')));
  assert.ok(!existsSync(L('pi', 'delta')) && !isLink(L('pi', 'delta')));
  assert.ok(r.notes.some((n) => /delta: no longer in the repo/.test(n)));
  assert.deepEqual(Object.values(state().projects), [['gamma']]);
});

test('a project skill that became global is dropped from the project', () => {
  addSkills(ctx, { project, names: ['gamma'] });
  renameSync(join(repo, 'skills/project-packs/dev-project/skills/gamma'), join(repo, 'skills/global/gamma'));
  // catalog 里补上 gamma，否则 checkRepo 会拒绝运行
  const r = update();
  assert.ok(!isLink(L('claude', 'gamma')));
  assert.ok(r.notes.some((n) => /gamma: now a global skill/.test(n)));
});

test('uninstalling one agent removes only its project links, and the exclude block keeps the rest', () => {
  git('init', '-q', project);
  addSkills(ctx, { project, names: ['gamma'] });
  runInstall(ctx, { agents: ['pi'], packs: ['dev'], uninstall: true });
  assert.ok(!existsSync(L('pi', 'gamma')) && isLink(L('claude', 'gamma')));
  const ex = readFileSync(join(project, '.git/info/exclude'), 'utf8');
  assert.ok(ex.includes('/.claude/skills/gamma') && !ex.includes('/.pi/skills/gamma'));
});

test('a project folder that is gone is reported, not fatal, and remove all clears it', () => {
  addSkills(ctx, { project, names: ['gamma'] });
  rmSync(project, { recursive: true });
  assert.ok(update().warnings.some((w) => /project folder is gone/.test(w)));
  assert.equal(Object.keys(state().projects).length, 1);
  removeSkills(ctx, { project, names: 'all' });
  assert.deepEqual(state().projects, {});
});

test('doctor reports a project link that went missing', async () => {
  addSkills(ctx, { project, names: ['gamma'] });
  removeLink(L('pi', 'gamma'));
  const found = await doctor(ctx);
  assert.ok(found.some((f) => f.msg.includes('update would make') && f.msg.includes(L('pi', 'gamma'))));
});
```

追加到 `tests/cli.test.mjs`：

```js
test('add and remove a pack skill in a project through the CLI', () => {
  const home = tempDir('harness-cli-');
  assert.equal(cli(['install', '--agents', 'claude', '--packs', 'dev'], home).status, 0);
  const project = tempDir('harness-proj-');
  const add = cli(['add', 'find-bugs', project], home);
  assert.equal(add.status, 0, add.stdout + add.stderr);
  assert.ok(isLink(join(project, '.claude', 'skills', 'find-bugs')));
  const rm = cli(['remove', 'all', project], home);
  assert.equal(rm.status, 0, rm.stdout + rm.stderr);
  assert.ok(!existsSync(join(project, '.claude', 'skills', 'find-bugs')));
  assert.equal(cli(['add', 'find-bugs'], home).status, 2);                    // 少了目录
  assert.match(cli(['add', 'nope', project], home).stderr, /^error: unknown skill "nope"/);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/projects.test.mjs tests/cli.test.mjs`
Expected: 新加的 6 个 FAIL（update 不碰项目；CLI 报 `unknown command: add`）。

- [ ] **Step 3: 在 `runInstall` 里接上项目**

在 `cleanHooksDir` 之后、`saveState` 之前：对 `state.projects` 的每一项调 `syncProject`。非 uninstall：`agents` = 本次运行后所有已安装的 agent（`[...new Set([...state.agents, ...agents])]`），`names = previous = state.projects[p]`；非 dry run 时写回返回值（空则删键）。uninstall：`agents` = 剩下的 agent，`removeAgents` = 本次卸载的，`names = previous = state.projects[p]`；剩下的 agent 为空时状态里的 `projects` 原样保留（以后重装会重新链上）。doctor 不用改：它的 dry-run update 已经会把缺失或悬空的项目链接列为待做的变更，把跳过的位置和已删的项目目录列为警告。

- [ ] **Step 4: 在 `harness.mjs` 加两个命令**

`COMMANDS.add = COMMANDS.remove = { flags: { 'dry-run': false, verbose: false }, words: [2] }`。两个 case 都先 `liveGuard()`、`installedState()`，再把第一个词按逗号拆成名字（`remove` 的 `all` 原样传），第二个词是项目目录，调 `addSkills` / `removeSkills`，`process.exit(printReport(r))`。`USAGE` 加两行：

```
  node harness.mjs add <skill>[,<skill>…] <project-dir> [--dry-run]     link pack skills into a project, for every installed agent
  node harness.mjs remove <skill>[,<skill>…]|all <project-dir> [--dry-run]
```

并把末尾的 `add --verbose to install, update, uninstall or resolve` 改成 `… install, update, uninstall, resolve, add or remove`。

- [ ] **Step 5: 跑测试确认通过**

Run: `node --test tests/*.test.mjs` → 全过；`node harness.mjs check` → `repo is consistent`。

- [ ] **Step 6: Commit**

```bash
git add harness.mjs lib/engine.mjs tests/projects.test.mjs tests/cli.test.mjs
git commit -m "feat(cli): add and remove pack skills in a project; update and uninstall keep project links in step"
```

---

### Task 3: `{{NAMED}}` — 常驻指令里自动列出点名技能

**Files:**
- Modify: `lib/skillspec.mjs`、`lib/prompt.mjs`、`prompt/core.md`（只改 "Global Skills" 一节）、`tests/helpers.mjs`（fixture 的 core.md 加 `{{NAMED}}`）
- Test: `tests/prompt.test.mjs`、`tests/skillspec.test.mjs`

**Interfaces:**
- Produces:
  - `lib/skillspec.mjs`: `export function frontMatterValue(text: string, key: string): string | null` — 顶层键的标量值（plain / quoted / block 都行，去掉首尾空白），没有这个键返回 `null`。
  - `lib/prompt.mjs`: `PLACEHOLDERS` 加 `'NAMED'`；`export function namedSkills(repo): { name: string, tagline: string }[]` — `skills/global` 里 `frontMatterValue(text, 'disable-model-invocation') === 'true'` 的技能，按名字排序，tagline 取自 `catalog.json`。`{{NAMED}}` 渲染为每个一行 `` - `<name>` — <tagline> ``。

- [ ] **Step 1: 写失败的测试**

`tests/skillspec.test.mjs`：

```js
test('frontMatterValue reads a plain, a quoted and a block value, and null for a missing key', () => {
  const t = '---\nname: x\ndisable-model-invocation: true\nq: "a: b"\ndescription: >-\n  one\n  two\n---\nbody\n';
  assert.equal(frontMatterValue(t, 'disable-model-invocation'), 'true');
  assert.equal(frontMatterValue(t, 'q'), 'a: b');
  assert.equal(frontMatterValue(t, 'description'), 'one two');
  assert.equal(frontMatterValue(t, 'missing'), null);
});
```

`tests/prompt.test.mjs`：

```js
test('named-only global skills are listed with their catalog tagline', () => {
  const repo = fixtureRepo();
  put(repo, 'skills/global/beta/SKILL.md', '---\nname: beta\ndescription: beta skill\ndisable-model-invocation: true\n---\nbody\n');
  const text = renderPrompt(makeContext({ repo, home: tempDir() }), { title: 'T', agent: 'claude', mcp: '' });
  assert.ok(text.includes('- `beta` — Beta tagline'));
  assert.ok(!text.includes('`alpha` —'));
});
```

- [ ] **Step 2: 跑测试确认失败** — Run: `node --test tests/skillspec.test.mjs tests/prompt.test.mjs`；Expected: FAIL（`frontMatterValue` 未导出；输出里没有 beta 行）。

- [ ] **Step 3: 实现 `frontMatterValue`、`namedSkills` 和 `{{NAMED}}` 的填充**；fixture 的 core.md 加一行 `{{NAMED}}`；`prompt/core.md` 的 "Global Skills" 一节换成：

```
## Global Skills

Every global skill that loads on its own is in your skill list with its full description; `{{REPO}}/HARNESS.md` groups them by category. These load only when the user names them, so when one fits, tell the user its name:

{{NAMED}}
```

- [ ] **Step 4: 验证** — `node --test tests/*.test.mjs` 全过；`node harness.mjs check` → `repo is consistent`；`node harness.mjs update --dry-run` 只列出 5 个 agent 的指令文件更新（Cursor 是 `write …cursor-rules.md`）。

- [ ] **Step 5: 本机生效并提交** — `node harness.mjs update`；

```bash
git add lib/skillspec.mjs lib/prompt.mjs prompt/core.md tests/helpers.mjs tests/prompt.test.mjs tests/skillspec.test.mjs
git commit -m "feat(prompt): list the named-only global skills in every agent's instructions"
```

---

### Task 4: `skill-find` 取代 `skill-router`；常驻指令和文档改成"装进项目"

**Files:**
- Create: `skills/global/skill-find/SKILL.md`
- Delete: `skills/global/skill-router/`（`git rm -r`）
- Modify: `skills/global/catalog.json`、`skills/global/skill-rules.json`、`lib/routing.mjs`、`tests/routing.test.mjs`、`prompt/core.md`、`agents/pi/notes.md`、`HARNESS.md`（手写部分）、`PLAYBOOK.md`、`README.md`、`skills/global/README.md`、`skills/global/book-to-skill/SKILL.md`（第 90 行，repo 自己写的技能）

**Interfaces:**
- Consumes: Task 2 的 CLI 命令（`skill-find` 让 agent 去跑它）。
- Produces: 全局技能 `skill-find`；`routingProblems` 只检查 `HARNESS.md`。

- [ ] **Step 1: 改路由检查的测试** — `tests/routing.test.mjs` 两个测试去掉 `prompt/core.md` 和 `skill-router` 的部分：第一个只放 `HARNESS.md`，期望 `[]`；第二个期望只剩那两条 `HARNESS.md: names …` 加上一条新断言——core.md 里写了不存在的 `~/finance-project/` 也**不**报错。Run: `node --test tests/routing.test.mjs` → FAIL。

- [ ] **Step 2: `lib/routing.mjs`** — `DOCS = ['HARNESS.md']`，文件头注释改为"路由表只在 HARNESS.md 手写一处"。Run 同上 → PASS。

- [ ] **Step 3: 写 `skills/global/skill-find/SKILL.md`**

frontmatter 原样用这段（它计入全局描述预算）：

```yaml
---
name: skill-find
description: >-
  Finds skills for the project at hand among this harness's local packs and,
  once the user agrees, links them into the project. Use when the user
  describes a project or task and asks what skills would help, or asks for a
  skill: "这个项目需要什么 skill", "找个 X 的 skill", "帮我装 skill",
  "有没有做 X 的技能", "find a skill for X", "set up skills for this project".
  Not for a skill another skill mentions: read that one straight from the repo.
---
```

正文按 spec B 写成编号步骤，必须包含：
1. 弄清要做什么；信息太少先问一句。
2. repo 路径就是全局指令里 `HARNESS.md` 所在的目录。用 2–4 个关键词（中英文都试）`grep -n -i` 搜 `<repo>/HARNESS.md`，只读命中的 `#### <pack>` 小节，不整份读（54KB）。
3. 打开候选的 `SKILL.md`：`<repo>/skills/project-packs/**/skills/<name>/SKILL.md`。
4. 给不超过 5 个的短名单，每个一句理由；已经是全局技能的说明"不用装"。
5. 用户同意后运行 `node <repo>/harness.mjs add <name>[,<name>…] <project-dir>`；项目目录默认是会话的工作目录，除非用户另指。原样转告输出里的 warning（"left as it is" 表示项目里已有同名内容，没动它）。沙箱拦了写入就请用户自己跑这条命令。
6. 怎么用上：Claude Code——`<project>/.claude/skills/` 本来就有，当前会话即可；刚建的，先 `/reload-skills`。Codex、Cursor、OpenCode、Pi——在项目里新开会话。
7. 撤掉：`node <repo>/harness.mjs remove <name>|all <project-dir>`。
- 没有用户同意绝不运行 `add`。

写完对它跑一遍 `skill-creator` 的审查 rubric，修掉命中的问题。

- [ ] **Step 4: 删 `skill-router`，更新清单** — `git rm -r skills/global/skill-router`；`catalog.json` 把 `skill-router` 条目换成 `"skill-find": { "category": "routing", "tagline": "Recommend pack skills for the project and link them in (harness add)" }`；`skill-rules.json` 把 `skill-router` 条目改名为 `skill-find`，`description` 用同一句 tagline，只保留 `which skill` / `which skills` 两个关键词和第一条 intentPattern。

- [ ] **Step 5: `prompt/core.md`** — "Starting work" 一节换成：

```
Building something new or changing behaviour: load `brainstorming` before writing anything. It sizes the request first and lets a quick, clear task straight through. A bug goes to `systematic-debugging` instead.
```

"## Local Skill Packs" 整节（含路由表）换成：

```
## Skill Packs

Domain skills (frontend, finance, research, writing, …) live in the packs under `{{REPO}}/skills/project-packs/`, indexed in `{{REPO}}/HARNESS.md`. When the user starts a project, or asks which skills would help, use `skill-find`: it recommends skills from the packs and, once the user agrees, links them into the project.

When a skill names a skill you do not have, or points at a file inside one (`../<skill>/…`) that is not there, read it from the repo: `{{REPO}}/skills/**/<skill>/` holds it. Do not ask first, and do not install it.

Document tasks (PDF / Word / Excel / PowerPoint) use the global `pdf`, `officecli` and `markitdown` skills directly.

When the user asks how to use this harness, read `{{REPO}}/PLAYBOOK.md`.
Skills reach you as links into that repo: to change a skill, edit it there, not in a copy. These instructions are generated from `{{REPO}}/prompt/core.md`: to change them, edit that file and run `node harness.mjs update`, since an edit made to this copy conflicts on the next update.
```

（第二段里 `../<skill>/…` 那半句是计划阶段补的：executing-plans 和 subagent-driven-development 用 `../requesting-code-review/code-reviewer.md` 这类相对路径引用别的技能，Task 5 把它们移进 pack 后这些路径在项目里不存在。）

- [ ] **Step 6: Pi 说明和文档**
  - `agents/pi/notes.md`：`project packs in <project>/.pi/skills/` → `project skills (linked in by skill-find, or a pack you started in) in <project>/.pi/skills/`；`currently action-first and improve-codebase-architecture` → `the named-only skills listed under Global Skills above`。表格不动（这些技能读进来时照样适用）。
  - `HARNESS.md` 手写部分：开头"**You are an AI agent…**"两段改成"缺技能时读这里；要把 pack 技能装进项目用 `skill-find`（它跑 `node harness.mjs add`）；只用一次就直接读 repo 里的 `SKILL.md`"；"## Local skill packs — routing (start the agent in the right one)" 改为 "## Local skill packs — where they live"，首段说明 pack 仍链接在 `~/<pack>[/<sub>]`、在那里启动照样能用，但日常是装进项目；**路由表保留**（`routing.mjs` 检查它）；表后那段改为"下面的索引就是 `skill-find` 搜的东西：grep 它，再读命中的小节"。
  - `PLAYBOOK.md` 第 31、115–117、175 行：`skill-router` / "去哪个目录启动" 改成 `skill-find` / "把技能装进项目"，示例命令用 `node harness.mjs add`。
  - `README.md` 第 85 行、`skills/global/README.md` 第 46、91、102 行：`skill-router` → `skill-find`。
  - `skills/global/book-to-skill/SKILL.md` 第 90 行：`use skill-router if unsure` → `see the pack index in HARNESS.md if unsure`。

- [ ] **Step 7: 验证** — `node scripts/gen-harness.mjs`（catalog 变了）；`node --test tests/*.test.mjs` 全过；`node harness.mjs check` → `repo is consistent`；`grep -rn "skill-router" --include=*.md --include=*.mjs --include=*.json . | grep -v "^./docs/\|^./HANDOFF.md\|^./tests/fixtures/\|^./.local/"` 无输出。

- [ ] **Step 8: 本机生效并提交** — `node harness.mjs update`（应看到各 agent 的 `skill-router` 链接被 unlink、`skill-find` 被 link、指令文件更新）；

```bash
git add -A skills/global prompt/core.md agents/pi/notes.md lib/routing.mjs tests/routing.test.mjs HARNESS.md PLAYBOOK.md README.md
git commit -m "feat(skills): skill-find replaces skill-router; instructions point at linking skills into the project"
```

---

### Task 5: 全局技能移动、删除、改点名

**Files:**
- Move（`git mv`，正文不改）：见 Step 1
- Delete: `skills/global/using-superpowers/`、`skills/global/high-agency/`
- Create: `agents/openai.yaml` × 4（见 Step 3）
- Modify: 4 个新点名技能的 `SKILL.md` frontmatter、`skills/global/catalog.json`、`skills/sources.json`、`skills/global/skill-rules.json`、`skills/global/README.md`、`README.md`、`PLAYBOOK.md`、`scripts/gen-harness.mjs`（全局摘要的一句措辞）、`lib/skillspec.mjs`、`lib/doctor.mjs`、`HARNESS.md`（重新生成）
- Test: `tests/skillspec.test.mjs`

**Interfaces:**
- Produces: `lib/skillspec.mjs` 导出 `codexHidden(skillDir): boolean`（从 `lib/doctor.mjs` 原样搬来；`doctor.mjs` 改为 `export { codexHidden } from './skillspec.mjs'`，现有测试的 import 不变）。`skillSpecProblems` 新增一条规则。

- [ ] **Step 1: 移动和删除**

```bash
for n in codebase-design domain-modeling prototype dispatching-parallel-agents subagent-driven-development executing-plans using-git-worktrees receiving-code-review finishing-a-development-branch; do git mv skills/global/$n skills/project-packs/dev-project/skills/$n; done
for n in first-principles-thinking github-gold teach book-to-skill; do git mv skills/global/$n skills/project-packs/productivity-project/skills/$n; done
git mv skills/global/no-ai-slop skills/project-packs/craft-project/writing/skills/no-ai-slop
git mv skills/global/playwright-interactive skills/project-packs/dev-project/testing-qa/skills/playwright-interactive
git rm -r -q skills/global/using-superpowers skills/global/high-agency
```

- [ ] **Step 2: 写失败的测试（点名技能也必须对 Codex 隐藏）**

```js
test('a named-only global skill must also be hidden from Codex', () => {
  const repo = fixtureRepo();
  put(repo, 'skills/global/beta/SKILL.md', '---\nname: beta\ndescription: beta skill\ndisable-model-invocation: true\n---\nbody\n');
  assert.deepEqual(skillSpecProblems(repo), ['skills/global/beta/SKILL.md: named-only, but Codex can still pick it: add agents/openai.yaml with policy.allow_implicit_invocation: false']);
  put(repo, 'skills/global/beta/agents/openai.yaml', 'policy:\n  allow_implicit_invocation: false\n');
  assert.deepEqual(skillSpecProblems(repo), []);
});
```

Run: `node --test tests/skillspec.test.mjs` → FAIL。

- [ ] **Step 3: 实现规则，改 4 个技能为点名** — 搬 `codexHidden`，在 `skillSpecProblems` 里对 `skills/global` 的技能加上述规则（只查全局）。`openspec-apply-change`、`openspec-archive-change`、`skill-scanner`、`skillspector`：frontmatter 加 `disable-model-invocation: true`（放在 `description` 之后），各建 `agents/openai.yaml`，内容 `policy:\n  allow_implicit_invocation: false\n`。Run: `node --test tests/skillspec.test.mjs` → PASS。

- [ ] **Step 4: 清单和文档**
  - `catalog.json`：删掉 17 个已离开全局的条目；删掉变空的类别 `thinking`、`escalation`、`workflow`、`learning`。结果 20 个条目。
  - `sources.json`：已移动技能的键从 `global/<n>` 改成新路径（如 `project-packs/dev-project/skills/codebase-design`），条目内容不变；删掉 `global/using-superpowers`（`high-agency` 若有也删）。用一段 `node -e` 脚本按键名排序写回，保持 2 空格缩进。
  - `skill-rules.json`：删掉不再是全局技能的条目。
  - `scripts/gen-harness.mjs` 的全局摘要：`auto-exposed at startup — no need to route` → `in every session — no need to add them to a project`。
  - `skills/global/README.md`、`README.md`（第 80–90 行的表：类别和数目）、`PLAYBOOK.md`（第 38 行 `high-agency`、其他提到已移走技能的地方说明它们现在在哪个 pack）。
  - `node scripts/gen-harness.mjs`。

- [ ] **Step 5: 验证**
  - `node --test tests/*.test.mjs` 全过；`node harness.mjs check` → `repo is consistent`（`sources.json` 的路径错一个都会在这里报出来）。
  - 数目：全局 20 个，其中点名 6 个（action-first、improve-codebase-architecture、openspec-apply-change、openspec-archive-change、skill-scanner、skillspector）；`dev-project/skills` 27、`productivity-project/skills` 28、`craft-project/writing/skills` 2、`dev-project/testing-qa/skills` 4。用 `node -e` 调 `globalSkills` / `packSkillSets` / `frontMatterValue` 打印核对。
  - `grep -rn "skills/global/\(codebase-design\|domain-modeling\|prototype\|dispatching-parallel-agents\|subagent-driven-development\|executing-plans\|using-git-worktrees\|receiving-code-review\|finishing-a-development-branch\|first-principles-thinking\|github-gold\|teach\|book-to-skill\|no-ai-slop\|playwright-interactive\|using-superpowers\|high-agency\)" --include=*.md --include=*.mjs --include=*.json . | grep -v "^./docs/\|^./HANDOFF.md\|^./.local/"` 无输出。

- [ ] **Step 6: 本机生效并提交** — `node harness.mjs update`（应看到 `~/.claude/skills` 等处这 17 个链接被 unlink，`~/dev-project`、`~/productivity-project`、`~/craft-project/writing`、`~/dev-project/testing-qa` 下各 agent 新增链接）；`node harness.mjs doctor` → `all good`（分支不是 master 的那条警告除外）；

```bash
git add -A skills lib/skillspec.mjs lib/doctor.mjs tests/skillspec.test.mjs scripts/gen-harness.mjs HARNESS.md README.md PLAYBOOK.md
git commit -m "feat(skills): trim the global skills to 14 that load on their own and 6 named-only; move the rest into packs"
```

---

### Task 6: 触发测试工具和压缩前的基线

**Files:**
- Create: `evals/triggers/run.mjs`、`evals/triggers/{brainstorming,officecli,requesting-code-review,pdf,skill-creator,handoff,skill-find}.json`、`tests/triggers.test.mjs`
- 结果写到 `.local/trigger-results/<label>.json`（`.local/` 已被 gitignore）

**Interfaces:**
- Produces（`evals/triggers/run.mjs`，被 import 时不执行 main）：
  - `export function invokedSkill(lines: string[]): string | null | undefined` — 从 `claude -p --output-format stream-json --verbose` 的输出行里，找会话里**第一个** `tool_use`：是 `Skill` 就返回它的 `input.skill`；是别的工具返回 `null`；还没有 tool_use 返回 `undefined`（调用方据此决定是否继续读）。
  - `export function compare(before, after): { skill: string, pass: boolean, should: [number, number], falsePos: [number, number] }[]` — `should` 为 [前, 后] 该触发命中数，`falsePos` 为 [前, 后] 误触发数；`pass` = 后命中 ≥ 前命中 且 后误触发 ≤ 前误触发。
  - CLI：`node evals/triggers/run.mjs run <label> [--skills a,b] [--runs N=1] [--jobs N=4]`；`node evals/triggers/run.mjs compare <before> <after>`（有失败时退出码 1）。
  - eval 集格式与 skill-creator 相同：`[{ "query": string, "should_trigger": boolean }]`。

- [ ] **Step 1: 写失败的测试 `tests/triggers.test.mjs`**

```js
const line = (o) => JSON.stringify(o);
const assistant = (...content) => line({ type: 'assistant', message: { content } });
test('the first tool call decides whether a skill was invoked', () => {
  assert.equal(invokedSkill([line({ type: 'system' }), assistant({ type: 'text', text: 'hi' })]), undefined);
  assert.equal(invokedSkill([assistant({ type: 'tool_use', name: 'Skill', input: { skill: 'pdf' } })]), 'pdf');
  assert.equal(invokedSkill([assistant({ type: 'tool_use', name: 'Read', input: {} }), assistant({ type: 'tool_use', name: 'Skill', input: { skill: 'pdf' } })]), null);
  assert.equal(invokedSkill(['not json', assistant({ type: 'tool_use', name: 'Skill', input: { skill: 'handoff' } })]), 'handoff');
});
test('compare passes a skill only when hits do not drop and false triggers do not rise', () => {
  const r = (h, f) => ({ results: { x: [{ should_trigger: true, hits: h, runs: 1 }, { should_trigger: false, hits: f, runs: 1 }] } });
  assert.equal(compare(r(1, 0), r(1, 0))[0].pass, true);
  assert.equal(compare(r(1, 0), r(0, 0))[0].pass, false);
  assert.equal(compare(r(1, 0), r(1, 1))[0].pass, false);
});
```

Run: `node --test tests/triggers.test.mjs` → FAIL（模块不存在）。

- [ ] **Step 2: 实现 `run.mjs`** — 每条 query × runs：在一个新建的空临时目录里（`mkdtemp`，跑完删）`spawn('claude', ['-p', query, '--output-format', 'stream-json', '--verbose'])`，环境变量去掉 `CLAUDECODE`，Windows 上用 `shell: true` 并正确转义 query（或改用 `claude.cmd`）。逐行读 stdout，`invokedSkill` 一有结论就杀进程；进程结束或 90 秒超时仍是 `undefined` 记为未触发。命中 = 结论等于被测技能名。并发 `--jobs`。结果文件：`{ label, date, runs, results: { [skill]: [{ query, should_trigger, hits, runs }] } }`；终端打印每个技能 `should h/n  false f/m`。Run: `node --test tests/triggers.test.mjs` → PASS。

- [ ] **Step 3: 冒烟** — 先单独确认这条管线真能测到触发：`node evals/triggers/run.mjs run smoke --skills pdf`，其中 `pdf.json` 暂时只放一条 `{"query": "把这个 report.pdf 的第 3 到 5 页拆出来", "should_trigger": true}`，期望 `should 1/1`。不是 1/1 就先排查（`--verbose` 输出里的 tool_use 结构、Windows 下 spawn 的转义），不要往下走。

- [ ] **Step 4: 写 7 个 eval 集** — 每个约 10 条该触发 + 约 8 条不该触发，都是真实口吻的完整请求（带具体文件名、项目背景），不是关键词。规则：
  - 该触发：当前描述里**每一个中文触发说法**至少出现在一条 query 的语境里；至少 4 条中文。
  - 不该触发：至少 4 条属于最近的邻居（brainstorming ← openspec-explore、writing-plans、systematic-debugging；officecli ← pdf、markitdown；pdf ← officecli、markitdown；requesting-code-review ← verification-before-completion、receiving-code-review、systematic-debugging；skill-creator ← skill-find、skill-scanner、book-to-skill；handoff ← writing-plans；skill-find ← skill-creator、brainstorming），其余是无关的日常请求。

- [ ] **Step 5: 跑基线** — 前提：Task 3–5 已 `update` 到本机（基线必须是移动后、压缩前的技能集）。`node evals/triggers/run.mjs run before`（约 126 次 `claude -p`）。记下每个技能的两组数字。

- [ ] **Step 6: Commit**

```bash
git add evals/triggers tests/triggers.test.mjs
git commit -m "test(evals): trigger test sets and a runner for the global skills whose descriptions get shortened"
```

---

### Task 7: 压缩描述 + 全局描述预算检查

**Files:**
- Modify: `lib/skillspec.mjs`、`lib/doctor.mjs`（`repoProblems` 加一项）、`tests/skillspec.test.mjs`、`tests/helpers.mjs`（无需改动则不动）
- Modify: 留在全局、自动触发的 14 个 `SKILL.md` 的 frontmatter

**Interfaces:**
- Consumes: Task 3 的 `frontMatterValue`；Task 6 的 runner。
- Produces（`lib/skillspec.mjs`）：
  - `export const GLOBAL_DESC_BUDGET: number`
  - `export function globalDescriptionChars(repo): { total: number, bySkill: [string, number][] }` — 只算 `skills/global` 里**没有** `disable-model-invocation: true` 的技能，`bySkill` 按字数降序。字数 = `frontMatterValue(text, 'description').length`。
  - `export function budgetProblems(repo, limit = GLOBAL_DESC_BUDGET): string[]` — 超了返回一条：`global skill descriptions total <total> characters, over the budget of <limit>; the longest: <n1> (<c1>), <n2> (<c2>), <n3> (<c3>)`；没超返回 `[]`。

- [ ] **Step 1: 写失败的测试**

```js
test('the global description budget counts only skills that load on their own', () => {
  const repo = fixtureRepo();                                     // alpha、beta 的描述各 11 字："alpha skill"
  put(repo, 'skills/global/beta/SKILL.md', `---\nname: beta\ndescription: ${'b'.repeat(500)}\ndisable-model-invocation: true\n---\n`);
  assert.deepEqual(globalDescriptionChars(repo), { total: 11, bySkill: [['alpha', 11]] });
  assert.deepEqual(budgetProblems(repo, 11), []);
  assert.deepEqual(budgetProblems(repo, 10), ['global skill descriptions total 11 characters, over the budget of 10; the longest: alpha (11)']);
});
```

Run: `node --test tests/skillspec.test.mjs` → FAIL。

- [ ] **Step 2: 实现** `globalDescriptionChars`、`budgetProblems`，`GLOBAL_DESC_BUDGET` 先设为当前总数向上取整到百位（让 `check` 先通过），在 `repoProblems` 里加 `...budgetProblems(ctx.repo)`。Run: `node --test tests/*.test.mjs` → 全过。

- [ ] **Step 3: 压缩 13 个现有描述**（skill-find 在 Task 4 已按预算写好，只在测试失败时才动）。按 spec E：
  - 必须保留：做什么、什么时候用、与相近技能的区别；**所有中文触发说法**；所有明确的分界（brainstorming ↔ openspec-explore / writing-plans；officecli ↔ pdf / markitdown 等）。
  - 可以删：同一意图的多种英文说法、功能枚举、正文里已有的步骤细节、对已移走技能的比较（如 skill-creator 里的 book-to-skill、requesting-code-review 里的 receiving-code-review）。
  - vendored 的在 `metadata.source` 末尾加一句 `Description shortened for the global skill-list budget (docs/skill-find.md E); keep it short when syncing upstream.`；没有 `metadata` 块的（writing-plans、test-driven-development、systematic-debugging、verification-before-completion、pdf）新建 `metadata:\n  source: >-\n    …`。
  - 每个仍须过 `frontMatterProblems`（≤1024、`: ` 要引号或块）。

- [ ] **Step 4: 核对中文触发说法一个没丢** — 用一段临时脚本（放 scratchpad，不进 repo）：对 14 个技能，取 `git show HEAD:<path>` 的描述里所有引号内含中文的短语，断言每个都出现在新描述里；打印每个技能压缩前后字数和总数（压缩前 13 个合计约 4,759，以 `globalDescriptionChars` 的算法为准）。全部保留、总数下降才往下走。

- [ ] **Step 5: 定预算** — `GLOBAL_DESC_BUDGET = Math.ceil(新总数 × 1.2 / 100) × 100`，写成字面量常数，旁边注释写上新总数和日期。`node harness.mjs check` → `repo is consistent`。

- [ ] **Step 6: 压缩后的触发测试** — 本机链接直接指向工作树，改完即生效，不用 update。`node evals/triggers/run.mjs run after`，然后 `node evals/triggers/run.mjs compare before after`。
  - 某个技能 FAIL：先 `run after-<skill> --skills <skill> --runs 3` 重跑这一个；每条 query 多数结果与基线一致就算噪声、通过。
  - 仍 FAIL：把这个技能删掉的说法按"最像失败 query 的先补"补回去，再测这一个；补回后可能要相应上调预算（重新按 Step 5 算）。不影响其他技能。

- [ ] **Step 7: 本机生效并提交** — `node harness.mjs update`；

```bash
git add lib/skillspec.mjs lib/doctor.mjs tests/skillspec.test.mjs skills/global
git commit -m "feat(skills): shorten the global skill descriptions and fail check when their total outgrows the budget"
```

---

### Task 8: 本机验收和真实项目试用

**Files:**
- Modify: `docs/harness-v2.md`（已知限制一节）

- [ ] **Step 1: 体检** — `node harness.mjs update` → `no changes`；`node harness.mjs doctor --deep` → 只允许两条：Cursor 规则要手动粘贴、当前分支不是 master。

- [ ] **Step 2: 在一个新建的试用项目里走一遍** — `git init D:/Projects2/skill-find-trial`；在里面开 Claude Code，说"我要在这里做一个 FastAPI + React 的小项目，需要什么 skill？"。期望：触发 `skill-find`、给出 ≤5 个带理由的推荐、等你同意、跑 `add`、`git status` 干净、提示 `/reload-skills`（因为 `.claude/skills/` 是新建的）。记下：
  - Claude Code：`/reload-skills` 之后新技能是否出现；再 `add` 一个技能（此时 `.claude/skills/` 已存在），**不** reload 能否直接用——这条要用户在交互会话里试，结果决定 skill-find 第 6 步的措辞是否要改。
  - 其他 agent：在试用项目里新开会话，分别用 `codex debug prompt-input`、`opencode debug skill`（doctor deep 用的同款命令）确认技能被列出；Cursor、Pi 打开项目问"你有哪些 skill"。
  - Codex 在沙箱里跑 `add` 是否被拦（会写 repo 的 `.local/state.json`）。

- [ ] **Step 3: 记录并收尾** — 把 Step 2 的结果写进 `docs/harness-v2.md` 的已知限制；若 Claude Code 对 junction 新加的技能不会实时发现，把 skill-find 第 6 步改成"一律先 `/reload-skills`"。`node harness.mjs remove all D:/Projects2/skill-find-trial`，删掉试用目录。

- [ ] **Step 4: Commit，然后问用户是否合并** — 

```bash
git add docs/harness-v2.md skills/global/skill-find/SKILL.md
git commit -m "docs: record how each agent picks up skills linked into a project"
```

用 `finishing-a-development-branch` 问用户：快进合并 `skill-find` 进 master、切回 master、再跑一次 `node harness.mjs update`。
