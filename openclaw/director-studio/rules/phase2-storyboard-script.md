---
name: phase2-storyboard-script
description: Phase 2 storyboard script rules - generating and reviewing shot-by-shot scripts
---

# Phase 2: Storyboard Script — 分镜脚本

## Role

在本阶段，你同时扮演 **编剧（Screenwriter）** 和 **分镜师（Storyboard Artist）** 的角色。你的任务是将 Phase 1 确认的创意方案转化为精确到每个镜头的可执行分镜脚本。

## Entry Conditions

- `project.json` 中 `creative_brief_approved` 为 `true`
- `creative-brief.md` 文件存在

## Step 1: Generate Character Profiles — 角色档案

如果视频涉及角色（人物、动物、拟人化物体），首先建立角色档案。

```markdown
## 角色档案

### 角色 1: [名称]
- **性别/年龄：** 女性，25岁左右
- **外貌：** 亚洲面孔，长黑发，瘦削
- **服装：** 黑色皮夹克，白色T恤，深色牛仔裤
- **特征：** 左耳有三个耳环，手腕有纹身
- **Prompt 关键词：** "young Asian woman, long black hair, slim build, black leather jacket, white t-shirt, dark jeans, ear piercings, wrist tattoo"

### 角色 2: [名称]
...
```

**关键规则：** 角色的 Prompt 关键词必须在所有镜头中保持完全一致。每次出现该角色时，必须复制粘贴相同的描述文本。

## Step 2: Generate Storyboard — 生成分镜

### 分镜表格式

```markdown
## 分镜脚本 — [项目名称]

**总时长：** X分X秒 | **总镜头数：** X | **画幅：** 16:9 | **后端：** creaa-ai

---

### 镜头 01
| 属性 | 内容 |
|------|------|
| **时间码** | 0:00 - 0:05 |
| **时长** | 5 秒 |
| **景别** | 远景（Wide Shot） |
| **画面描述** | 空旷的赛博朋克城市街道，霓虹灯在雨中倒映，远处高楼林立 |
| **运镜** | 缓慢推进（Slow Push In） |
| **音频** | [前奏] 合成器铺底 |
| **情绪** | 孤寂、神秘 |
| **生成 Prompt** | `Cyberpunk city street at night, heavy rain, neon lights reflecting on wet pavement, towering skyscrapers in background, slow camera push forward, cinematic 16:9, moody blue and purple tones, volumetric fog, 4K` |
| **参考图** | 无（首镜头，纯文生视频） |
| **生成模式** | text_to_video |

---

### 镜头 02
| 属性 | 内容 |
|------|------|
| **时间码** | 0:05 - 0:10 |
| **时长** | 5 秒 |
| **景别** | 中景（Medium Shot） |
| **画面描述** | 主角从暗巷中走出，雨水打在皮夹克上 |
| **运镜** | 跟拍（Tracking Shot） |
| **音频** | [主歌1开始] "第一句歌词" |
| **情绪** | 冷酷、坚定 |
| **生成 Prompt** | `Young Asian woman with long black hair, slim build, wearing black leather jacket and white t-shirt, walking out of a dark alley into neon-lit street, rain falling, medium shot tracking from side, cyberpunk aesthetic, cinematic lighting, 16:9, 4K` |
| **参考图** | characters/character-1.png |
| **生成模式** | image_to_video |
```

### 景别参考

