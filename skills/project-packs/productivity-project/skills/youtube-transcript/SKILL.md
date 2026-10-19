---
name: youtube-transcript
description: 提取 YouTube 视频的字幕文本，用于"观看"并学习视频教程内容。当你遇到 YouTube 链接、需要了解某个视频讲了什么、或要照着视频教程操作时使用。也可用于列出视频有哪些字幕语言轨道。Triggers on YouTube URLs, youtu.be links, 视频教程, watch this video, 看这个视频, 视频里讲了什么.
allowed-tools: Read, Bash
compatibility: "network — Node 18+ script calls YouTube's public player API; no dependencies, no credentials"
---

# YouTube 字幕提取

你无法真的"看"视频，但你可以读它的字幕——这几乎等价于看完了一个讲解类教程。

## 用法

```bash
node .claude/skills/youtube-transcript/scripts/fetch-transcript.mjs <URL或videoID> [选项]
```

零依赖，只需 Node 18+。接受完整 URL、短链、`/shorts/`、`/embed/` 或裸的 11 位视频 ID。

| 选项 | 说明 |
|---|---|
| `--lang=<code>` | 首选语言。默认按 `zh-Hans → zh-CN → zh → en` 顺序尝试，找不到则用第一条可用轨道 |
| `--format=text` | **默认**。纯文本，适合快速通读 |
| `--format=timestamped` | 带 `[MM:SS]` 时间戳，**照着教程做操作时用这个**——便于定位「第几分钟讲了什么」 |
| `--format=json` | 结构化输出，含每段的 start/dur |
| `--out=<路径>` | 写入文件。长视频建议写文件再读，避免刷屏 |
| `--list` | 只列出可用字幕轨道，不下载 |

### 典型调用

```bash
# 通读一个教程
node ...(略)/fetch-transcript.mjs https://www.youtube.com/watch?v=iabRIkeTD58

# 照着操作，要时间戳，存文件
node ...(略)/fetch-transcript.mjs iabRIkeTD58 --format=timestamped --out=tutorial.txt

# 先看看有哪些语言
node ...(略)/fetch-transcript.mjs iabRIkeTD58 --list
```

## 退出码

| 码 | 含义 | 你该怎么做 |
|---|---|---|
| `0` | 成功 | 读取输出 |
| `1` | **视频没有字幕** | 见下方「没有字幕怎么办」 |
| `2` | 视频不可用 / 网络错误 / 参数错误 | 看错误信息，检查链接是否有效 |

## 本项目教程视频的字幕状态（已实测，不必重复探测）

README §17 列出的 5 个教程视频，字幕情况已经验证过：

| 视频 ID | 字幕 | 说明 |
|---|---|---|
| `iabRIkeTD58` | ✅ 200 段，中文人工字幕 | **主教程**，从 0 搭建 3x-ui + VLESS REALITY |
| `6AWVEsNvxrE` | ✅ 129 段，中文人工字幕 | 第二期，REALITY 抗封锁进阶 |
| `Nk1q_kr_dX0` | ✅ 177 段，中文字幕 | 手把手自建 VLESS+Reality |
| `XwZGK-SQYH0` | ✅ 346 段，中文字幕 | Marzban 面板（备选方案） |
| `KakwTMwSM88` | ❌ **无字幕** | 上传者关闭了字幕，无法提取 |

优先读 `iabRIkeTD58`，它覆盖了买 VPS → 重装 Debian → 开 BBR → 配 REALITY 的完整流程。

## 没有字幕怎么办（退出码 1）

**不要反复重试，也不要换客户端硬试**——脚本已经内部轮询了 iOS / Android / mweb 三个客户端。退出码 1 意味着该视频**确实一条字幕轨道都没有**（人工和自动生成的都没有），通常是上传者主动关闭了字幕功能。这在推广类视频里很常见。

按顺序考虑替代方案：

1. **改用文字教程** —— README §17 里有 7 份官方文档和 6 篇中文教程，信息密度通常比视频更高，优先用它们
2. **换一个有字幕的同主题视频**
3. **语音转写**（成本高，仅在前两条都不可行时）：`yt-dlp` 下载音频 → Whisper 转写

## 注意事项

- **自动生成字幕有错字**，尤其是技术术语和命令行内容。看到 `VLASS`、`瑞尔提`、`三 X UI` 这类明显的音近错误，按上下文还原成 `VLESS`、`REALITY`、`3X-UI`
- **字幕里读不出屏幕上的内容**。视频里"这里填这个"「点这个按钮」之类的指代，字幕无法还原。涉及具体配置参数时，**以官方文档为准，不要从字幕猜**
- **长视频先写文件**再分段读，别一次性打印几百段刷屏
- 字幕只是理解教程思路的辅助；**真正的命令和配置以 3x-ui 官方 Wiki 和 XTLS 官方文档为准**
