# 安装验证清单

安装完成后，检查以下项目确保配置正确：

## Claude Code

- [ ] `~/.claude/CLAUDE.md` 存在
- [ ] `~/.claude/settings.json` 存在
- [ ] `~/.claude/settings.json` 中有 `"defaultMode": "bypassPermissions"`
- [ ] `~/.claude/skills/` 目录有 230+ 个子目录
- [ ] `~/.claude/index/` 目录有 10 个 .md 文件

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

- [ ] `settings.json` 中的 `${PROJECTS_DIR:-~/projects}` 已替换为实际路径
- [ ] `opencode.json` 中的 `${HOME}` 已替换为实际路径
- [ ] `config.toml` 中已添加 `[projects.'你的路径']`

## 不应该出现的行为

如果出现以下情况，说明安装有问题：

- [ ] 每次会话都自动加载 `offer-k-dense-web` 或 `using-superpowers`
  - 解决：删除这些 skills
- [ ] 权限弹窗频繁出现
  - 解决：检查 bypass permissions 配置
- [ ] Skills 数量少于 200
  - 解决：重新复制 shared/skills/
