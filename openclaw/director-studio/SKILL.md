---
name: director-studio
description: "Three-phase interactive video production studio. Phase 1: Creative discussion with the director. Phase 2: Storyboard script review. Phase 3: Shot-by-shot video generation. Supports music-aware MV creation, screenplay-to-video, and full director workflow with human-in-the-loop approval at every stage."
version: 1.0.0
metadata:
  openclaw:
    emoji: "🎬"
    tags: [video, director, storyboard, music-video, screenplay, production]
    requires:
      bins:
        - python3
        - ffmpeg
---

# Director Studio — Three-Phase Interactive Video Production

**讨论 → 审核 → 逐段制作。** 每一步都由你确认，绝不浪费一分钱。

Director Studio 是一个三段式交互视频制作 Skill。与现有"一键出片"工具不同，本 Skill 的核心设计原则是 **Human-in-the-Loop（人在回路中）**——因为 AI 视频生成很贵，每个镜头都应该在你点头之后才开始花钱。

---

## When to Use

当用户提出以下任何需求时，加载本 Skill：

- "帮我做一个 MV" / "给这首歌配视频"
- "帮我拍一个短片" / "写个剧本然后拍出来"
- "做一个产品宣传视频" / "做一个爆款短视频"
- "我有一段音乐，想做成视频"
- 任何涉及 **剧本 + 分镜 + 视频生成** 的多步骤视频制作任务

---

## Core Workflow: Three Phases

本 Skill 严格遵循三段式流程，每段之间必须获得用户明确确认才能进入下一段。

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Creative Discussion (免费)                        │
│  ┌─────────┐    ┌──────────┐    ┌─────────────┐            │
│  │ 用户输入  │───▶│ 导演分析  │───▶│ 创意方案讨论  │◀─── 反复  │
│  │ 创意/音乐 │    │ 音乐/需求 │    │ 直到满意      │     修改  │
│  └─────────┘    └──────────┘    └──────┬──────┘            │
│                                        │ 用户确认            │
├────────────────────────────────────────┼────────────────────┤
│  PHASE 2: Storyboard Script (免费/极低成本)                  │
│                                        ▼                    │
│                                 ┌─────────────┐            │
│                                 │ 生成分镜脚本  │◀─── 反复  │
│                                 │ + Prompt 草稿 │     修改  │
│                                 └──────┬──────┘            │
│                                        │ 用户逐条审核        │
├────────────────────────────────────────┼────────────────────┤
│  PHASE 3: Shot-by-Shot Production (按镜头付费)               │
│                                        ▼                    │
│                            ┌──────────────────┐            │
│                            │ 逐段生成视频       │            │
│                            │ 用户确认 → 下一段   │            │
│                            │ 不满意 → 只重做这段  │            │
│                            └──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**关键规则：绝不跳过阶段。** 即使用户说"直接帮我做"，也必须至少快速走完 Phase 1 和 Phase 2 的确认。

---

## Phase Details

### Phase 1: Creative Discussion — 创意讨论

加载 [rules/phase1-creative-discussion.md](rules/phase1-creative-discussion.md) 获取详细规则。

**目标：** 与用户对齐创意方向，产出一份双方认可的创意方案。

**输入类型：**

| 输入 | 处理方式 |
|------|---------|
| 用户提供音乐文件（MP3/WAV） | 分析音乐结构（前奏/主歌/副歌/桥段/尾奏）、节拍 BPM、情绪曲线、歌词内容 |
| 用户描述一个视频创意 | 提炼核心概念、目标受众、时长、风格 |
| 用户提供剧本/故事大纲 | 分析叙事结构、角色、场景、情绪节奏 |
| 用户只有模糊想法 | 引导式提问，帮助明确方向 |

**交付物：** 创意方案文档（纯文本），包含：
- 视频概念（一句话总结）
- 视觉风格参考（电影/导演/美学风格）
- 叙事结构（起承转合）
- 角色设定（如有）
- 音乐与画面的对应关系（如有音乐）
- 预估时长和镜头数量
- 技术规格（分辨率、画幅比）

