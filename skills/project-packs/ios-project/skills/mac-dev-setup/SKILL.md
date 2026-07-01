---
name: mac-dev-setup
description: One-time setup runbook for agentic native iOS/macOS development after migrating to a Mac — install Xcode + XcodeBuildMCP + xcode-build-server + idb, and enable the iOS MCP templates so the agent can build/run/test/screenshot in a loop. Use when setting up a new Mac dev box, "配置 Mac", or when XcodeBuildMCP/simulator tools aren't available yet.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Mac dev setup — agentic iOS build loop

Run this once on the Mac to give the agent a closed loop: **edit → build → read errors →
run in simulator → screenshot → repeat**. Everything here is macOS-only.

## 1. Toolchain
```bash
xcode-select --install                 # command-line tools
# install Xcode 16+ from the App Store, then:
sudo xcodebuild -license accept
brew --version || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## 2. XcodeBuildMCP (B1 — the build/run/test engine, ~80 tools)
```bash
brew tap getsentry/xcodebuildmcp && brew install xcodebuildmcp   # or: npm i -g xcodebuildmcp@latest
xcodebuildmcp-doctor                                             # verify environment
```
Enable it in the MCP config (the template is at `~/MCP-Templates/xcodebuildmcp.mcp.json`):
copy it into the project as `.mcp.json`, or merge into the global MCP config. Launch form is
`npx -y xcodebuildmcp@latest mcp` (note the `mcp` subcommand). Requires macOS 14.5+, Xcode 16.
It ships Sentry telemetry — opt out per xcodebuildmcp.com/docs/privacy if desired.

## 3. xcode-build-server (B2 — LSP indexing for editors)
Only if using VSCode/Cursor (not needed for pure Xcode). Gives sourcekit-lsp real
project understanding:
```bash
brew install xcode-build-server
xcode-build-server config -workspace Pawket.xcworkspace -scheme Pawket   # writes buildServer.json
```

## 4. idb + ios-simulator-mcp (B3 — optional, agent-drives-simulator)
Prefer XcodeBuildMCP's built-in UI tools first; add this only if you need richer
tap/type/swipe/accessibility-tree control.
```bash
brew tap facebook/fb && brew install idb-companion
pip3 install fb-idb                    # provides the `idb` CLI (verify current pkg at fbidb.io/docs/installation)
```
Enable `~/MCP-Templates/ios-simulator.mcp.json` (launch `npx -y ios-simulator-mcp`, ≥1.3.3).

## 5. Verify the loop
- Create/open a scratch iOS project.
- Via the agent + XcodeBuildMCP: **build**, **boot a simulator**, **install**, **launch**,
  **screenshot**. If all five work, the loop is live.
- For Dynamic Island work, boot an **iPhone 14 Pro+** simulator.

## Later-phase MCPs (enable when you reach that stage)
- **RevenueCat** (monetization): `~/MCP-Templates/revenuecat.mcp.json` — remote MCP, needs a
  RevenueCat API v2 key. See the app's monetization plan first.
- **fastlane** (distribution): see the `fastlane` skill — `brew install fastlane`.

## Checklist
- [ ] Xcode 16+ + CLT installed; license accepted; Homebrew present.
- [ ] XcodeBuildMCP installed + `xcodebuildmcp-doctor` clean + enabled in MCP config.
- [ ] (If editor-based) xcode-build-server run → `buildServer.json` present.
- [ ] Agent can build + boot sim + install + launch + screenshot a scratch project.
- [ ] iPhone 14 Pro+ simulator available for Dynamic Island testing.
