---
name: prompt-engineering
description: Best practices for writing video generation prompts
---

# Prompt Engineering — 视频生成 Prompt 最佳实践

## Golden Rule

> **Prompt 必须用英文。** 所有主流视频生成模型（Sora、Veo、Kling、Seedance、Runway）都以英文训练为主，英文 Prompt 的效果显著优于中文。

## Prompt Structure — Prompt 结构

一个高质量的视频 Prompt 应包含以下要素，按重要性排列：

```
[主体描述] + [动作/运动] + [场景/环境] + [镜头语言] + [光线/色调] + [风格/质量修饰]
```

### 示例

```
❌ 差的 Prompt:
"一个女孩在雨中走路"

✅ 好的 Prompt:
"A young Asian woman with long black hair, wearing a black leather jacket, 
walking slowly through a neon-lit cyberpunk city street in heavy rain, 
medium tracking shot from the side, volumetric fog, blue and purple neon 
reflections on wet pavement, cinematic lighting, moody atmosphere, 
film grain, 4K, 16:9"
```

## Element Reference — 要素参考

### 主体描述

| 要素 | 示例关键词 |
|------|-----------|
| 人物外貌 | `young Asian woman`, `elderly man with gray beard`, `child with curly hair` |
| 服装 | `wearing black leather jacket`, `in white flowing dress`, `casual streetwear` |
| 表情 | `with a melancholic expression`, `smiling warmly`, `looking determined` |
| 姿态 | `standing tall`, `sitting cross-legged`, `leaning against wall` |

### 动作/运动

| 动作类型 | 示例关键词 |
|---------|-----------|
| 行走 | `walking slowly`, `striding confidently`, `wandering aimlessly` |
| 奔跑 | `running through`, `sprinting`, `jogging` |
| 静态 | `standing still`, `sitting quietly`, `lying down` |
| 手势 | `reaching out hand`, `turning around`, `looking up at sky` |
| 物体运动 | `leaves falling`, `water flowing`, `smoke rising` |

**注意：** AI 视频对复杂动作的支持有限。避免描述多步骤连续动作（如"她拿起杯子喝了一口然后放下"），拆分为多个镜头。

### 镜头语言

| 景别 | 关键词 |
|------|--------|
| 远景 | `wide shot`, `establishing shot`, `extreme wide shot` |
| 全景 | `full shot`, `full body shot` |
| 中景 | `medium shot`, `waist-up shot` |
| 近景 | `close-up`, `close-up shot` |
| 特写 | `extreme close-up`, `macro shot` |

| 运镜 | 关键词 |
|------|--------|
| 推进 | `camera slowly pushing forward`, `dolly in` |
| 拉远 | `camera pulling back`, `dolly out` |
| 横移 | `tracking shot`, `camera moving sideways` |
| 环绕 | `camera orbiting around subject`, `360 orbit` |
| 升降 | `crane shot rising`, `camera descending` |
| 手持 | `handheld camera`, `slight camera shake` |
| 静止 | `static camera`, `locked-off shot`, `tripod shot` |
| 航拍 | `aerial shot`, `drone footage`, `bird's eye view` |

### 光线

| 光线类型 | 关键词 |
|---------|--------|
| 自然光 | `natural lighting`, `golden hour`, `overcast soft light` |
| 人工光 | `neon lights`, `studio lighting`, `fluorescent light` |
| 逆光 | `backlit`, `silhouette`, `rim lighting` |
| 侧光 | `side lighting`, `dramatic shadows` |
| 顶光 | `overhead lighting`, `top-down light` |
| 低调 | `low-key lighting`, `dark moody`, `chiaroscuro` |
| 高调 | `high-key lighting`, `bright and airy` |

### 色调

| 色调 | 关键词 |
|------|--------|
| 暖色 | `warm tones`, `golden`, `amber`, `orange hues` |
| 冷色 | `cool tones`, `blue`, `teal`, `icy` |
| 高对比 | `high contrast`, `deep shadows`, `vivid colors` |
| 低对比 | `soft contrast`, `pastel`, `muted colors` |
| 单色 | `monochrome`, `black and white`, `sepia` |
| 赛博朋克 | `neon pink and blue`, `cyberpunk color palette` |
| 复古 | `vintage film look`, `faded colors`, `70s color grade` |

### 风格/质量修饰

| 修饰词 | 效果 |
|--------|------|
| `cinematic` | 电影感（最常用） |
| `photorealistic` | 照片级真实 |
| `4K` / `8K` | 高分辨率 |
| `film grain` | 胶片颗粒感 |
| `anamorphic lens` | 变形宽银幕镜头 |
| `shallow depth of field` | 浅景深/背景虚化 |
| `volumetric fog` | 体积雾 |
| `lens flare` | 镜头光晕 |
| `motion blur` | 运动模糊 |

## Model-Specific Tips — 模型特定技巧

### Sora 2 / Sora 2 Pro

- 擅长：复杂场景、多物体交互、物理模拟
- Prompt 风格：详细描述性，像写小说一样
- 建议加：`photorealistic, cinematic, high production value`

### Veo 3.1

- 擅长：高质量画面、光影效果
- Prompt 风格：简洁精确
- 固定 8 秒，不需要在 Prompt 中指定时长

### Seedance 2.0

- 擅长：人物动作、舞蹈
- Prompt 风格：强调动作描述
- 建议加：`smooth motion, natural movement`

### Kling 3.0

- 擅长：多镜头一致性、音频同步
- Prompt 风格：使用 `<<<image_1>>>` 模板引用参考图
- 多镜头模式下每个镜头的 Prompt 要独立完整

### Runway Gen-4.5

- 只支持 image_to_video
- Prompt 重点描述"运动"而非"画面"（画面由参考图决定）
- 建议加：`smooth camera movement, cinematic motion`

## Common Mistakes — 常见错误

| 错误 | 正确做法 |
|------|---------|
| 用中文写 Prompt | 始终用英文 |
| 描述过于简短 | 至少 30-50 个英文单词 |
| 描述复杂连续动作 | 拆分为多个镜头 |
| 忽略镜头语言 | 每个 Prompt 都指定景别和运镜 |
| 忽略光线描述 | 光线是画面质量的关键 |
| 角色描述不一致 | 使用固定的角色 Prompt 模板 |
| 堆砌过多修饰词 | 保持重点突出，不超过 100 词 |
| 使用否定描述 | 用肯定描述（"bright" 而非 "not dark"） |

## Prompt Template — Prompt 模板

### 通用场景

```
[Subject: detailed description of the main subject/character], 
[Action: what is happening, movement], 
[Setting: environment, location, time of day], 
[Camera: shot type, camera movement], 
[Lighting: light source, quality, direction], 
[Color: color palette, tone, grade], 
[Style: cinematic, photorealistic, etc.], 
[Technical: 4K, 16:9, film grain, etc.]
```

### MV 镜头

```
[Character description (copy from character profile)], 
[Action matching the lyrics/beat], 
[Setting matching the song's mood], 
[Camera movement matching the music energy], 
[Lighting matching the emotional tone], 
[Color palette consistent with overall MV style], 
cinematic music video, [aspect ratio]
```

### 产品广告

```
[Product description: name, appearance, key feature], 
[Presentation: how the product is shown/used], 
[Setting: clean studio / lifestyle context], 
[Camera: usually slow orbit or push-in], 
[Lighting: studio lighting, product photography style], 
premium commercial, high-end product photography, [aspect ratio]
```