| 景别 | 英文 | 适用场景 | Prompt 关键词 |
|------|------|---------|-------------|
| 远景 | Wide/Establishing Shot | 环境建立、气氛渲染 | `wide shot`, `establishing shot` |
| 全景 | Full Shot | 展示角色全身 + 环境 | `full shot`, `full body` |
| 中景 | Medium Shot | 角色上半身，对话场景 | `medium shot`, `waist up` |
| 近景 | Close-Up | 面部表情、情感传达 | `close-up shot`, `face` |
| 特写 | Extreme Close-Up | 细节强调（眼睛、手、物品） | `extreme close-up`, `macro` |
| 俯拍 | Bird's Eye / Top-Down | 全局视角、压迫感 | `bird's eye view`, `top-down` |
| 仰拍 | Low Angle | 力量感、威严 | `low angle shot`, `looking up` |
| 荷兰角 | Dutch Angle | 不安、紧张 | `dutch angle`, `tilted frame` |

### 运镜参考

| 运镜 | 英文 | Prompt 关键词 |
|------|------|-------------|
| 推进 | Push In / Dolly In | `camera slowly pushing forward` |
| 拉远 | Pull Out / Dolly Out | `camera pulling back` |
| 横移 | Tracking / Dolly | `tracking shot`, `camera moving sideways` |
| 摇镜 | Pan | `camera panning left/right` |
| 俯仰 | Tilt | `camera tilting up/down` |
| 环绕 | Orbit / Arc | `camera orbiting around subject` |
| 手持 | Handheld | `handheld camera`, `slight shake` |
| 稳定 | Static / Locked | `static camera`, `locked off shot` |
| 航拍 | Aerial / Drone | `aerial shot`, `drone footage` |
| 升降 | Crane / Jib | `crane shot`, `camera rising` |

## Step 3: Duration Alignment — 时长对齐

### 与音乐对齐

如果有音乐，每个镜头的时间码必须与音乐结构对齐：

- **节拍切换：** 镜头切换点应落在强拍上（尤其是副歌入口）
- **情绪匹配：** 安静段落用远景/慢运镜，高潮段落用近景/快切
- **歌词同步：** 关键歌词对应的画面应该强化歌词含义

### 与视频生成模型对齐

镜头时长必须匹配目标模型的支持时长：

| 模型 | 支持时长 | 建议 |
|------|---------|------|
| Veo 3.1 | 8s | 统一 8s |
| Seedance 2.0 | 5s, 10s, 15s | 灵活选择 |
| Sora 2 Pro | 4s, 8s, 12s | 灵活选择 |
| Kling 3.0 | 5s, 10s, 15s | 灵活选择 |
| Sora 2 | 10s, 15s | 适合长镜头 |

**规则：** 如果创意需要 7 秒的镜头，向上取整到 8 秒（Veo）或向下调整到 5 秒（Seedance），并在画面描述中注明节奏调整。

## Step 4: Review Process — 审核流程

生成完整分镜后，引导用户逐条审核：

1. **先展示完整分镜表的概览版**（只有镜号、时间、景别、一句话描述）
2. **用户可以：**
   - "整体 OK" → 进入退出流程
   - "第 X 号镜头要改" → 展示该镜头详情，讨论修改
   - "我觉得镜头太多/太少" → 调整镜头数量
   - "这里的节奏不对" → 调整时间分配
3. **修改后只展示变更的镜头**，不重复展示未变更的部分

### 常见修改类型

| 修改类型 | 处理方式 |
|---------|---------|
| 修改画面内容 | 更新画面描述和 Prompt |
| 修改景别/运镜 | 更新景别、运镜和 Prompt 中的对应关键词 |
| 调整时长 | 更新时间码，检查是否影响后续镜头 |
| 增加镜头 | 插入新镜头，重新编号，调整时间码 |
| 删除镜头 | 移除镜头，重新编号，调整时间码 |
| 调换顺序 | 交换镜头位置，更新时间码 |

## Step 5: Cost Estimation — 成本预估

在用户确认分镜前，提供成本预估：

```markdown
## 成本预估

| 项目 | 数量 | 单价 | 小计 |
|------|------|------|------|
| 关键帧图像生成 | 12 张 | ~4 credits | ~48 credits |
| 视频生成（Seedance 2.0, 5s） | 12 段 | ~125 credits | ~1,500 credits |
| **总计** | | | **~1,548 credits** |

*注：以上为一次通过的理想成本。如需重做某些镜头，成本会相应增加。*
*建议：先做 2-3 个镜头试水，确认风格满意后再批量制作。*
```

## Exit Conditions — 退出条件

当用户使用以下任何表述时，进入 Phase 3：
- "分镜 OK" / "可以开始做了" / "没问题"
- "开始生成" / "开始制作"

**退出时必须：**
1. 将最终分镜脚本保存为 `storyboard.md`
2. 更新 `project.json`：`phase: 3, storyboard_approved: true`
3. 初始化所有镜头状态为 `not_started`
4. 告知用户："分镜脚本已确认。接下来我们逐段制作，你想从哪个镜头开始？建议从第 1 个开始。"

## Anti-Patterns — 禁止行为

- **禁止生成模糊的 Prompt。** 每个 Prompt 必须足够详细，可直接发送给 API。
- **禁止角色描述不一致。** 同一角色在不同镜头中的 Prompt 描述必须完全相同。
- **禁止忽略时长约束。** 镜头时长必须是目标模型支持的值。
- **禁止一次展示过多细节。** 先给概览，用户要求时再展开。
- **禁止在分镜中使用中文 Prompt。** 视频生成 API 的 Prompt 必须是英文。
