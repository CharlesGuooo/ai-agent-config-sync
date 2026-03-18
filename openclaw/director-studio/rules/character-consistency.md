---
name: character-consistency
description: Character consistency strategies for AI video generation
---

# Character Consistency — 角色一致性

## The Core Problem

AI 视频生成的最大痛点是角色一致性：同一个角色在不同镜头中长得不一样。本规则提供一套系统化的策略来最大化角色一致性。

## Strategy: Reference Image Anchoring — 参考图锚定

### Step 1: Create Character Reference Sheet

在 Phase 2 结束时，为每个角色生成一张高质量参考图：

```
Prompt 模板:
"Character reference sheet of [详细角色描述], front view, neutral expression, 
clean background, studio lighting, high detail, consistent design, 
character concept art style"
```

**关键要求：**
- 正面视角，中性表情
- 干净背景（纯色或简单渐变）
- 高清细节（面部特征、服装细节、配饰）
- 保存为 `characters/character-N.png`

### Step 2: Use Image-to-Video Mode

所有包含角色的镜头，必须使用 **image_to_video** 模式而非 text_to_video：

1. 先用参考图 + 场景描述生成关键帧（image_to_image）
2. 用关键帧作为输入生成视频（image_to_video）

这样角色的面部特征由参考图锁定，而不是由文本重新生成。

### Step 3: Consistent Prompt Keywords

同一角色在所有镜头中的描述关键词必须完全一致：

```
✅ 正确（每个镜头都用完全相同的描述）:
镜头1: "young Asian woman, long black hair, slim build, black leather jacket, white t-shirt, dark jeans, ear piercings"
镜头2: "young Asian woman, long black hair, slim build, black leather jacket, white t-shirt, dark jeans, ear piercings"
镜头3: "young Asian woman, long black hair, slim build, black leather jacket, white t-shirt, dark jeans, ear piercings"

❌ 错误（描述不一致）:
镜头1: "a young woman with black hair"
镜头2: "Asian girl in leather jacket"
镜头3: "slim woman walking in the rain"
```

## Model-Specific Tips

### Kling 3.0 Omni

Kling 的多镜头模式（multi_shot）天然支持角色一致性：

```python
payload = {
    "model_name": "kling-v3-omni",
    "multi_shot": True,
    "shot_type": "customize",
    "image_list": [{"url": "character_ref.png"}],
    "multi_prompt": [
        {"index": 1, "prompt": "<<<image_1>>> walking in rain...", "duration": 5},
        {"index": 2, "prompt": "<<<image_1>>> looking up at sky...", "duration": 5}
    ]
}
```

使用 `<<<image_1>>>` 模板语法在每个镜头中引用同一张角色参考图。

### Creaa AI / Seedance / Sora

这些模型不支持多镜头模式，需要逐镜头生成。策略：

1. 每个镜头都使用 image_to_video 模式
2. 关键帧由 image_to_image 生成（基于角色参考图）
3. 在 Prompt 中保持角色描述完全一致

### Runway Gen-4.5

Runway 只支持 image_to_video，天然适合参考图锚定策略。

## Verification — 一致性验证

生成每个镜头后，进行人工验证（由用户完成）：

```markdown
## 一致性检查 — 镜头 03

请对比以下内容：
1. 角色参考图：[characters/character-1.png]
2. 本镜头关键帧：[shots/shot-03-keyframe.png]
3. 本镜头视频截图：[自动截取第一帧]

角色一致性是否可接受？
- 一致 → 继续
- 面部不同 → 重新生成关键帧，加强面部描述
- 服装不同 → 在 Prompt 中强调服装细节
- 体型不同 → 调整 Prompt 中的体型描述
```

## Fallback Strategies — 兜底策略

如果角色一致性始终无法达标：

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| **剪影/背影** | 避免正面，用剪影或背影 | 氛围型 MV |
| **局部特写** | 只拍手、脚、眼睛等局部 | 情绪表达 |
| **风格化** | 使用动画/插画风格（一致性更好） | 创意型视频 |
| **换模型** | 尝试不同模型，某些模型对特定角色类型更稳定 | 通用 |
| **多次生成选最佳** | 同一镜头生成 3 个版本，选最一致的 | 预算允许时 |
