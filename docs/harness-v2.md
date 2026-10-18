# Harness v2 设计

> 状态：已和用户逐条确认（2026-10-18）。实施计划见
> `docs/superpowers/plans/2026-10-18-harness-v2.md`。

## 为什么要改

2026-10-18 对本机做了一次只读比对：184 个映射里 26 个不一致，根源可以归成几条。

| 现象 | 根源 |
|---|---|
| repo 改了，本机没跟上；本机改了，repo 不知道 | 每个 agent 各复制一份，两边各改各的 |
| 一同步就毁掉 Codex 配置、删掉本机自己加的 MCP | 整个文件或整个字段覆盖（`config.toml` 整份替换，`mcpServers` 整块替换） |
| Codex / Cursor 的内置 skill、Claude 从 claude.ai 同步的 skill 会被删 | `robocopy /MIR` 镜像整个目录，连厂商自己管的东西一起删 |
| repo 删掉的 skill 在本机一直留着（包括已经删掉的 pua） | 同步只往外写，不清理 |
| 只能在 Windows 上用 | 14 个文件写死了 `C:/Users/PC` 和 `cmd /c` |
| Pi 读到了 Codex 的指令 | `~/AGENTS.md` 这类放在 home 下的共用文件，别的 agent 往上找时也会读到 |
| Cursor 的全局规则从没生效 | Cursor 只认设置界面里的用户规则，不读文件 |

## 已确认的决策

1. **内容用链接**：skill 目录在本机是链接，指回 repo 工作区（Windows 用 junction，不需要管理员；Mac/Linux 用符号链接）。只有一份文件，本机改动直接出现在 `git status` 里。
2. **共享内容只放在 repo 克隆里**：每个 agent 有一个适配器，装哪个 agent 就只碰它自己的目录。home 下不再放共用文件。
3. **一个 Node 安装器**：零第三方依赖，三个系统共用。命令：`install` / `update` / `doctor` / `resolve` / `uninstall` / `check`。
4. **配置按条目归属**：repo 只管它定义的条目（某个 MCP 服务器、某个 hook、某个插件开关、提示词里的一段），按名字合并，其余归本机。repo 删掉的条目本机跟着删。模型、provider、登录、界面、信任目录、本机自己的插件都归本机。
5. **MCP 和提示词只写一份**：MCP 一个清单，按 agent 格式和系统生成；提示词是公共部分加各 agent 的一小段。生成结果只写到本机，不提交。Pi 也接上 MCP。Cursor 的规则生成好，由用户在设置里粘贴一次。
6. **冲突用三方比较**：以"上次安装器写进去的内容"为基准。本机没动过就更新；本机改过就不覆盖、报出来，由 `resolve` 决定用 repo 的还是保留本机的。永远不悄悄覆盖。
7. **不做备份**。

## 仓库结构

```
harness.mjs                 命令行入口
lib/
  util.mjs                  读写文件、JSON、稳定序列化、hash
  platform.mjs              系统识别、建链接、删链接、删目录（拒绝删链接）
  state.mjs                 本机状态 .local/state.json
  decide.mjs                三方比较规则（所有受管对象共用）
  skills.mjs                列出全局 skill 和各 pack 的 skills 目录
  links.mjs                 把 skill 逐个链接进 agent 目录、清理断链
  managed.mjs               受管文本块（提示词）和受管整文件（命令、模板）
  jsonfile.mjs              JSON 配置里的受管条目和受管 hook
  toml.mjs                  Codex config.toml 里的受管 [mcp_servers.*] 表
  mcp.mjs                   读 MCP 清单、按 agent 和系统渲染
  prompt.mjs                skill 表、MCP 小节、拼装提示词、清单自检
  legacy.mjs                清理 v1 同步脚本留下的东西（迁移完可删）
  engine.mjs                执行各 agent 的计划，汇总报告
  doctor.mjs                只读体检
  agents/{claude,codex,cursor,opencode,pi}.mjs   适配器
prompt/core.md              提示词公共部分（带占位符）
agents/<agent>/notes.md     该 agent 自己的一段（可选）
agents/claude/commands/     Claude 的斜杠命令
agents/opencode/commands/   OpenCode 的命令
mcp/catalog.json            MCP 清单（唯一来源）
skills/global/              全局 skill + catalog.json（不变）
skills/project-packs/       各领域 pack（不变）
scripts/hooks/              guard.mjs / format.mjs，各 agent 直接按路径引用
scripts/gen-harness.mjs     生成 HARNESS.md 的 pack 索引（保留）
tests/                      node:test 测试
.local/                     本机状态和生成的 Cursor 规则，不提交
```

