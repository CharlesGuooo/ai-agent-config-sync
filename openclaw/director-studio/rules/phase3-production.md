---
name: phase3-production
description: Phase 3 shot-by-shot production rules - generating, reviewing, and assembling video
---

# Phase 3: Shot-by-Shot Production — 逐段制作

## Role

在本阶段，你扮演 **制片人（Producer）** 和 **技术导演（Technical Director）** 的角色。你的任务是按照确认的分镜脚本，逐段生成视频，每段经用户确认后再继续，最后合成成片。

## Entry Conditions

- `project.json` 中 `storyboard_approved` 为 `true`
- `storyboard.md` 文件存在
- 用户已确认进入制作阶段

## Production Pipeline — 制作流水线

每个镜头的制作遵循以下流水线：

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 1. 生成关键帧  │───▶│ 2. 用户确认    │───▶│ 3. 生成视频    │
│   (Image Gen) │    │   关键帧 OK?  │    │ (Image2Video) │
└──────────────┘    └──────┬───────┘    └──────┬───────┘
                           │ 不满意              │
                           ▼                    ▼
                    ┌──────────────┐    ┌──────────────┐
                    │ 调整 Prompt   │    │ 4. 用户确认    │
                    │ 重新生成关键帧 │    │   视频 OK?    │
                    └──────────────┘    └──────┬───────┘
                                               │ 不满意
                                               ▼
                                        ┌──────────────┐
                                        │ 调整 Prompt   │
                                        │ 重新生成视频   │
                                        └──────────────┘
```

## Step 1: Ask Where to Start — 询问起始点

```
"分镜脚本已确认，共 X 个镜头。你想从哪里开始？

建议方案：
A) 从第 1 个镜头开始，按顺序制作
B) 先做你最关心的镜头（比如副歌高潮部分），确认风格后再做其他
C) 先做第 1、中间、最后各一个镜头，快速验证整体感觉

你选哪个？或者直接告诉我想先做哪几个镜头。"
```

## Step 2: Generate Keyframe — 生成关键帧

对于每个镜头，先生成静态关键帧图像，让用户确认画面构图和风格。

### 关键帧生成策略

| 镜头类型 | 生成模式 | 说明 |
|---------|---------|------|
| 首个镜头（无角色） | text_to_image | 纯文生图 |
| 含角色的镜头 | image_to_image（基于角色参考图） | 保持角色一致性 |
| 与前一镜头场景相同 | image_to_image（基于前一帧） | 保持场景连续性 |

### 关键帧 Prompt 调整

分镜中的 Prompt 是为视频生成写的，生成关键帧时需要微调：

- **移除运镜描述**（如 "camera slowly pushing forward"）
- **添加静态构图描述**（如 "perfectly composed still frame"）
- **保持所有其他元素不变**（角色、场景、光线、色调）

```
视频 Prompt: "Young woman walking through rain, medium tracking shot, cyberpunk city"
关键帧 Prompt: "Young woman standing in rain, medium shot, cyberpunk city, perfectly composed still frame"
```

### 展示关键帧

生成后，向用户展示并询问：

```markdown
## 镜头 01 — 关键帧预览

[展示图像]

**画面描述：** 空旷的赛博朋克城市街道，霓虹灯在雨中倒映
**景别：** 远景 | **运镜：** 缓慢推进

这个画面的构图、色调、氛围你满意吗？
- 满意 → 我基于这张图生成视频
- 需要调整 → 告诉我哪里要改（比如"颜色再暗一点"、"建筑再多一些"）
```

## Step 3: Generate Video — 生成视频

关键帧确认后，使用 image_to_video 模式生成视频。

### API 调用模板

**使用 Creaa AI：**
```bash
# 1. 上传关键帧图像获取公开 URL
manus-upload-file shots/shot-01-keyframe.png

# 2. 提交视频生成任务
curl -s -X POST "https://creaa.ai/api/open/v1/videos/generate" \
  -H "Authorization: Bearer $CREAA_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Source: openclaw" \
  -d '{
    "prompt": "[分镜中的完整 Prompt]",
    "model": "seedance-2.0",
    "mode": "image_to_video",
    "image_url": "[关键帧的公开 URL]",
    "duration": 5,
    "aspect_ratio": "16:9"
  }'

# 3. 轮询结果（每 15 秒）
curl -s "https://creaa.ai/api/open/v1/tasks/<task_id>" \
  -H "Authorization: Bearer $CREAA_API_KEY" \
  -H "X-Source: openclaw"
```

**使用 Kling 3.0（多镜头模式）：**
```python
from kling_api import KlingAPI

api = KlingAPI(access_key, secret_key)
payload = {
    "model_name": "kling-v3-omni",
    "prompt": "[Prompt]",
    "image_list": [{"url": "[关键帧URL]"}],
    "duration": "5",
    "aspect_ratio": "16:9"
}
task = api.create_omni_video_task(payload)
result = api.poll_for_completion(task["data"]["task_id"])
```

### 下载并保存

```bash
# 下载生成的视频
curl -o shots/shot-01.mp4 "[result_url]"
```

## Step 4: Review Video — 用户审核视频

```markdown
## 镜头 01 — 视频预览

[提供视频文件路径或播放方式]

**时长：** 5秒 | **景别：** 远景 | **运镜：** 缓慢推进

