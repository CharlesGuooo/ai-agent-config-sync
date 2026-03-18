---
name: post-production
description: Post-production assembly rules - FFmpeg commands for joining, transitions, audio mixing
---

# Post-Production — 后期合成

## When to Load

当所有镜头都标记为 `approved` 后，进入后期合成阶段。

## Prerequisites

```bash
# FFmpeg 应已安装
ffmpeg -version

# 如未安装
sudo apt install -y ffmpeg
```

## Assembly Pipeline — 合成流水线

```
已确认的镜头片段
       │
       ▼
┌─────────────┐
│ 1. 格式统一   │  确保所有片段的编码、分辨率、帧率一致
└──────┬──────┘
       ▼
┌─────────────┐
│ 2. 转场处理   │  添加片段间的转场效果（可选）
└──────┬──────┘
       ▼
┌─────────────┐
│ 3. 拼接合并   │  将所有片段合并为一个视频
└──────┬──────┘
       ▼
┌─────────────┐
│ 4. 音频处理   │  叠加音乐、配音、音效
└──────┬──────┘
       ▼
┌─────────────┐
│ 5. 字幕叠加   │  添加字幕（可选）
└──────┬──────┘
       ▼
┌─────────────┐
│ 6. 最终输出   │  编码输出最终文件
└─────────────┘
```

## Step 1: Format Normalization — 格式统一

不同模型生成的视频可能有不同的编码参数，拼接前必须统一：

```bash
# 检查视频参数
ffprobe -v quiet -print_format json -show_streams shots/shot-01.mp4

# 统一为 1920x1080, 30fps, H.264, AAC
for f in shots/shot-*.mp4; do
  output="${f%.mp4}_normalized.mp4"
  ffmpeg -y -hide_banner -i "$f" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
    -r 30 -c:v libx264 -preset medium -crf 18 \
    -c:a aac -b:a 192k -ar 44100 \
    -pix_fmt yuv420p \
    "$output"
done
```

**竖版视频（9:16）：**
```bash
# 统一为 1080x1920
-vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2"
```

## Step 2: Transitions — 转场效果

### 无转场（硬切）

最简单，直接拼接：

```bash
# 创建文件列表
for f in shots/shot-*_normalized.mp4; do
  echo "file '$f'" >> filelist.txt
done

ffmpeg -y -hide_banner -f concat -safe 0 -i filelist.txt -c copy output/joined.mp4
```

### 交叉淡入淡出（Crossfade）

```bash
# 两个片段之间 0.5 秒淡入淡出
ffmpeg -y -hide_banner \
  -i shots/shot-01_normalized.mp4 \
  -i shots/shot-02_normalized.mp4 \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=4.5[v]; \
                    [0:a][1:a]acrossfade=d=0.5[a]" \
  -map "[v]" -map "[a]" \
  output/transition_01_02.mp4
```

**offset = 第一个片段时长 - 转场时长**

### 多片段链式转场

```bash
# 3 个片段的链式淡入淡出
ffmpeg -y -hide_banner \
  -i shot01.mp4 -i shot02.mp4 -i shot03.mp4 \
  -filter_complex "\
    [0:v][1:v]xfade=transition=fade:duration=0.5:offset=4.5[v01]; \
    [v01][2:v]xfade=transition=fade:duration=0.5:offset=9.0[v]" \
  -map "[v]" output/chained.mp4
```

### 可用转场类型

| 转场 | 效果 | 适用场景 |
|------|------|---------|
| `fade` | 淡入淡出 | 通用，最安全 |
| `dissolve` | 溶解 | 梦幻、回忆 |
| `wipeleft` | 左擦除 | 时间推进 |
| `wiperight` | 右擦除 | 时间推进 |
| `slidedown` | 下滑 | 场景切换 |
| `slideup` | 上滑 | 场景切换 |
| `circleopen` | 圆形展开 | 戏剧性揭示 |
| `circleclose` | 圆形收缩 | 聚焦 |
| `smoothleft` | 平滑左移 | 现代感 |
| `smoothright` | 平滑右移 | 现代感 |

## Step 3: Audio Mixing — 音频处理

### 叠加背景音乐

