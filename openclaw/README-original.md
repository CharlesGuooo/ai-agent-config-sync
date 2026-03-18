# AI Skills Collection

统一管理 Claude Code / Codex / OpenCode 的 Skills 集合。

## 目录结构

```
.
├── director-studio/          # 视频制作三阶段工作流
├── openclaw-skills-pack/     # OpenClaw 官方技能包
│   ├── 00-reference/         # 参考资料
│   ├── 01-meta/              # 元技能（自我改进、代理守护等）
│   ├── 02-search/            # 搜索相关
│   ├── 03-coding/            # 编程相关
│   ├── 04-devops/            # DevOps 相关
│   ├── 05-research/          # 研究相关
│   ├── 06-writing/           # 写作相关
│   ├── 07-productivity/      # 生产力工具
│   ├── 08-documents/         # 文档处理
│   ├── 09-media/             # 媒体处理
│   ├── 10-mcp/               # MCP 服务器
│   ├── 11-data/              # 数据处理
│   └── 12-misc/              # 其他
├── video-skills-pack/        # 视频制作技能包
│   └── skills/
│       ├── ffmpeg-*          # FFmpeg 相关
│       ├── remotion-*        # Remotion 视频制作
│       ├── kling-*           # Kling 视频生成
│       ├── heygen-*          # HeyGen 数字人
│       └── ...               # 更多视频工具
└── claude-code-skills/       # Claude Code 专用技能
```

## 安装方法

### 方法一：复制到 Claude Code skills 目录

```bash
# 复制所有技能
cp -r openclaw-skills-pack/* ~/.claude/skills/
cp -r video-skills-pack/skills/* ~/.claude/skills/
cp -r director-studio ~/.claude/skills/
```

### 方法二：复制到 Codex skills 目录

```bash
cp -r openclaw-skills-pack/* ~/.codex/skills/
cp -r video-skills-pack/skills/* ~/.codex/skills/
```

### 方法三：使用 skillshare 同步

```bash
# 使用 skillshare skill 在不同 AI CLI 之间同步
```

## 技能分类说明

### Director Studio
三阶段交互式视频制作工作流，用于高质量视频内容的系统化创作。

### OpenClaw Skills Pack
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

### Video Skills Pack
专门用于视频制作的技能集合，包括：
- **FFmpeg**: 命令行视频处理
- **Remotion**: React 视频编程
- **Kling**: AI 视频生成
- **HeyGen**: 数字人视频
- **语音合成**: TTS、配音
- **字幕处理**: 字幕生成、翻译

## 注意事项

1. API keys 不会上传到此仓库
2. 每个技能目录包含 `SKILL.md` 定义文件
3. 使用 `skill-rules.json` 管理 skills 的自动触发规则

## 更新日志

- 2026-03-18: 初始版本，整合 Director Studio、OpenClaw Skills Pack、Video Skills Pack
