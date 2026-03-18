# AI Agent Config Sync - 新电脑安装指南

> 这是给 Claude Code / Codex / OpenCode 的配置仓库。Clone 后按此文档操作即可完成配置。

## 这个仓库是什么？

这是一个**跨设备同步 AI Agent 配置**的仓库，包含：

1. **231+ Skills** - 编程、科研、数据分析、写作等领域的技能包
2. **三层渐进式 Skills 路由** - 节省 98% tokens 的智能加载架构
3. **Bypass Permissions 配置** - 不再被权限弹窗打断
4. **MCP 服务器配置** - GitHub、Firecrawl、Cloudflare 等集成

## 目录结构

```
├── shared/                    # 三个工具共享
│   ├── skills/                # 231+ skills
│   └── index/                 # 分类索引 (10个文件)
├── claude-code/               # Claude Code 配置
│   ├── CLAUDE.md              # 全局指令
│   ├── settings.json          # 权限 + MCP 配置
│   └── mcp-servers/           # 本地 MCP 服务器
├── codex/                     # Codex 配置
│   ├── AGENTS.md              # 全局指令
│   └── config.toml            # 权限配置
├── opencode/                  # OpenCode 配置
│   ├── AGENTS.md              # 全局指令
│   └── opencode.json          # 权限 + MCP 配置
└── .env.example               # API Keys 模板
```

---

## 安装步骤

### Step 1: Clone 仓库

```bash
git clone https://github.com/CharlesGuooo/ai-agent-config-sync.git
cd ai-agent-config-sync
```

### Step 2: 复制配置文件到本地

**根据你使用的工具，执行对应命令：**

#### Claude Code

```bash
# 创建目录
mkdir -p ~/.claude/skills ~/.claude/index ~/.claude/mcp-servers

# 复制配置
cp claude-code/CLAUDE.md ~/.claude/CLAUDE.md
cp claude-code/settings.json ~/.claude/settings.json

# 复制 skills 和 index
cp -r shared/skills/* ~/.claude/skills/
cp -r shared/index/* ~/.claude/index/

# 复制 MCP servers (可选)
cp -r claude-code/mcp-servers/* ~/.claude/mcp-servers/
```

#### Codex

```bash
# 创建目录
mkdir -p ~/.codex/skills ~/.codex/index

# 复制配置
cp codex/AGENTS.md ~/.codex/AGENTS.md
cp codex/config.toml ~/.codex/config.toml

# 复制 skills 和 index
cp -r shared/skills/* ~/.codex/skills/
cp -r shared/index/* ~/.codex/index/
```

#### OpenCode

```bash
# 创建目录
mkdir -p ~/.config/opencode/skills

# 复制配置
cp opencode/AGENTS.md ~/.config/opencode/AGENTS.md
cp opencode/opencode.json ~/.config/opencode/opencode.json

# 复制 skills (OpenCode 也共享 Claude 的 skills)
cp -r shared/skills/* ~/.config/opencode/skills/
```

### Step 3: 配置 API Keys

```bash
# 复制模板
cp .env.example ~/.claude/.env

# 编辑填入你的 API keys
nano ~/.claude/.env  # 或用其他编辑器
```

**必需的 Keys：**

