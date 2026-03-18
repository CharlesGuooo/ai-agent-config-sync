# Video Skills Pack for OpenClaw

精选 21 个高质量视频制作相关 Agent Skills，覆盖从剪辑到导演的完整工作流。所有 Skill 均已从 GitHub 源仓库下载，可直接交给 OpenClaw 安装使用。

---

## 快速安装

**方式一：整包复制到 OpenClaw skills 目录**

```bash
# 全局安装（所有项目可用）
cp -r skills/* ~/.openclaw/skills/

# 或项目级安装
cp -r skills/* <your-project>/skills/
```

**方式二：通过 ClawHub CLI 单独安装**

```bash
# 以 remotion-video-toolkit 为例
npx clawhub@latest install remotion-video-toolkit
```

**方式三：直接把本 zip 链接发给 OpenClaw 聊天窗口**，让它自行识别和安装。

---

## Skills 清单

### 一、视频剪辑 / 程序化生成（Remotion + FFmpeg）

这是核心能力层，让 AI 能够"写代码做视频"。

| Skill | 目录名 | 说明 | 来源 |
|-------|--------|------|------|
| **Remotion Official Skills** | `remotion-official/` | Remotion 官方维护的 Agent Skills，含 37 个 rules 文件，覆盖动画、音频、字幕、转场、3D、图表等全部 API 最佳实践。**最重要，必装。** | [remotion-dev/skills](https://github.com/remotion-dev/skills) |
| Remotion Video Toolkit | `remotion-video-toolkit/` | 社区版 Remotion 工具包，侧重文字动画和字幕显示 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/shreefentsar/remotion-video-toolkit) |
| Remotion Best Practices | `remotion-best-practices/` | Remotion 视频制作最佳实践，含 compositions、transitions、timing 等 6 个 rules | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/am-will/remotion-best-practices) |
| FFmpeg Video Editor | `ffmpeg-video-editor/` | 自然语言 → FFmpeg 命令，支持裁剪、拼接、转码、压缩、提取音频等 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/mahmoudadelbghany/ffmpeg-video-editor) |
| FFmpeg Master | `ffmpeg-master/` | 更全面的 FFmpeg 视频/音频处理能力 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/liudu2326526/ffmpeg-master) |

### 二、AI 视频生成

调用各大视频生成模型的 API，从文字/图片生成视频片段。

| Skill | 目录名 | 说明 | 来源 |
|-------|--------|------|------|
| **Creaa AI** | `creaa-ai/` | 多模型聚合：Sora 2、Seedance 2.0、Veo 3.1、Nano Banana 2，一个 Skill 调用多个模型 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/yys2024/creaa-ai) |
| **Kling Video Generator** | `kling-video-generator/` | Kling 3.0 全能视频生成：文生视频、图生视频、视频编辑、多镜头、音频同步 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/wells1137/kling-video-generator) |
| EachLabs Video Generation | `eachlabs-video-generation/` | 通过 EachLabs API 从文本/图片生成视频 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/eftalyurtseven/eachlabs-video-generation) |
| EachLabs Video Edit | `eachlabs-video-edit/` | 视频编辑、唇形同步、翻译、字幕生成 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/eftalyurtseven/eachlabs-video-edit) |
| fal.ai | `fal-ai/` | fal.ai API 集成：FLUX、SDXL 图像 + 视频 + 音频生成 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/agmmnn/fal-ai) |

### 三、数字人 / Avatar 视频

| Skill | 目录名 | 说明 | 来源 |
|-------|--------|------|------|
| HeyGen Avatar Lite | `heygen-avatar-lite/` | HeyGen API 数字人视频生成 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/daaab/heygen-avatar-lite) |
| Flyworks Avatar Video | `flyworks-avatar-video/` | Flyworks (HiFly) 数字人视频 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/linhui99/flyworks-avatar-video) |

### 四、导演 / 全流程制片

| Skill | 目录名 | 说明 | 来源 |
|-------|--------|------|------|
| **Cine-Cog** | `cine-cog/` | "If you can imagine it, CellCog can film." 电影制作全流程 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/nitishgargiitd/cine-cog) |
| **Insta-Cog** | `insta-cog/` | 单提示词 → 全流程视频制作 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/nitishgargiitd/insta-cog) |

