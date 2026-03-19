# 安装验证清单

安装完成后，检查以下项目确保配置正确：

## 验收原则

- [ ] `shared/skills`、`shared/index`、`CLAUDE.md` / `AGENTS.md` 需要纳入强一致验收
- [ ] `settings.json` / `config.toml` / `opencode.json` 中的 provider、base URL、API 接入配置默认保留
- [ ] provider/API 配置不纳入强一致验收，不要求与 repo 模板完全相同
- [ ] 如果这些本机配置已经能正常工作，不应在同步或安装时被覆盖

## Claude Code

- [ ] `~/.claude/CLAUDE.md` 存在
- [ ] `~/.claude/settings.json` 存在
- [ ] `~/.claude/settings.json` 中有 `"defaultMode": "bypassPermissions"`
- [ ] `~/.claude/skills/` 目录有 230+ 个子目录
- [ ] `~/.claude/index/` 目录有 10 个 .md 文件
- [ ] `~/.claude/settings.json` 的 provider/API 配置按本机实际情况保留，不要求与 repo 模板一致

验证命令：
```bash
cat ~/.claude/settings.json | grep bypassPermissions
ls ~/.claude/skills | wc -l
ls ~/.claude/index
```

## Codex

- [ ] `~/.codex/AGENTS.md` 存在
- [ ] `~/.codex/config.toml` 存在
- [ ] `~/.codex/config.toml` 中有 `approval_policy = "never"`
- [ ] `~/.codex/config.toml` 中有 `dangerously_bypass_approvals = true`
- [ ] `~/.codex/skills/` 目录有 230+ 个子目录
- [ ] `~/.codex/index/` 目录有 10 个 .md 文件
- [ ] `~/.codex/config.toml` 的 provider/base_url/API 配置按本机实际情况保留，不要求与 repo 模板一致

验证命令：
```bash
cat ~/.codex/config.toml | grep approval_policy
cat ~/.codex/config.toml | grep dangerously_bypass
ls ~/.codex/skills | wc -l
```

## OpenCode

- [ ] `~/.config/opencode/AGENTS.md` 存在
- [ ] `~/.config/opencode/opencode.json` 存在
- [ ] `~/.config/opencode/opencode.json` 中有 `"*": "allow"`
- [ ] `~/.config/opencode/skills/` 目录有 230+ 个子目录
- [ ] `~/.config/opencode/opencode.json` 的 provider/API 配置按本机实际情况保留，不要求与 repo 模板一致

验证命令：
```bash
cat ~/.config/opencode/opencode.json | grep allow
ls ~/.config/opencode/skills | wc -l
```

## API Keys

- [ ] `~/.claude/.env` 文件存在
- [ ] `ANTHROPIC_AUTH_TOKEN` 已填写
- [ ] `GITHUB_TOKEN` 已填写

验证命令：
```bash
cat ~/.claude/.env | grep -v "^#" | grep "="
```

## 路径替换

- [ ] 若首次使用 repo 模板创建配置文件，`settings.json` 中的 `${PROJECTS_DIR:-~/projects}` 已替换为实际路径
- [ ] 若首次使用 repo 模板创建配置文件，`opencode.json` 中的 `${HOME}` 已替换为实际路径
- [ ] `config.toml` 中已按本机情况添加 `[projects.'你的路径']`（如需要）

## 不要求与 repo 模板完全一致的项目

- [ ] `~/.claude/settings.json` 中的 provider、插件、marketplace、本机 MCP 配置可与 repo 不同
- [ ] `~/.codex/config.toml` 中的 provider、`base_url`、认证相关配置可与 repo 不同
- [ ] `~/.config/opencode/opencode.json` 中的 provider、模型、API 接入配置可与 repo 不同

## 不应该出现的行为

如果出现以下情况，说明安装有问题：

- [ ] 每次会话都自动加载 `offer-k-dense-web` 或 `using-superpowers`
  - 解决：删除这些 skills
- [ ] 权限弹窗频繁出现
  - 解决：检查 bypass permissions 配置
- [ ] Skills 数量少于 200
  - 解决：重新复制 shared/skills/
- [ ] 同步或安装后，本机原本可用的 provider/API 配置被覆盖
  - 解决：恢复本机配置，并修正同步逻辑为“保留本机 provider/API 配置”
