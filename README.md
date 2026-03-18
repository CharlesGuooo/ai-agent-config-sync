# AI Agent Config Sync

跨设备同步 Claude Code、Codex、OpenCode 的配置文件。

## 目录结构

```
.
├── claude-code/           # Claude Code 配置
│   ├── CLAUDE.md          # 全局指令
│   ├── settings.json      # 权限和设置
│   ├── skills/            # Skills 集合
│   │   └── skill-rules.json  # Skills 路由规则
│   └── mcp-servers/       # MCP 服务器配置
├── codex/                 # OpenAI Codex CLI 配置
│   └── config.toml        # Codex 配置
└── opencode/              # OpenCode 配置 (如果有)
```

## 安装脚本

运行以下命令将配置同步到本地：

```bash
# Claude Code
cp claude-code/CLAUDE.md ~/.claude/CLAUDE.md
cp claude-code/settings.json ~/.claude/settings.json
cp -r claude-code/skills/* ~/.claude/skills/

# Codex
cp codex/config.toml ~/.codex/config.toml
```

## API Keys

**API keys 不会上传到此仓库。** 请在各设备上单独配置：

- `ANTHROPIC_API_KEY` - Claude API
- `OPENAI_API_KEY` - OpenAI API
- 其他服务的 keys 通过 `.env.example` 模板管理

## 注意事项

1. `settings.local.json` 和敏感信息不会同步
2. 每个 skill 目录包含 `SKILL.md` 定义文件
3. 使用 `skill-rules.json` 管理 skills 的自动触发规则