**退出条件：** 用户明确表示"方案 OK"、"可以"、"进入下一步"等确认语。

---

### Phase 2: Storyboard Script — 分镜脚本

加载 [rules/phase2-storyboard-script.md](rules/phase2-storyboard-script.md) 获取详细规则。

**目标：** 产出一份完整的分镜脚本，精确到每个镜头的画面描述和生成 Prompt。

**交付物：** 结构化分镜表

```markdown
## 分镜脚本 — [项目名称]

| 镜号 | 时间码 | 时长 | 景别 | 画面描述 | 运镜 | 音频/歌词 | 生成 Prompt |
|------|--------|------|------|---------|------|----------|------------|
| 01 | 0:00-0:05 | 5s | 远景 | 空旷沙漠，夕阳 | 缓慢推进 | [前奏] | "Vast desert landscape at golden hour, camera slowly pushing forward, cinematic 16:9, warm tones" |
| 02 | 0:05-0:10 | 5s | 中景 | 主角背影出现 | 跟拍 | "第一句歌词" | "Silhouette of a young woman walking through desert, medium shot, tracking shot from behind, golden hour lighting" |
| ... | ... | ... | ... | ... | ... | ... | ... |
```

**关键规则：**
- 每个镜头的 Prompt 必须是可直接发送给视频生成 API 的完整英文 Prompt
- 镜头时长必须匹配目标视频生成模型的支持时长（5s/8s/10s/15s）
- 如有音乐，每个镜头必须标注对应的音乐段落/歌词
- 角色描述必须在所有镜头中保持一致（使用角色档案）

**退出条件：** 用户逐条审核完毕，明确表示"分镜 OK"、"可以开始做了"等确认语。

---

### Phase 3: Shot-by-Shot Production — 逐段制作

加载 [rules/phase3-production.md](rules/phase3-production.md) 获取详细规则。

**目标：** 按照确认的分镜脚本，逐段生成视频，每段经用户确认后再继续。

**工作流程：**

1. **询问用户想先做哪几个镜头**（建议从第 1 个开始，或用户指定）
2. **生成关键帧图像**（Image Generation）→ 展示给用户确认
3. **基于关键帧生成视频**（Image-to-Video）→ 展示给用户确认
4. **用户反馈：**
   - "OK" → 标记完成，询问是否继续下一段
   - "不行，XXX 有问题" → 根据反馈调整 Prompt，只重做这一段
   - "换个风格" → 修改 Prompt 重新生成
5. **所有镜头完成后 → 进入合成**

**合成阶段：**
- 使用 FFmpeg 拼接所有确认的视频片段
- 如有音乐，叠加音轨并对齐时间码
- 添加转场效果（如用户要求）
- 如需字幕/配音，调用相应 Skill
- 输出最终成片

---

## Music-Aware Mode — 音乐感知模式

当用户提供音乐文件时，自动进入音乐感知模式。加载 [rules/music-analysis.md](rules/music-analysis.md) 获取详细规则。

**音乐分析能力：**

| 分析维度 | 方法 | 用途 |
|---------|------|------|
| 歌曲结构 | 检测前奏/主歌/副歌/桥段/尾奏 | 确定镜头切换点 |
| BPM/节拍 | 检测每分钟节拍数 | 控制剪辑节奏 |
| 情绪曲线 | 分析能量变化（安静→高潮→收尾） | 匹配视觉强度 |
| 歌词 | 语音转文字 + 时间对齐 | 画面与歌词同步 |
| 音色/风格 | 识别乐器、流派 | 匹配视觉风格 |

**工具链：**
```bash
# 音乐分析依赖
pip install librosa soundfile whisper-timestamped
```

```python
# 基础音乐分析示例
import librosa

y, sr = librosa.load("song.mp3")
tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
# 结构分段
segments = librosa.segment.agglomerative(librosa.feature.mfcc(y=y, sr=sr), k=6)
```

---

## Character Consistency — 角色一致性

加载 [rules/character-consistency.md](rules/character-consistency.md) 获取详细规则。

角色一致性是 AI 视频制作的最大挑战。本 Skill 采用 **角色档案 + 参考图锁定** 策略：

