# 交接：在 macOS 上安装并验收 harness（临时文件，验收通过后删除）

给在 Mac 上接手的 agent。这台 Mac 是第一次装这个 harness，也是第一次在 macOS 上实测它：
Windows 和 Linux（WSL Ubuntu）已经测过，macOS 还没有。你的任务是按 `INSTALL.md` 装好，
逐项对照下面的验收标准，报告结果；全部通过后删掉本文件。

## 用户的长期要求（必须遵守）

- 用中文回复用户。
- **只有用户明确说 push 才 push**，这是公开仓库。
- 不要绕过 guard hook；它拦下的命令，换一种安全的做法，或者问用户。
- API key 只能放环境变量，不写进任何文件，也不打印出来。
- 绝不碰 `~/.pi/agent/auth.json`。
- 不要从 git worktree 里运行 `install` / `update`。
- 永远不要安装 `claude-mem`。
- 先 `--dry-run` 再真装；动用户已有的配置之前先说清楚。

## 安装

步骤和前提以 `INSTALL.md` 为准，这里不重复。要点：

1. 问用户这台 Mac 上装了哪些 agent（`claude` / `codex` / `cursor` / `opencode` / `pi`），
   至少装 `claude`。agent 本身要先装好，安装器只做配置。
2. Node 20 以上（跑测试要 22 以上）。
3. 克隆到一个固定位置，比如 `~/src/ai-agent-config-sync`。所有 skill 都是指向这个目录的链接，
   之后不要随便挪。
4. `node harness.mjs install --agents <列表> --dry-run --verbose`，读一遍再去掉 `--dry-run` 正式装。
5. 按 `INSTALL.md` 的 "After installing" 做完手动步骤，再重启 agent。
6. 可选：按 `INSTALL.md` 的 "Installed beside the harness: graphify" 装 graphify，Mac 上
   Claude Code 用 `--platform claude`（不是 `windows`）。

## 验收标准：每一项都要对得上

在仓库目录里执行。括号里是 Windows 和 Linux 实测的结果，供对照。

| # | 检查 | 正确的结果 |
|---|---|---|
| 1 | 克隆后 `git status --short` | 空输出（没有任何修改） |
| 2 | `node harness.mjs check` | `repo is consistent` |
| 3 | `node --test "tests/*.test.mjs"` | **0 fail**（Linux 298 pass，Windows 303 pass；少的几个是只在 Windows 上跑的测试） |
| 4 | 安装的 dry-run | 只有 link / write / set / hook 几类改动；全新机器上应该没有 conflict。有 conflict 就停下，把列表给用户看 |
| 5 | `ls ~/.claude/skills \| wc -l` | 37（graphify 装了的话是 38） |
| 6 | `readlink ~/.claude/skills/brainstorming`、`readlink ~/dev-project/.claude/skills/anatomy` | 都指向克隆目录里对应的 `skills/...` 路径（是符号链接，不是拷贝） |
| 7 | `~/.claude/CLAUDE.md` | 有一段被 `<!-- >>> ai-agent-config-sync ... -->` 和 `<!-- <<< ai-agent-config-sync -->` 包住的内容，里面有 `## Global Skills` 一句话，**没有** 37 行的 skill 表 |
| 8 | `~/.claude/settings.json` | `hooks.PreToolUse` 和 `hooks.PostToolUse` 存在，命令是 `node "<克隆目录>/scripts/hooks/guard.mjs"`（PostToolUse 是 `format.mjs`）；`enabledPlugins` 里有 4 个 LSP 插件 |
| 9 | `~/.claude.json` 的 `mcpServers` | 9 个：github, memory, filesystem, context7, sequential-thinking, brave-search, playwright, chrome-devtools, web-reader |
| 10 | `node harness.mjs doctor` | `all good`；或者只有 "environment variable … is not set" 这类提示（Linux 上是 `GITHUB_PERSONAL_ACCESS_TOKEN` 和 `Z_AI_API_KEY`），按 `INSTALL.md` 的 "Environment variables for MCP" 设好后再跑一次，应为 `all good` |
| 11 | guard hook | 先用写文件的工具（不要用 shell 的 echo，否则 guard 会连这条命令一起拦）写一个 `/tmp/guard-block.json`，内容 `{"tool_name":"Bash","tool_input":{"command":"rm -rf ~/"}}`，然后 `node scripts/hooks/guard.mjs < /tmp/guard-block.json; echo $?`，应输出 `[guard] blocked: ...` 和退出码 `2`；把命令换成 `ls -la` 再试，退出码应为 `0` |
| 12 | bash 脚本 | `bash -n skills/global/subagent-driven-development/scripts/sdd-workspace` 不报错 |
| 13 | `node harness.mjs doctor --deep` | 会真的启动各 agent；它列出的缺失 LSP 插件，在 Claude Code 里用 `/plugin install <名字>` 装上，再跑一次没有新问题 |

### 新会话里的行为（最后做，需要能用 `claude`）

各开一个全新的 `claude -p "<提示>" --output-format stream-json --verbose > out.jsonl`，
然后 `grep -o '"name":"Skill","input":{"skill":"[a-z-]*"' out.jsonl` 看加载了哪个 skill：

| 在哪启动 | 提示 | 正确的结果 |
|---|---|---|
| 任意空目录 | `帮我做一个命令行的 todo list 小工具` | 第一个加载的是 `brainstorming` |
| 任意空目录 | `1 加 1 等于几` | 不加载任何 skill |
| 任意空目录 | `写个交接，我要换个会话接着做了` | 加载 `handoff` |
| `~/dev-project/frontend` | `Next.js 项目里，用 GSAP 的 ScrollTrigger 做一个 pin 住的横向滚动区块，路由切换时要正确清理，给代码，不要建文件` | 加载 `gsap-*` 里的一个或几个 |
| 任意空目录 | `帮我看一下贵州茅台最近的K线走势，做个技术分析` | 说出 `~/finance-project/trading/`，问用户是换目录重开还是就地做 |

## 出问题时

- 找到根因再动手，不要绕开问题让检查变绿。
- 是这个仓库的 bug（比如 macOS 的路径或链接处理）：先在 `tests/` 里写一个能复现的测试，再修，
  然后 `node --test "tests/*.test.mjs"` 和 `node harness.mjs check` 都要通过，再提交。
- 是这台 Mac 的环境问题（缺软件、权限）：告诉用户缺什么、怎么装，不要擅自装系统级软件。
- 每个问题和处理结果都记下来，最后一起报告给用户。

## 全部通过之后

1. 用一张表把上面每一项的实际结果报告给用户。
2. 删除本文件：`git rm MAC-SETUP.md`，提交（提交信息如 `chore: remove the macOS setup handoff`）。
3. **问用户**要不要 push；用户说可以再 push。