| Key | 用途 | 获取方式 |
|-----|------|---------|
| `ANTHROPIC_AUTH_TOKEN` | Claude Code | [Anthropic Console](https://console.anthropic.com/) |
| `GITHUB_TOKEN` | GitHub MCP | [GitHub Settings](https://github.com/settings/tokens) |

**可选的 Keys：**

| Key | 用途 |
|-----|------|
| `OPENAI_API_KEY` | Codex (如果用 OpenAI 模型) |
| `FIRECRAWL_API_KEY` | 网页抓取 MCP |
| `SUPABASE_PROJECT_REF` | Supabase MCP |

### Step 4: 修改 settings.json 中的路径

打开 `~/.claude/settings.json`，将以下占位符替换为实际路径：

```json
// 替换前
"filesystem": {
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "${PROJECTS_DIR:-~/projects}"]
}

// 替换后 (macOS/Linux)
"filesystem": {
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/你的用户名/projects"]
}

// 替换后 (Windows)
"filesystem": {
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/Users/你的用户名/projects"]
}
```

### Step 5: 创建 projects 目录

```bash
# macOS/Linux
mkdir -p ~/projects

# Windows (PowerShell)
mkdir "$env:USERPROFILE\projects"
```

### Step 6: 重启 AI Agent

关闭并重新启动你的 AI agent (Claude Code / Codex / OpenCode)。

---

## 验证安装

### 验证 Bypass Permissions

**Claude Code:**
```bash
cat ~/.claude/settings.json | grep bypassPermissions
```
应该看到: `"defaultMode": "bypassPermissions"`

**Codex:**
```bash
cat ~/.codex/config.toml | grep approval_policy
```
应该看到: `approval_policy = "never"`

**OpenCode:**
```bash
cat ~/.config/opencode/opencode.json | grep allow
```
应该看到: `"*": "allow"`

### 验证 Skills 数量

```bash
# Claude Code
ls ~/.claude/skills | wc -l

# 应该显示 230+ 个目录
```

---

## 三层 Skills 架构说明

```
Layer 1: CLAUDE.md / AGENTS.md
         ↓ 核心工作流 skills (~100 tokens)

Layer 2: index/*.md
         ↓ 分类索引，按需查阅

Layer 3: skills/*/SKILL.md
         ↓ 完整 skill，按需加载
```

**使用方式：**

1. **日常任务** - 直接描述需求，AI 会自动匹配 skill
2. **特定领域** - 在需求中提及「触发关键词」
   ```
   "用 pubmed 搜索 Alzheimer 文献" → pubmed-database
   "分析这个分子的 drug-likeness" → rdkit
   ```
3. **复杂任务** - 说明领域，AI 会查阅对应索引

---

## 常见问题

### Q: Codex/OpenCode 每次会话都自动加载某些 skills？

这是因为某些 skills 的 description 写了 "ALWAYS run" 或 "every session"，Codex/OpenCode 可能太死板地执行了。

**解决方案：** 删除这些强制触发的 skills：
```bash
rm -rf ~/.codex/skills/offer-k-dense-web
rm -rf ~/.codex/skills/using-superpowers
rm -rf ~/.config/opencode/skills/offer-k-dense-web
rm -rf ~/.config/opencode/skills/using-superpowers
```

**正确的行为：** Skills 应该是按需调用的，不是自动加载。

### Q: 权限弹窗还是会出现？

检查 `settings.json` 中的 `defaultMode` 是否为 `bypassPermissions`，且 `skipDangerousModePermissionPrompt` 为 `true`。

### Q: MCP 服务器连接失败？

1. 确保已安装 Node.js 18+: `node --version`
2. 检查 API key 是否正确配置在 `~/.claude/.env`
3. 某些 MCP 服务器需要额外安装，查看 `mcp-servers/` 目录

### Q: Skills 没有被加载？

1. 确认 skills 目录有内容: `ls ~/.claude/skills | head`
2. 确认 index 目录有内容: `ls ~/.claude/index`
3. 重启 AI agent

### Q: Windows 路径问题？

Windows 使用反斜杠 `\` 或正斜杠 `/` 都可以，但 JSON 中需要转义：
```json
// 正确
"C:/Users/PC/projects"
// 或
"C:\\Users\\PC\\projects"
```

---

## 一键安装 (可选)

如果你想用脚本自动安装：

```bash
# macOS/Linux
chmod +x install.sh
./install.sh all

# Windows (PowerShell)
.\install.ps1 all
```

脚本会自动：
- 检查依赖 (Node.js, npx)
- 复制所有配置文件
- 替换环境变量占位符
- 创建 .env 文件
- 创建 projects 目录

---

## 更新配置

当仓库有更新时：

```bash
cd ai-agent-config-sync
git pull

# 重新复制配置文件 (重复 Step 2)
```

---

## 配置文件位置速查

| 工具 | 配置文件位置 |
|------|-------------|
| Claude Code | `~/.claude/` |
| Codex | `~/.codex/` |
| OpenCode | `~/.config/opencode/` |
| Skills (共享) | `~/.claude/skills/` |
| Index (共享) | `~/.claude/index/` |
| API Keys | `~/.claude/.env` |
