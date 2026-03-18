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
├── opencode/              # OpenCode 配置 (如果有)
└── openclaw/              # OpenClaw Skills 集合 (来自 ai-skills-collection)
    ├── 00-reference/      # 参考资料
    ├── 01-meta/           # 元技能（自我改进、代理守护等）
    ├── 02-search/         # 搜索相关
    ├── 03-coding/         # 编程相关
    ├── 04-devops/         # DevOps 相关
    ├── 05-research/       # 研究相关
    ├── 06-writing/        # 写作相关
    ├── 07-productivity/   # 生产力工具
    ├── 08-documents/      # 文档处理
    ├── 09-media/          # 媒体处理
    ├── 10-mcp/            # MCP 服务器
    ├── 11-data/           # 数据处理
    ├── 12-misc/           # 其他
    ├── director-studio/   # 视频制作三阶段工作流
    └── video-skills-pack/ # 视频制作技能包
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

# OpenClaw Skills (可选)
cp -r openclaw/* ~/.claude/skills/
```

## OpenClaw Skills 说明

`openclaw/` 目录包含来自 ai-skills-collection 的所有技能：

### 目录分类
- **01-meta**: 代理自我改进、代理守护、自动更新等元技能
- **02-search**: 网页搜索、学术搜索、代码搜索
- **03-coding**: 代码生成、重构、调试、测试
- **04-devops**: CI/CD、Docker、Kubernetes、云服务
- **05-research**: 文献综述、数据分析、实验设计
- **06-writing**: 文档写作、博客、技术文档
- **07-productivity**: 任务管理、自动化、工作流优化
- **08-documents**: PDF、Word、Excel 处理
- **09-media**: 图像、音频、视频处理
- **10-mcp**: MCP 服务器集成
- **11-data**: 数据处理、数据库、ETL
- **12-misc**: 其他杂项技能
- **director-studio**: 三阶段交互式视频制作工作流
- **video-skills-pack**: FFmpeg、Remotion、Kling、HeyGen 等视频工具

## API Keys

**API keys 不会上传到此仓库。** 请在各设备上单独配置：

- `ANTHROPIC_API_KEY` - Claude API
- `OPENAI_API_KEY` - OpenAI API
- 其他服务的 keys 通过 `.env.example` 模板管理

## 注意事项

1. `settings.local.json` 和敏感信息不会同步
2. 每个 skill 目录包含 `SKILL.md` 定义文件
3. 使用 `skill-rules.json` 管理 skills 的自动触发规则