删除：`scripts/sync.*`、`scripts/install.*`、`scripts/merge-claude-settings.mjs`、
`scripts/gen-skill-table.mjs`（逻辑并入 `lib/prompt.mjs`）、`agents/` 下 7 个手写提示词和
各家整份配置、`agents/codex/profiles/`（整份替换 `config.toml`，和第 4 条冲突）、
`agents/claude/profiles/`、`agents/cursor/skills-cursor/`、`skills/codex-system/`
（这两个由 Cursor 和 Codex 自己维护）、`mcp/always-on/`、`mcp/opt-in/`、`mcp/README.md`、
`INVENTORY.md`（`install --dry-run` 会打印精确的落点）。

## 安装器

### 命令

```
node harness.mjs install --agents claude,codex [--packs dev,research] [--dry-run]
node harness.mjs update [--dry-run]          # 按记住的 agent 和 pack 重新应用
node harness.mjs doctor [--deep]             # 只读：等于 update 的 dry-run，再加几项检查
node harness.mjs resolve                     # 列出冲突
node harness.mjs resolve repo <id>|all       # 用 repo 的版本
node harness.mjs resolve keep <id>           # 保留本机版本，以后不再管这一项（pin）
node harness.mjs uninstall --agents codex
node harness.mjs check                       # repo 自检，适合 CI：清单和目录对得上、HARNESS.md 是新的
```

`install` 和 `update` 拒绝在 git worktree 里对真实 home 运行，因为链接会指向 worktree。
开发时在 worktree 里跑测试，装机只在主目录跑。

### 本机状态

`.local/state.json`，不提交：

```json
{
  "version": 1,
  "agents": ["claude", "pi"],
  "packs": ["dev", "research"],
  "entries": {
    "claude:mcp:github": { "agent": "claude", "kind": "json", "file": "...", "path": ["mcpServers", "github"], "hash": "..." },
    "codex:mcp:github":  { "agent": "codex",  "kind": "toml", "file": "...", "name": "github", "hash": "..." },
    "claude:hook:guard": { "agent": "claude", "kind": "hook", "file": "...", "event": "PreToolUse", "command": "...", "hash": "..." },
    "claude:prompt":     { "agent": "claude", "kind": "block", "file": "...", "hash": "..." },
    "claude:mcp-template:supabase": { "agent": "claude", "kind": "file", "file": "...", "hash": "...", "pinned": true }
  }
}
```

链接不记状态：链接自己就说明了它指向 repo 的哪里。

### 三方比较

每个受管对象都有三个值：本机当前（current）、repo 想要的（desired）、上次写进去的（last，记在状态里）。

| 情况 | 动作 |
|---|---|
| current 等于 desired | 什么都不做，记下 |
| 本机没有，也从没写过 | 写入 |
| current 等于 last（本机没动过） | 更新成 desired |
| 其他（本机改过、本机删了、首次安装但本机已有不同内容） | 冲突，不写 |
| `resolve repo` | 写入 desired |
| `resolve keep` | 保留本机，标记 pinned，以后跳过 |

比较的是内容，不是文本：JSON 用排好键的序列化，TOML 先解析成值（Codex 会按自己的格式重写
`config.toml`：表重新排序、删注释、`30` 写成 `30.0`），文本统一换行符后比较。

### 五种受管对象

| 类型 | 用在哪 | 本机身份 |
|---|---|---|
| link | 每个 skill 目录 | 链接本身（指向 repo 内） |
| file | Claude 命令、OpenCode 命令、Claude 的可选 MCP 模板 | 文件路径 |
| block | 各家提示词文件里两行标记之间的一段 | 文件路径 + 标记 |
| json | MCP 条目、插件开关；hook 按它运行的命令认领 | 文件 + 键路径；hook 用上次写入的命令找回 |
| toml | Codex 的 `[mcp_servers.<名字>]` 及其子表 | 文件 + 服务器名 |

skill 链接的规则：
- 目标位置没有东西：建链接。
- 已经是指向 repo 内的链接：指向对了就跳过，不对就重建。指向 repo 外的链接：冲突。
- 是一个真目录（v1 留下的拷贝）：内容和 repo 一模一样就换成链接，不一样就是冲突。
- agent 目录里其他东西（厂商 skill、自己装的）一律不碰。
- 指向 repo 内、但 repo 里已经没有这个 skill 的链接：删掉。

提示词文件的标记：

```
<!-- >>> ai-agent-config-sync (managed: edit the repo, not this block) -->
……生成的内容……
<!-- <<< ai-agent-config-sync -->
```

