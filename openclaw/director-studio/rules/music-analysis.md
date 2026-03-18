---
name: music-analysis
description: Music analysis rules - extracting structure, tempo, mood, and lyrics from audio files
---

# Music Analysis — 音乐分析

## When to Load

当用户提供了音乐文件（MP3、WAV、FLAC、M4A）时加载本规则。

## Dependencies

```bash
pip install librosa soundfile numpy matplotlib
```

如需歌词提取：
```bash
pip install openai-whisper
# 或使用 manus-speech-to-text 工具
```

## Analysis Pipeline

### Step 1: Basic Audio Info — 基础信息

```python
import librosa
import numpy as np

# 加载音频
y, sr = librosa.load("audio/music.mp3", sr=22050)
duration = librosa.get_duration(y=y, sr=sr)

print(f"时长: {int(duration//60)}分{int(duration%60)}秒")
print(f"采样率: {sr} Hz")
```

### Step 2: Tempo & Beat Detection — 节拍检测

```python
# BPM 检测
tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
beat_times = librosa.frames_to_time(beat_frames, sr=sr)

print(f"BPM: {tempo:.0f}")
print(f"节拍数: {len(beat_times)}")
print(f"平均节拍间隔: {np.mean(np.diff(beat_times)):.3f}秒")
```

### Step 3: Structure Segmentation — 结构分段

```python
# 使用 MFCC 特征进行结构分段
mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
boundaries = librosa.segment.agglomerative(mfcc, k=8)
boundary_times = librosa.frames_to_time(boundaries, sr=sr)

# 计算每段的能量
segments = []
for i in range(len(boundary_times)):
    start = boundary_times[i]
    end = boundary_times[i+1] if i+1 < len(boundary_times) else duration
    
    start_sample = int(start * sr)
    end_sample = int(end * sr)
    segment_energy = np.mean(np.abs(y[start_sample:end_sample]))
    
    segments.append({
        "index": i+1,
        "start": round(start, 1),
        "end": round(end, 1),
        "duration": round(end - start, 1),
        "energy": round(float(segment_energy), 4)
    })
```

### Step 4: Energy Curve — 能量曲线

```python
# 计算 RMS 能量曲线
rms = librosa.feature.rms(y=y)[0]
rms_times = librosa.frames_to_time(np.arange(len(rms)), sr=sr)

# 平滑处理
from scipy.ndimage import uniform_filter1d
rms_smooth = uniform_filter1d(rms, size=50)

# 找到高潮点（能量最高的区域）
climax_frame = np.argmax(rms_smooth)
climax_time = rms_times[climax_frame]
print(f"高潮时间点: {int(climax_time//60)}:{int(climax_time%60):02d}")
```

### Step 5: Mood Classification — 情绪分类

基于音频特征推断情绪：

```python
# 提取特征
spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))
zero_crossing_rate = np.mean(librosa.feature.zero_crossing_rate(y))
chroma = librosa.feature.chroma_stft(y=y, sr=sr)

# 大调/小调倾向（简化判断）
major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

chroma_mean = np.mean(chroma, axis=1)
major_corr = np.corrcoef(chroma_mean, major_profile)[0, 1]
minor_corr = np.corrcoef(chroma_mean, minor_profile)[0, 1]

tonality = "大调（明亮）" if major_corr > minor_corr else "小调（忧郁）"
```

### Step 6: Lyrics Extraction — 歌词提取（可选）

```bash
# 使用 manus-speech-to-text
manus-speech-to-text audio/music.mp3
```

或使用 Whisper：

```python
import whisper

model = whisper.load_model("base")
result = model.transcribe("audio/music.mp3", language="zh")

# 带时间戳的歌词
for segment in result["segments"]:
    start = segment["start"]
    end = segment["end"]
    text = segment["text"]
    print(f"[{start:.1f}-{end:.1f}] {text}")
```

## Output Format — 输出格式

将分析结果保存为 `audio/analysis.json`：

```json
{
  "file": "audio/music.mp3",
  "duration": 225.3,
  "duration_display": "3分45秒",
  "bpm": 120,
  "tonality": "小调",
  "climax_time": 135.2,
  "energy_profile": "渐进式（安静→高潮→收束）",
  "structure": [
    {"label": "intro", "start": 0, "end": 15.2, "energy": "low", "mood": "神秘"},
    {"label": "verse1", "start": 15.2, "end": 45.8, "energy": "medium", "mood": "叙述"},
    {"label": "chorus1", "start": 45.8, "end": 76.3, "energy": "high", "mood": "释放"},
    {"label": "verse2", "start": 76.3, "end": 106.5, "energy": "medium", "mood": "深入"},
    {"label": "chorus2", "start": 106.5, "end": 137.0, "energy": "very_high", "mood": "高潮"},
    {"label": "bridge", "start": 137.0, "end": 167.5, "energy": "medium", "mood": "转折"},
    {"label": "outro", "start": 167.5, "end": 225.3, "energy": "low", "mood": "余韵"}
  ],
  "beat_times": [0.5, 1.0, 1.5, "..."],
  "lyrics": [
    {"start": 15.5, "end": 18.2, "text": "第一句歌词"},
    {"start": 18.5, "end": 21.0, "text": "第二句歌词"}
  ]
}
```

## Segment Labeling Heuristics — 段落标注启发式规则

自动标注无法完美识别"主歌"和"副歌"，使用以下启发式规则：

| 特征 | 前奏/尾奏 | 主歌 | 副歌 | 桥段 |
|------|---------|------|------|------|
| 能量 | 低 | 中 | 高 | 中低 |
| 人声 | 无/少 | 有 | 有（更强） | 有（变化） |
| 重复性 | 低 | 中 | 高（旋律重复） | 低（新旋律） |
| 位置 | 首/尾 | 副歌前 | 主歌后 | 第二副歌后 |

**规则：** 自动标注的结果应在 Phase 1 中展示给用户确认，用户可能更了解歌曲结构。

## Visual Mapping — 视觉映射建议

基于音乐分析结果，自动生成视觉映射建议：

| 音乐特征 | 视觉建议 |
|---------|---------|
| 低能量段落 | 远景、慢运镜、冷色调、安静画面 |
| 高能量段落 | 近景、快切、暖色/高对比、动态画面 |
| 节拍加速 | 缩短镜头时长、增加剪辑频率 |
| 节拍减速 | 延长镜头时长、使用长镜头 |
| 大调/明亮 | 暖色调、明亮光线、开阔空间 |
| 小调/忧郁 | 冷色调、阴影、封闭空间 |
| 高潮点 | 最强视觉冲击、最重要的叙事转折 |
| 歌词意象 | 直接或隐喻地视觉化歌词内容 |