1. **Phase 1** 中确定角色设定（外貌、服装、特征）
2. **Phase 2** 中为每个角色生成一张标准参考图
3. **Phase 3** 中每个镜头的 Prompt 都引用角色参考图（Image-to-Video 模式）
4. 使用 Verifier 检查生成结果与参考图的一致性

---

## Video Generation Backend — 视频生成后端

本 Skill 不绑定特定视频生成服务，支持多种后端。加载 [rules/video-backends.md](rules/video-backends.md) 获取各后端的详细用法。

| 后端 | 需要的 Skill/API | 特点 | 推荐场景 |
|------|-----------------|------|---------|
| **Creaa AI** | `creaa-ai` Skill + `CREAA_API_KEY` | 多模型聚合（Sora 2/Veo 3.1/Seedance/Kling） | 通用首选 |
| **Kling 3.0** | `kling-video-generator` Skill + `KLING_ACCESS_KEY` | 多镜头原生支持、音频同步 | MV、多镜头 |
| **fal.ai** | `fal-ai` Skill | FLUX 图像 + 视频 | 快速原型 |
| **Remotion** | `remotion-official` Skill | 程序化视频（动画/字幕/数据可视化） | 非实拍类视频 |

**选择策略：**
- 如果用户有 Creaa API Key → 优先用 Creaa（模型选择最多）
- 如果用户有 Kling Key → 用 Kling（多镜头和音频同步最强）
- 如果是动画/字幕/数据可视化类 → 用 Remotion
- 在 Phase 1 讨论时确认用户可用的后端

---

## Post-Production — 后期合成

加载 [rules/post-production.md](rules/post-production.md) 获取详细规则。

**FFmpeg 合成流程：**

```bash
# 1. 拼接视频片段
ffmpeg -y -f concat -safe 0 -i filelist.txt -c copy joined.mp4

# 2. 叠加音乐
ffmpeg -y -i joined.mp4 -i music.mp3 -c:v copy -c:a aac \
  -map 0:v:0 -map 1:a:0 -shortest output_with_music.mp4

# 3. 添加淡入淡出转场
ffmpeg -y -i clip1.mp4 -i clip2.mp4 \
  -filter_complex "xfade=transition=fade:duration=0.5:offset=4.5" \
  transition_output.mp4
```

**可选后期能力（通过其他 Skill）：**

| 能力 | 推荐 Skill | 说明 |
|------|-----------|------|
| 配音/TTS | `voice-edge-tts` 或 `qwenspeak` | 旁白配音 |
| 字幕 | `subtitle-translate-skill` | 多语言字幕 |
| BGM 生成 | 外部服务（Suno/Udio） | 如用户没有音乐 |

---

## Project File Structure

每个视频项目在工作目录下创建如下结构：

```
project-name/
├── creative-brief.md          ← Phase 1 交付物：创意方案
├── storyboard.md              ← Phase 2 交付物：分镜脚本
├── characters/                ← 角色参考图
│   ├── character-1.png
│   └── character-2.png
├── shots/                     ← Phase 3 各镜头素材
│   ├── shot-01-keyframe.png
│   ├── shot-01.mp4
│   ├── shot-02-keyframe.png
│   ├── shot-02.mp4
│   └── ...
├── audio/                     ← 音频素材
│   ├── music.mp3
│   ├── voiceover.mp3
│   └── analysis.json          ← 音乐分析结果
├── output/                    ← 最终输出
│   ├── final.mp4
│   └── final_with_subs.mp4
└── project.json               ← 项目状态文件
```

---

## State Management — 项目状态管理

使用 `project.json` 跟踪项目进度，确保中断后可恢复：

