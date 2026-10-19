---
name: video-audio-cleanup
description: Clean up and improve the audio of a phone-recorded video or audio file — remove hiss/rumble/handling noise, fix a thin or boxy mic sound, even out volume, and normalise loudness to a platform target, then mux back into the original video without re-encoding it. Use when the user has a video or recording that "sounds bad", "sounds muffled", "is too quiet", "has background noise", or asks to make a recording sound better / 更好听 / 降噪 / 调音.
allowed-tools: Read, Bash, Glob
compatibility: "local-tools — needs ffmpeg, ffprobe and Python 3 on PATH"
---

# Video audio cleanup

Turns a raw phone recording into something that sounds intentional. Video stream is
always stream-copied — only the audio is touched.

## Requirements

`ffmpeg` and `ffprobe` on PATH (verified with ffmpeg 8.0),
and `python`.

## Workflow

**Always analyse before processing.** The measurements decide the preset and the
denoise strength — do not guess.

### 1. Analyse

```bash
python <skill-dir>/scripts/clean_audio.py analyze "<input>"
```

Reports duration, codec, integrated loudness (LUFS), true peak, LRA, RMS, noise
floor and crest factor, plus a `suggested` line.

Read the numbers like this:

| Measurement | Meaning | Action |
| --- | --- | --- |
| noise floor > -50 dB | audible hiss / room tone / aircon | `--denoise strong` |
| noise floor -60..-50 dB | mild noise | `--denoise light` (default) |
| noise floor < -60 dB | already clean | `--denoise off` |
| true peak >= -0.2 dBTP | likely clipped by the phone | add `--declip` |
| integrated LUFS < -25 | recorded way too quiet | normal, loudnorm fixes it |
| LRA > 15 | volume swings a lot | preset `speech` (more compression) |
| crest factor > 18 | dynamic, probably music | preset `music` |

### 2. Pick a preset

**Default is `minimal` — loudness only, tone untouched.** This is the safe choice
for phone recordings: it cannot make the voice sound worse (no EQ, no compression).

- `minimal` — (default) two-pass loudnorm to the target + true-peak limiter. No tonal change.
- `speech` — talking, vlog, interview, tutorial. Tonal: high-pass at 85 Hz,
  de-mud at 300 Hz, gentle presence lift at 3.2 kHz, de-esser, 3:1 compression.
- `music` — singing, guitar, instrument performance. Gentle: high-pass at 60 Hz,
  light tone shaping, 2:1 compression, no de-esser, weaker denoise (FFT denoise
  eats reverb tails and cymbals).

Only reach for `speech`/`music` when you actively want the sound reshaped. If a
`speech` run comes back sibilant / harsh (齿音重), the tone chain is the cause —
re-run with `minimal`.

### 3. Process

```bash
python <skill-dir>/scripts/clean_audio.py run "<input>" \
  --preset speech --denoise light --target -14
```

Options:

- `--preset speech|music|minimal` (default `minimal`)
- `--denoise off|light|strong` (default `light`)
- `--target <LUFS>` — `-14` YouTube/Spotify (default), `-16` podcast/Apple,
  `-19` quiet listening
- `--declip` — repair clipping before anything else; only use if true peak said so
- `--audio-only` — write a WAV instead of muxing back into the video
- `--out <path>` — default is `<input>_cleaned.<ext>` next to the input

The script runs a two-pass `loudnorm` (measure, then correct), so the loudness
target is actually hit rather than approximated.

### 4. Verify and report

The script prints a before/after table. **Always show it to the user**, and state
plainly if a target was missed. Then tell the user to listen — the numbers cannot
tell you whether it sounds good.

If the result sounds over-processed (hollow, watery, "underwater"), the cause is
almost always denoise being too strong. Re-run one step down.

## Notes

- The input file is never modified.
- Audio is re-encoded to AAC 192 kbps; video is copied bit-for-bit, so there is no
  quality loss on the picture and processing is fast.
- Denoising cannot recover what the mic did not capture. Wind noise, heavy clipping
  and a room with bad reverb are not fixable here — say so rather than pretending.
