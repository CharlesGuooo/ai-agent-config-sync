---
name: video-backends
description: Video generation backend selection and API usage guide
---

# Video Backends — 视频生成后端

## Backend Detection — 后端检测

在 Phase 1 讨论时，检测用户可用的后端：

```bash
# 检查可用的 API Key
echo "Creaa AI: $([ -n "$CREAA_API_KEY" ] && echo '✅ 可用' || echo '❌ 未配置')"
echo "Kling: $([ -n "$KLING_ACCESS_KEY" ] && echo '✅ 可用' || echo '❌ 未配置')"
```

如果没有任何 API Key，告知用户需要至少配置一个视频生成服务。

## Backend Comparison — 后端对比

| 维度 | Creaa AI | Kling 3.0 | Remotion |
|------|---------|-----------|---------|
| **类型** | 多模型聚合 API | 单模型 API | 程序化视频 |
| **视频生成** | Sora 2/Veo 3.1/Seedance/Kling/Runway | Kling 3.0 Omni | 代码渲染 |
| **图像生成** | Seedream/NanoBanana/GPT Image | 无 | 无 |
| **多镜头** | 逐镜头 | 原生多镜头（max 6） | N/A |
| **音频同步** | 部分模型支持 | 原生支持 | 代码控制 |
| **角色一致性** | image_to_video | <<<image>>> 模板 | 完全一致（代码） |
| **成本** | 按 credits（模型不同） | 按 API 调用 | 免费（本地渲染） |
| **适用场景** | 通用首选 | MV、多镜头叙事 | 动画/字幕/数据可视化 |

## Selection Strategy — 选择策略

```
用户需求是什么？
├── 实拍风格（人物/场景/产品）
│   ├── 有 Creaa API Key → 用 Creaa AI
│   │   ├── 高质量要求 → Veo 3.1 或 Kling 3.0
│   │   ├── 性价比优先 → Sora 2（10 credits/sec）
│   │   └── 灵活时长 → Seedance 2.0（5/10/15s）
│   ├── 有 Kling Key → 用 Kling 3.0
│   │   └── 多镜头叙事 → 使用 multi_shot 模式
│   └── 都没有 → 引导用户注册 Creaa（最简单）
│
├── 动画/字幕/数据可视化
│   └── 用 Remotion（免费，本地渲染）
│
└── 混合（实拍 + 动画）
    └── 实拍部分用 Creaa/Kling，动画部分用 Remotion，FFmpeg 合成
```

## Creaa AI — 详细用法

### 图像生成（关键帧）

```bash
curl -s -X POST "https://creaa.ai/api/open/v1/images/generate" \
  -H "Authorization: Bearer $CREAA_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Source: openclaw" \
  -d '{
    "prompt": "[关键帧 Prompt]",
    "model": "seedream-4.5",
    "aspect_ratio": "16:9",
    "n": 1
  }'
```

### 视频生成

```bash
curl -s -X POST "https://creaa.ai/api/open/v1/videos/generate" \
  -H "Authorization: Bearer $CREAA_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Source: openclaw" \
  -d '{
    "prompt": "[视频 Prompt]",
    "model": "seedance-2.0",
    "mode": "image_to_video",
    "image_url": "[关键帧公开URL]",
    "duration": 5,
    "aspect_ratio": "16:9"
  }'
```

### 轮询结果

```bash
# 图像：每 5 秒轮询
# 视频：每 15 秒轮询
curl -s "https://creaa.ai/api/open/v1/tasks/<task_id>" \
  -H "Authorization: Bearer $CREAA_API_KEY" \
  -H "X-Source: openclaw"
```

### 模型推荐

| 场景 | 推荐模型 | 理由 |
|------|---------|------|
| 默认选择 | seedance-2.0 | 灵活时长（5/10/15s），性价比好 |
| 最高质量 | veo-3.1 | 画质最佳，但只有 8s |
| 预算有限 | sora-2 | 10 credits/sec，最便宜 |
| 需要长镜头 | sora-2（15s）或 seedance-2.0（15s） | 支持较长时长 |
| 纯 image_to_video | runway-gen-4.5 | 高质量 i2v |

## Kling 3.0 — 详细用法

### 单镜头

```python
from kling_api import KlingAPI
import os

api = KlingAPI(
    os.environ["KLING_ACCESS_KEY"],
    os.environ["KLING_SECRET_KEY"]
)

payload = {
    "model_name": "kling-v3-omni",
    "prompt": "[Prompt]",
    "duration": "5",
    "aspect_ratio": "16:9",
    "sound": "off"
}

# 如有参考图
payload["image_list"] = [{"url": "[图片URL]"}]

task = api.create_omni_video_task(payload)
result = api.poll_for_completion(task["data"]["task_id"])
video_url = result["videos"][0]["url"]
```

### 多镜头（Kling 独有优势）

```python
payload = {
    "model_name": "kling-v3-omni",
    "multi_shot": True,
    "shot_type": "customize",
    "duration": "15",
    "aspect_ratio": "16:9",
    "image_list": [{"url": "[角色参考图URL]"}],
    "multi_prompt": [
        {"index": 1, "prompt": "<<<image_1>>> walking...", "duration": 5},
        {"index": 2, "prompt": "<<<image_1>>> looking up...", "duration": 5},
        {"index": 3, "prompt": "<<<image_1>>> smiling...", "duration": 5}
    ]
}
```

**注意：** 多镜头模式最多 6 个镜头，总时长 = 各镜头时长之和。

## Remotion — 详细用法

适用于非实拍类视频（动画、字幕、数据可视化、音乐可视化）。

```bash
# 创建项目
npx create-video@latest my-video --template blank

# 安装依赖
cd my-video && npm install

# 启动预览
npm run dev

# 渲染输出
npx remotion render src/index.ts MyComposition output/video.mp4
```

Remotion 的详细用法参见 `remotion-official` Skill。

## Cost Estimation Helper — 成本估算

```python
def estimate_cost(shots, model="seedance-2.0"):
    """估算视频生成成本"""
    
    # 图像生成成本（关键帧）
    image_models = {
        "seedream-4.5": 4,
        "z-image-turbo": 1,
    }
    
    # 视频生成成本（每秒）
    video_models = {
        "veo-3.1": 30,
        "seedance-2.0": 25,
        "sora-2-pro": 18,
        "kling-3.0": 32,
        "hailuo-2.3": 25,
        "runway-gen-4.5": 30,
        "sora-2": 10,
    }
    
    image_cost = len(shots) * image_models.get("seedream-4.5", 4)
    video_cost = sum(
        shot["duration"] * video_models.get(model, 25) 
        for shot in shots
    )
    
    return {
        "image_credits": image_cost,
        "video_credits": video_cost,
        "total_credits": image_cost + video_cost,
        "note": "一次通过的理想成本，重做会增加"
    }
```