### 五、配音 / 语音合成（TTS）

| Skill | 目录名 | 说明 | 来源 |
|-------|--------|------|------|
| Voice Edge TTS | `voice-edge-tts/` | Microsoft Edge TTS 引擎，支持实时流式播放 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/zhaov1976/voice-edge-tts) |
| QwenSpeak | `qwenspeak/` | Qwen3-TTS 语音合成 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/psyb0t/qwenspeak) |
| Salute Speech | `salute-speech/` | Sber Salute Speech 语音转文字 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/chorus12/salute-speech) |

### 六、字幕处理

| Skill | 目录名 | 说明 | 来源 |
|-------|--------|------|------|
| Subtitle Translate | `subtitle-translate-skill/` | SRT 字幕文件翻译（支持 OpenAI 兼容格式） | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/thetail001/subtitle-translate-skill) |

### 七、素材获取

| Skill | 目录名 | 说明 | 来源 |
|-------|--------|------|------|
| Instagram Reels | `instagram-reels/` | 下载 Instagram Reels，转录音频，提取字幕 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/antoinedc/instagram-reels) |
| YouTube Pro | `youtube-pro/` | YouTube 视频分析、转录、元数据提取 | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/kjaylee/youtube-pro) |
| GifHorse | `gifhorse/` | 搜索视频对话，创建带字幕的 GIF | [ClawHub](https://github.com/openclaw/skills/tree/main/skills/coyote-git/gifhorse) |

---

## 推荐安装优先级

如果不想全装，按以下优先级选择：

**必装（核心能力）：**
1. `remotion-official` — Remotion 官方 Skills，程序化视频的基石
2. `ffmpeg-video-editor` — 自然语言驱动 FFmpeg，处理已有素材
3. `creaa-ai` — 多模型视频生成聚合入口

**推荐（增强能力）：**
4. `kling-video-generator` — Kling 3.0 视频生成
5. `voice-edge-tts` — 免费 TTS 配音
6. `cine-cog` / `insta-cog` — 全流程导演

**按需（特定场景）：**
7. 其余 Skills 根据实际需求安装

---

## 目录结构

```
video-skills-pack/
├── README.md                          ← 本文件
└── skills/
    ├── remotion-official/             ← Remotion 官方（38 files）
    │   ├── SKILL.md
    │   └── rules/                     ← 37 个专项规则文件
    ├── remotion-video-toolkit/        ← 社区 Remotion 工具包
    ├── remotion-best-practices/       ← Remotion 最佳实践
    ├── ffmpeg-video-editor/           ← FFmpeg 自然语言编辑
    ├── ffmpeg-master/                 ← FFmpeg 全能处理
    ├── creaa-ai/                      ← Sora/Veo/Seedance 多模型
    ├── kling-video-generator/         ← Kling 3.0 视频生成
    ├── eachlabs-video-generation/     ← EachLabs 视频生成
    ├── eachlabs-video-edit/           ← EachLabs 视频编辑
    ├── fal-ai/                        ← fal.ai 多模态生成
    ├── heygen-avatar-lite/            ← HeyGen 数字人
    ├── flyworks-avatar-video/         ← Flyworks 数字人
    ├── cine-cog/                      ← 电影制作全流程
    ├── insta-cog/                     ← 单提示词视频制作
    ├── voice-edge-tts/                ← Edge TTS 配音
    ├── qwenspeak/                     ← Qwen3 TTS
    ├── salute-speech/                 ← 语音转文字
    ├── subtitle-translate-skill/      ← 字幕翻译
    ├── instagram-reels/               ← Instagram 素材
    ├── youtube-pro/                   ← YouTube 分析
    └── gifhorse/                      ← GIF 创建
```

---

## 安全提示

所有 Skills 均从 OpenClaw 官方 skills 仓库（`github.com/openclaw/skills`）和 Remotion 官方仓库（`github.com/remotion-dev/skills`）下载。建议在安装前仍然检查各 SKILL.md 的内容，确认无可疑命令。

---

## 统计

- 总 Skill 数量：**21 个**
- 总文件数量：**66 个**
- 覆盖类别：剪辑、视频生成、数字人、导演、配音、字幕、素材
