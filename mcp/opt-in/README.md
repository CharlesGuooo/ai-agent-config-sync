# MCP-Templates — Opt-in MCP 模板库

这里放的是 **10 个 opt-in MCP 的预制模板**，按场景打包好。你随便挑一个 `*.mcp.json` 文件丢进项目根目录，**重命名为 `.mcp.json`**（前面有个点），Claude Code 进项目会自动加载。

## 🚀 零改名快捷模板 — `.mcp.json`

如果你不想每次都改名，**直接拷 `.mcp.json` 这个文件**（带点开头）。它包含全 10 个 opt-in MCP：

```powershell
cd C:\path\to\new-project
copy "C:\Users\PC\MCP-Templates\.mcp.json" ".mcp.json"
# 完成，进项目 `claude` 自动加载 10 个 opt-in（+ 9 个 always-on = 19 个）
```

进项目后觉得某些 MCP 用不到？用 Notepad 编辑 `.mcp.json` 删掉对应 server 块即可。

> ⚠️ 注意：开 10 个会让每次 prompt 多消耗 ~30-50k token schema，**长期项目建议精简**。下面的场景模板是更省 token 的选择。

---

## 📁 场景模板（按需精选，10 个）

| 文件 | 包含的 MCP | 何时用 |
| --- | --- | --- |
| `supabase.mcp.json` | supabase | Supabase 项目 |
| `vercel.mcp.json` | vercel | Vercel 部署/项目管理 |
| `railway.mcp.json` | railway | Railway 部署 |
| `cloudflare.mcp.json` | cloudflare-docs + workers-builds + workers-bindings + observability | CF Worker 项目（4 件套） |
| `mobile.mcp.json` | expo-mcp | Expo / React Native 移动开发 |
| `magic.mcp.json` | magic | UI 组件生成（MagicUI） |
| `zai.mcp.json` | zai-mcp-server | 重度 Z.AI 搜索/抓取 |
| **`deploy.mcp.json`** | vercel + railway | 部署运维组合套餐 |
| **`fullstack.mcp.json`** | supabase + vercel | 全栈应用常用组合 |
| **`everything.mcp.json`** | 全 10 个 opt-in | 急用一锅端（注意 token 成本） |

加载这些模板后，**会与你 `~/.claude.json` 里 always-on 的 9 个 MCP 合并**，不是替换。

---

## 🍎 iOS / macOS 模板（仅 Mac 可用，3 个）

给 Pawket 等原生 iOS 开发用。**这些 MCP 只能在 macOS 上跑**（需 Xcode / idb），所以它们用的是 **Unix 启动形式**（`command: npx`），不是上面 Windows 模板的 `cmd /c` 形式 —— 迁到 Mac 后启用。配套 setup 见 `~/ios-project` 的 `mac-dev-setup` skill。

| 文件 | 包含的 MCP | 何时用 |
| --- | --- | --- |
| `xcodebuildmcp.mcp.json` | XcodeBuildMCP（build/run/test/模拟器/截图，~80 工具） | agentic iOS 开发地基（🔴 必装） |
| `ios-simulator.mcp.json` | ios-simulator-mcp（tap/type/swipe/截图/a11y tree） | 需要更细的模拟器 UI 自动化时（先用 XcodeBuildMCP 自带的） |
| `revenuecat.mcp.json` | RevenueCat（远程 MCP，订阅后台配置） | 变现阶段；需 **RevenueCat API v2 key** 存到 `REVENUECAT_API_V2_KEY` env |

> ⚠️ RevenueCat 是**远程 MCP**（`https://mcp.revenuecat.ai/mcp` + Bearer）。若你的客户端不支持远程 MCP 的 `url` 字段，用 `mcp-remote` 包裹：`npx -y mcp-remote <url> --header "Authorization: Bearer <key>"`。用前请核对 v2 key 的权限范围。

---

## 🚀 三种用法

### 用法 1：项目级（**推荐用于长期项目**）

```powershell
# CF Worker 项目
cd C:\path\to\my-cf-worker
copy "C:\Users\PC\MCP-Templates\cloudflare.mcp.json" ".mcp.json"
# 以后这个项目每次 `claude` 都会自动加载 CF 4 件套
```

Bash 风格：
```bash
cd /c/path/to/my-cf-worker
cp /c/Users/PC/MCP-Templates/cloudflare.mcp.json ./.mcp.json
```

**重要**：目标文件名必须是 `.mcp.json`（点开头），不是 `cloudflare.mcp.json`。

### 用法 2：临时一次性（**短任务、不污染项目**）

```powershell
claude --mcp-config "C:\Users\PC\MCP-Templates\cloudflare.mcp.json"
```

退出 session 即清，项目目录不留任何文件。

### 用法 3：同时加载多个 profile（**临时组合**）

```powershell
claude --mcp-config "C:\Users\PC\MCP-Templates\supabase.mcp.json" `
       --mcp-config "C:\Users\PC\MCP-Templates\cloudflare.mcp.json"
```

`--mcp-config` 可以重复传入多个文件，结果是它们的并集。

---

## 🔑 关于环境变量

这些模板里的密钥都通过 `${VAR}` 引用：
- `${SUPABASE_ACCESS_TOKEN}`、`${SUPABASE_PROJECT_REF}`、`${EXPO_TOKEN}`、`${Z_AI_API_KEY}`

这些 env 变量已经在你 **Windows User scope** 设好（`HKCU\Environment`）。新开 PowerShell / 终端会自动有，**不需要每次手动 export**。

如果 Claude 启动时报 "environment variable X is not set"，意思是那个 env var 没设好，去 Windows 设置 → 环境变量 检查。

---

## 🧹 删除项目级 `.mcp.json`

不需要某个项目的 opt-in MCP 了？

```powershell
cd C:\path\to\project
del .mcp.json
```

---

## ⚠️ Cursor 也支持 `.mcp.json` 吗？

**不一样**：
- Claude Code：项目根 `.mcp.json` 自动加载 ✅
- Cursor：项目根 `.cursor/mcp.json`（不是 `.mcp.json`），格式同样 mcpServers
- OpenCode：项目根 `opencode.json` 里加 `mcp` 块
- Codex：项目级配置需用 `codex -c mcp_servers.X.enabled=true` 等参数，没有"丢一个文件就能用"的机制

如果你想给 Cursor 用同样的模板：
```powershell
mkdir .cursor
copy "C:\Users\PC\MCP-Templates\cloudflare.mcp.json" ".cursor\mcp.json"
```

---

## 📋 Cheat Sheet（贴在显示器旁边的版本）

| 场景 | 命令 |
| --- | --- |
| 长期 CF Worker 项目 | `cp ~/MCP-Templates/cloudflare.mcp.json ./.mcp.json` |
| 长期 Supabase 项目 | `cp ~/MCP-Templates/supabase.mcp.json ./.mcp.json` |
| 长期全栈项目 | `cp ~/MCP-Templates/fullstack.mcp.json ./.mcp.json` |
| 临时跑 deploy 任务 | `claude --mcp-config ~/MCP-Templates/deploy.mcp.json` |
| 急用全部 | `claude --mcp-config ~/MCP-Templates/everything.mcp.json` |
| 看当前 MCP 加载情况 | `/mcp`（在 Claude 交互里输入） |

---

## 📝 给新模板加项

需要新场景？复制现有模板改名就行，格式很简单：
```json
{
  "mcpServers": {
    "<name>": { ... }
  }
}
```

stdio 风格、HTTP 风格、Bearer 风格都已在现有模板里有示例。