```bash
# 视频 + 音乐（音乐自动截断到视频长度）
ffmpeg -y -hide_banner \
  -i output/joined.mp4 \
  -i audio/music.mp3 \
  -c:v copy -c:a aac -b:a 192k \
  -map 0:v:0 -map 1:a:0 \
  -shortest \
  output/with_music.mp4
```

### 音乐淡入淡出

```bash
# 音乐开头淡入 2 秒，结尾淡出 3 秒
ffmpeg -y -hide_banner \
  -i output/joined.mp4 \
  -i audio/music.mp3 \
  -filter_complex "[1:a]afade=t=in:st=0:d=2,afade=t=out:st=222:d=3[a]" \
  -map 0:v -map "[a]" \
  -c:v copy -c:a aac \
  -shortest \
  output/with_music_fade.mp4
```

### 音乐 + 旁白混合

```bash
# 音乐降到 30% 音量，旁白保持 100%
ffmpeg -y -hide_banner \
  -i output/joined.mp4 \
  -i audio/music.mp3 \
  -i audio/voiceover.mp3 \
  -filter_complex "\
    [1:a]volume=0.3[music]; \
    [2:a]volume=1.0[voice]; \
    [music][voice]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" \
  -c:v copy -c:a aac \
  output/final_mixed.mp4
```

### 音乐精确对齐

如果需要音乐从特定时间点开始：

```bash
# 音乐从第 2 秒开始（前 2 秒静音）
ffmpeg -y -hide_banner \
  -i output/joined.mp4 \
  -i audio/music.mp3 \
  -filter_complex "[1:a]adelay=2000|2000[a]" \
  -map 0:v -map "[a]" \
  -c:v copy -c:a aac \
  -shortest \
  output/with_music_delayed.mp4
```

## Step 4: Subtitles — 字幕叠加（可选）

### SRT 字幕文件格式

```srt
1
00:00:15,500 --> 00:00:18,200
第一句歌词

2
00:00:18,500 --> 00:00:21,000
第二句歌词
```

### 烧录字幕（硬字幕）

```bash
ffmpeg -y -hide_banner \
  -i output/with_music.mp4 \
  -vf "subtitles=subs.srt:force_style='FontName=Noto Sans CJK SC,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Alignment=2'" \
  -c:v libx264 -crf 18 -c:a copy \
  output/final_with_subs.mp4
```

### 字幕样式参考

| 风格 | force_style 参数 |
|------|-----------------|
| 白字黑边（通用） | `FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2` |
| 黄字（经典） | `FontSize=24,PrimaryColour=&H0000FFFF,OutlineColour=&H00000000,Outline=2` |
| 大字居中（MV） | `FontSize=36,Alignment=10,Bold=1` |
| 底部小字 | `FontSize=18,Alignment=2,MarginV=30` |

## Step 5: Final Output — 最终输出

### 标准输出

```bash
# H.264 + AAC，高质量
ffmpeg -y -hide_banner \
  -i output/final_mixed.mp4 \
  -c:v libx264 -preset slow -crf 18 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  output/final.mp4
```

### 平台特定输出

| 平台 | 分辨率 | 画幅 | 码率建议 | 命令参数 |
|------|--------|------|---------|---------|
| YouTube | 1920x1080 | 16:9 | 8-12 Mbps | `-b:v 10M` |
| 抖音/TikTok | 1080x1920 | 9:16 | 4-8 Mbps | `-b:v 6M` |
| Instagram Reels | 1080x1920 | 9:16 | 3.5 Mbps | `-b:v 3500k` |
| 微信视频号 | 1080x1920 | 9:16 | 4-6 Mbps | `-b:v 5M` |
| B站 | 1920x1080 | 16:9 | 6-10 Mbps | `-b:v 8M` |

## Quality Checklist — 质量检查清单

最终输出前，检查以下项目：

```markdown
## 最终检查

- [ ] 所有镜头顺序正确
- [ ] 转场效果流畅，无黑帧
- [ ] 音乐与画面同步（尤其是节拍点）
- [ ] 音量平衡（音乐不盖过旁白）
- [ ] 字幕时间对齐（如有）
- [ ] 开头和结尾处理（淡入/淡出）
- [ ] 输出文件可正常播放
- [ ] 文件大小合理（不超过平台限制）
```