```json
{
  "name": "my-music-video",
  "phase": 2,
  "created": "2026-03-12T10:00:00Z",
  "creative_brief_approved": true,
  "storyboard_approved": false,
  "video_backend": "creaa-ai",
  "music": {
    "file": "audio/music.mp3",
    "bpm": 120,
    "duration": 195.5,
    "structure": [
      {"label": "intro", "start": 0, "end": 15.2},
      {"label": "verse1", "start": 15.2, "end": 45.8},
      {"label": "chorus1", "start": 45.8, "end": 76.3}
    ]
  },
  "characters": [
    {"id": "char-1", "name": "主角", "ref_image": "characters/character-1.png"}
  ],
  "shots": [
    {"id": 1, "status": "approved", "file": "shots/shot-01.mp4"},
    {"id": 2, "status": "pending", "file": null},
    {"id": 3, "status": "not_started", "file": null}
  ]
}
```

**状态值：** `not_started` → `generating` → `review` → `approved` / `rejected` → `regenerating`

---

## Quick Start Examples

### Example 1: 给一首歌做 MV

```
用户：我有一首歌想做成 MV，歌曲文件是 song.mp3，风格偏赛博朋克

Agent（Phase 1）：
  我来分析你的音乐...
  [分析结果：BPM 128，4分12秒，电子风格，歌词关于城市孤独]
  
  建议创意方案：
  - 概念：霓虹都市中的孤独漫步者
  - 视觉风格：Blade Runner 2049 + Ghost in the Shell
  - 叙事：主角在雨夜的赛博朋克城市中穿行，从孤独到找到连接
  - 预估 12 个镜头，总时长 4 分钟
  
  你觉得这个方向怎么样？

用户：很好，但我想加入一些数据流/代码雨的元素

Agent：明白，我把"数据流"作为视觉母题贯穿全片...
  [更新方案]
  这样可以吗？

用户：可以，进入下一步

Agent（Phase 2）：
  [输出完整分镜表，12 个镜头，每个都有详细描述和 Prompt]
  请逐条检查，有任何想改的告诉我。

用户：第 5 个镜头我想换成俯拍视角

Agent：[修改第 5 号镜头] 更新后的分镜如上，还有其他要改的吗？

用户：OK，开始做吧

Agent（Phase 3）：
  好的，我先生成第 1-3 号镜头的关键帧给你看...
  [生成关键帧图像]
  这三张关键帧你觉得如何？
```

### Example 2: 根据脚本拍爆款视频

```
用户：帮我做一个 30 秒的产品宣传视频，我们的产品是一款智能手表

Agent（Phase 1）：
  好的，30 秒产品视频。我有几个问题：
  1. 目标平台？（抖音竖版 / YouTube 横版 / 通用）
  2. 调性？（科技感 / 生活化 / 运动感）
  3. 有没有参考视频？
  
用户：抖音竖版，科技感，参考 Apple Watch 的广告风格

Agent：明白，建议方案：
  - 9:16 竖版，30 秒
  - 风格：Apple 极简 + 科技光效
  - 结构：产品特写 → 功能展示 → 生活场景 → 品牌收尾
  - 6 个镜头
  
  可以吗？
```

---

## Rules Reference

| 规则文件 | 内容 | 何时加载 |
|---------|------|---------|
| [rules/phase1-creative-discussion.md](rules/phase1-creative-discussion.md) | Phase 1 创意讨论的详细规则和引导话术 | 进入 Phase 1 时 |
| [rules/phase2-storyboard-script.md](rules/phase2-storyboard-script.md) | Phase 2 分镜脚本的格式规范和写作指南 | 进入 Phase 2 时 |
| [rules/phase3-production.md](rules/phase3-production.md) | Phase 3 逐段制作的工作流和质量控制 | 进入 Phase 3 时 |
| [rules/music-analysis.md](rules/music-analysis.md) | 音乐分析的技术实现和结果解读 | 用户提供音乐时 |
| [rules/character-consistency.md](rules/character-consistency.md) | 角色一致性的策略和 Prompt 技巧 | 涉及角色时 |
| [rules/video-backends.md](rules/video-backends.md) | 各视频生成后端的 API 用法和选择策略 | 进入 Phase 3 时 |
| [rules/post-production.md](rules/post-production.md) | FFmpeg 后期合成的命令参考 | 所有镜头完成后 |
| [rules/prompt-engineering.md](rules/prompt-engineering.md) | 视频生成 Prompt 的写作最佳实践 | 编写分镜 Prompt 时 |