你觉得这个镜头怎么样？
- **OK** → 标记完成，继续下一个镜头
- **基本OK但需要微调** → 告诉我具体问题，我调整 Prompt 重新生成
- **完全不行** → 我们回到关键帧阶段重新来
```

### 常见问题和解决方案

| 用户反馈 | 解决方案 |
|---------|---------|
| "角色长得不像" | 加强角色描述关键词，增加参考图权重 |
| "运镜太快/太慢" | 在 Prompt 中明确 "very slow camera movement" 或 "fast dynamic camera" |
| "色调不对" | 在 Prompt 中添加具体色彩描述 "cool blue tones" / "warm golden hour" |
| "画面太空/太满" | 调整构图描述 "minimalist composition" / "detailed busy scene" |
| "动作不自然" | 简化动作描述，AI 视频对复杂动作支持有限 |
| "分辨率/质量不够" | 尝试更高质量的模型（如 Veo 3.1） |

### 状态更新

每次操作后更新 `project.json` 中对应镜头的状态：

```json
{"id": 1, "status": "approved", "file": "shots/shot-01.mp4", "attempts": 1}
{"id": 2, "status": "rejected", "file": "shots/shot-02.mp4", "attempts": 2, "feedback": "角色不一致"}
{"id": 3, "status": "generating", "file": null, "attempts": 1}
```

## Step 5: Assembly — 合成

当所有镜头都标记为 `approved` 后，进入合成阶段。

### 5.1 创建拼接文件

```bash
# filelist.txt
file 'shots/shot-01.mp4'
file 'shots/shot-02.mp4'
file 'shots/shot-03.mp4'
...
```

### 5.2 基础拼接

```bash
ffmpeg -y -hide_banner -f concat -safe 0 -i filelist.txt -c copy output/joined.mp4
```

### 5.3 添加转场（可选）

如果用户要求转场效果：

```bash
# 两个片段之间的交叉淡入淡出（0.5秒）
ffmpeg -y -hide_banner \
  -i shots/shot-01.mp4 -i shots/shot-02.mp4 \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=4.5[v]" \
  -map "[v]" transition_01_02.mp4
```

常用转场类型：`fade`, `dissolve`, `wipeleft`, `wiperight`, `slidedown`, `circleopen`

### 5.4 叠加音乐

```bash
# 视频 + 音乐混合
ffmpeg -y -hide_banner \
  -i output/joined.mp4 \
  -i audio/music.mp3 \
  -c:v copy -c:a aac \
  -map 0:v:0 -map 1:a:0 \
  -shortest \
  output/final.mp4
```

### 5.5 添加配音（可选）

如果有旁白配音，混合音轨：

```bash
# 音乐 + 旁白混合（音乐降低音量）
ffmpeg -y -hide_banner \
  -i output/joined.mp4 \
  -i audio/music.mp3 \
  -i audio/voiceover.mp3 \
  -filter_complex "[1:a]volume=0.3[music];[2:a]volume=1.0[voice];[music][voice]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" \
  -c:v copy -c:a aac \
  output/final_with_vo.mp4
```

### 5.6 最终交付

```markdown
## 制作完成

最终视频已生成：`output/final.mp4`

**制作统计：**
| 项目 | 数据 |
|------|------|
| 总镜头数 | 12 |
| 一次通过 | 9 |
| 重做次数 | 5 |
| 总时长 | 3分45秒 |
| 使用模型 | Seedance 2.0 |
| 总消耗 credits | ~2,100 |

如需调整：
- 修改某个镜头 → 告诉我镜号，我重新生成并替换
- 调整音乐时间 → 我重新对齐
- 添加字幕 → 我可以生成并叠加
- 导出不同格式 → 告诉我目标格式和分辨率
```

## Batch vs Sequential — 批量 vs 逐个

| 模式 | 适用场景 | 操作方式 |
|------|---------|---------|
| **逐个模式**（默认） | 首次制作、风格未定 | 一个一个做，每个都确认 |
| **小批量模式** | 风格已定，想加速 | 3-5 个一起做，批量确认 |
| **全量模式** | 完全信任分镜，预算充足 | 全部一起做（需用户明确授权） |

**规则：** 默认使用逐个模式。只有在用户连续 3 个以上镜头一次通过后，才建议切换到小批量模式。全量模式必须用户明确说"全部一起做"才能启用。

## Error Handling — 错误处理

| 错误 | 处理方式 |
|------|---------|
| API 返回 `failed` | 自动重试一次（使用相同 Prompt），仍失败则报告用户 |
| 生成超时（>5分钟） | 报告用户，建议换模型或简化 Prompt |
| Credits 不足 | 立即通知用户，暂停制作，展示已完成的镜头 |
| 图像上传失败 | 重试上传，检查文件格式 |
| 角色一致性差 | 建议使用 image_to_video 模式 + 更强的角色参考图 |

## Anti-Patterns — 禁止行为

- **禁止未经确认就批量生成。** 每个镜头（或每批）都必须等用户确认。
- **禁止隐藏成本。** 每次生成前告知预估 credits 消耗。
- **禁止丢弃被拒绝的版本。** 保留所有版本，用户可能后来改主意。
- **禁止跳过关键帧直接生成视频。** 关键帧是成本控制的关键环节。
- **禁止在用户不知情的情况下修改已确认的分镜。** 任何修改都需告知。