标记以外的内容归本机，永远不碰。文件里没有标记时：如果是 v1 生成的旧提示词（带
`<!-- SKILLS:BEGIN -->`），整个替换；否则把受管段落放在最前面，原内容保留在下面。

### 每个 agent 落在哪里

| agent | 全局 skill | pack 里的 skill | 提示词 | MCP | 其他 |
|---|---|---|---|---|---|
| Claude | `~/.claude/skills/<名>` | `<pack>/.claude/skills/<名>` | `~/.claude/CLAUDE.md` | `~/.claude.json` 的 `mcpServers`（只放默认开的）；默认关的生成到 `~/.claude/mcp-templates/<名>.mcp.json` | `settings.json`：4 个 LSP 插件开关、guard/format hook；`~/.claude/commands/` |
| Codex | `~/.codex/skills/<名>` | `<pack>/.codex/skills/<名>` | `~/.codex/AGENTS.md` | `~/.codex/config.toml` 的 `[mcp_servers.*]`（全部，默认关的写 `enabled = false`） | hook 写进 `~/.codex/hooks.json` |
| Cursor | `~/.cursor/skills/<名>` | `<pack>/.cursor/skills/<名>` | 生成到 `<repo>/.local/cursor-rules.md`，手动粘贴到设置 → Rules | `~/.cursor/mcp.json`（只放默认开的：Cursor 的 `mcp.json` 没有"关闭"字段） | — |
| OpenCode | `~/.config/opencode/skills/<名>` | `<pack>/.opencode/skills/<名>` | `~/.config/opencode/AGENTS.md` | `~/.config/opencode/opencode.json` 的 `mcp`（全部）和 `lsp` | `~/.config/opencode/commands/` |
| Pi | `~/.pi/agent/skills/<名>` | `<pack>/.pi/skills/<名>` | `~/.pi/agent/AGENTS.md` | `~/.pi/agent/mcp.json`（全部） | — |

hook 命令是 `node "<repo>/scripts/hooks/guard.mjs"`（format 同理），路径用正斜杠。Pi 没有 hook。

### MCP 清单

`mcp/catalog.json`，每个服务器写一次：

```json
{
  "servers": {
    "github":       { "http": "https://api.githubcopilot.com/mcp", "bearerEnv": "GITHUB_PERSONAL_ACCESS_TOKEN", "on": true },
    "filesystem":   { "npx": ["@modelcontextprotocol/server-filesystem@2026.1.14", "{HOME}"], "on": true },
    "brave-search": { "npx": ["@brave/brave-search-mcp-server@2.0.80"], "env": { "BRAVE_API_KEY": "${BRAVE_API_KEY}" }, "on": true },
    "web-reader":   { "http": "...", "bearerEnv": "Z_AI_API_KEY", "on": true,
                      "agents": { "codex": { "on": false }, "opencode": { "extra": { "oauth": false } } } },
    "xcodebuildmcp": { "npx": ["xcodebuildmcp@latest", "mcp"], "on": false, "os": ["mac"] }
  }
}
```

- `npx`：用 `npx -y` 启动的本地服务器；`http`：远程服务器，`bearerEnv` 生成 `Authorization: Bearer`。
- `{HOME}` 换成本机 home（正斜杠）；`${VAR}` 是环境变量。
- `os` 限定系统；`agents.<名>` 可以改默认开关（`on`）、跳过（`skip`）、或追加字段（`extra`）。

各 agent 的写法：

| agent | 本地服务器 | 远程服务器 | 环境变量 | 关闭 |
|---|---|---|---|---|
| Claude | Windows：`cmd /c npx -y …`；其他：`npx -y …` | `type: http` + `headers` | `${VAR}` | 不写进全局，生成模板 |
| Codex | `npx -y …`，`startup_timeout_sec = 30` | `url` + `bearer_token_env_var` | 同名变量用 `env_vars`，字面值用 `env` 子表；`url` 里的变量安装时代入 | `enabled = false` |
| Cursor | `npx -y …` | `type: http` + `headers` | `${env:VAR}` | 不写 |
| OpenCode | `type: local`，`command` 数组 | `type: remote` | `{env:VAR}` | `enabled: false` |
| Pi | Windows：`cmd /c npx -y …`；其他：`npx -y …` | `url` + `headers` | `${VAR}`（`url` 里的安装时代入） | `enabled: false` |

`url` 里的变量需要安装时代入（Codex、Pi），变量不存在就跳过这个服务器并报警告。

### 提示词

`prompt/core.md` 的占位符：`{{TITLE}}`、`{{SKILLS}}`（由 `skills/global/catalog.json`
生成的 skill 表）、`{{MCP}}`（这个 agent 实际有哪些服务器、默认关的怎么打开）、`{{NOTES}}`
（`agents/<agent>/notes.md`，没有就留空）、`{{REPO}}`（repo 路径，用于指向 `HARNESS.md`
和 `PLAYBOOK.md`）。

### doctor

`doctor` 先跑一遍 `update --dry-run`：待写入的就是漂移，冲突就是冲突。另外检查：

- repo 自检（同 `check`）。
- 主目录不在 master：警告，因为本机生效的就是当前分支。
- `skills/`、`agents/`、`prompt/`、`mcp/` 下有未提交的改动：提醒（可能是通过链接改的）。
- v1 遗留物还在：列出来。
- pack 下有不属于任何计划的 `.<agent>/skills` 目录（孤儿）：列出来，不自动删。
- 启用的 MCP 服务器需要的环境变量没有设置：警告。
- `--deep`：OpenCode（`opencode debug skill`）和 Codex（`codex debug prompt-input`）实际加载的
  skill 里是否有全部全局 skill；Cursor 设置库里的用户规则是否已粘贴且是最新的（需要 Node 22.5+
  的 `node:sqlite`，否则跳过）；Claude 的 4 个 LSP 插件是否已安装。

### v1 → v2 迁移

`lib/legacy.mjs` 只认 v1 留下的东西，在新机器上什么都不做，可以每次 update 都跑：

- home 下：`~/HARNESS.md`、`~/PLAYBOOK.md`、`~/.agent-hooks/`、`~/MCP-Templates/`、带 v1 标记的 `~/AGENTS.md`。
- 各 agent 的全局 skill 目录里：`catalog.json`、`skill-rules.json`。
- Claude：`settings.json` 里命令指向 `.agent-hooks` 的 hook；旧同步写进去的 `mcpServers` 键（Claude 不读这里）。
- Codex：`~/.codex/profiles/`；`config.toml` 里命令指向 `.agent-hooks` 的 `[[hooks.*]]`。
- Cursor：`~/.cursor/global-rules.md`、`~/.cursor/rules/global-rules.md`；`mcp.json` 里 v1 写的 `enabled: false` 条目。
- OpenCode：`~/.opencode/` 下的 `AGENTS.md`、`opencode.json`、`skills/`、`command/`；`~/.config/opencode/command/` 下和 repo 相同的命令文件。

## 这台电脑的对账（已确认）

| # | 事项 | 处理 |
|---|---|---|
| 1 | book-to-skill 在本机的修正（PyPI 上没有这个包） | 收回 repo，catalog 里的"pip install"一起改 |
| 2 | officecli 被自己的升级程序覆盖（claude/cursor/pi） | 用 repo 版 |
| 3 | flaui 和 cu-guard hook | 留在本机（依赖本机的 exe） |
| 4 | claude-mem 四处残留 | 全部卸载，插件缓存和 `~/.claude-mem` 一起删 |
| 5 | `~/finance-project` 根目录 23 个旧 skill | 删 |
| 6 | `~/.config/opencode/skills` 旧全局 skill（含 pua） | 已清空（2026-10-18） |
| 7 | `research-restructure` | 已快进合并进本地 master；push 等用户说 |
| 8 | `D:\Research\Thesis\.claude\skills` | 不动，整理 skill 时再看 |
| 9 | OpenCode/Cursor 加载 11 个 Claude 专用 skill | 不动，整理 skill 时再看 |

冲突一律用更好的版本；迁移时由执行的 agent 判断并写明理由。

## 不做的事

- 不做备份，不做插件市场分发，不写 Cursor 的设置库。
- 单个文件不做链接（Windows 无开发者模式时建不了文件链接）：命令和模板是受管文件，提示词是受管段落。
- 不再把 `.env` 写进系统环境变量（v1 的 `-PersistEnv`）：`doctor` 会报缺哪些变量，设置方法写在 `INSTALL.md`。

## 已知限制

- OpenCode 和 Cursor 会顺带读 `~/.claude/skills`（Cursor 还读 `~/.codex/skills`）。同名 skill 都是指向同一份文件的链接，所以选到哪份都一样。
- Codex hook 的命令路径变了以后，Codex 会要求重新确认信任一次。
- 运行中的 Claude Code 也会写 `~/.claude.json`。要是安装器写入的内容被它盖掉，`doctor` 会报出来，再跑一次 `update` 即可。
- Cursor 的用户规则改了以后要重新粘贴，`doctor --deep` 会提醒。
