"""Clean up the audio of a phone-recorded video (or bare audio file).

analyze <input>              -> measurements + suggested settings
run <input> [options]        -> processed file next to the input

Video is always stream-copied; only audio is touched. Input is never modified.
"""
import argparse
import json
import os
import re
import subprocess
import sys

NULL = "NUL" if os.name == "nt" else "/dev/null"


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")


def probe(path):
    r = run(["ffprobe", "-v", "error", "-print_format", "json",
             "-show_format", "-show_streams", path])
    if r.returncode:
        sys.exit(f"ffprobe failed:\n{r.stderr}")
    info = json.loads(r.stdout)
    audio = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    if audio is None:
        sys.exit("This file has no audio stream — nothing to clean.")
    video = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    return info, audio, video


def measure(path):
    """Loudness + level statistics of the untouched audio."""
    r = run(["ffmpeg", "-hide_banner", "-i", path, "-map", "0:a:0",
             "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
             "-f", "null", NULL])
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S)
    loud = json.loads(m.group(0)) if m else {}

    r = run(["ffmpeg", "-hide_banner", "-i", path, "-map", "0:a:0",
             "-af", "astats=measure_perchannel=none", "-f", "null", NULL])
    stats = {}
    for key in ("RMS level dB", "Peak level dB", "Noise floor dB", "Flat factor"):
        mm = re.search(rf"{re.escape(key)}:\s*(-?[\d.]+|inf|nan)", r.stderr)
        if mm:
            try:
                stats[key] = float(mm.group(1))
            except ValueError:
                pass
    if "Peak level dB" in stats and "RMS level dB" in stats:
        stats["Crest dB"] = stats["Peak level dB"] - stats["RMS level dB"]
    return loud, stats


def fnum(v, unit="", nd=1):
    return f"{v:.{nd}f}{unit}" if isinstance(v, (int, float)) else "n/a"


def suggest(loud, stats):
    nf = stats.get("Noise floor dB")
    try:
        tp = float(loud.get("input_tp", "nan"))
    except (TypeError, ValueError):
        tp = float("nan")
    try:
        lra = float(loud.get("input_lra", "nan"))
    except (TypeError, ValueError):
        lra = float("nan")

    if nf is None:
        denoise = "light"
    elif nf > -50:
        denoise = "strong"
    elif nf > -60:
        denoise = "light"
    else:
        denoise = "off"

    parts = [f"--preset minimal", f"--denoise {denoise}"]
    if tp == tp and tp >= -0.2:
        parts.append("--declip")
    notes = ["minimal preset = loudness only, tone untouched (the safe default). "
             "Use --preset speech/music only when you actively want EQ/compression"]
    if tp == tp and tp >= -0.2:
        notes.append("true peak at ceiling — the phone probably clipped, --declip added")
    if lra == lra and lra > 15:
        notes.append("wide loudness range — volume swings a lot, compression will help")
    return " ".join(parts), notes


def cmd_analyze(args):
    info, audio, video = probe(args.input)
    loud, stats = measure(args.input)
    dur = float(info["format"].get("duration", 0))

    print(f"file            {os.path.basename(args.input)}")
    print(f"duration        {int(dur // 60)}m{dur % 60:04.1f}s")
    print(f"audio           {audio['codec_name']}  {audio.get('sample_rate')} Hz  "
          f"{audio.get('channels')} ch")
    if video:
        print(f"video           {video['codec_name']}  "
              f"{video.get('width')}x{video.get('height')}  (will be copied as-is)")
    print()
    print(f"integrated      {loud.get('input_i', 'n/a')} LUFS")
    print(f"true peak       {loud.get('input_tp', 'n/a')} dBTP")
    print(f"loudness range  {loud.get('input_lra', 'n/a')} LU")
    print(f"RMS level       {fnum(stats.get('RMS level dB'), ' dB')}")
    print(f"noise floor     {fnum(stats.get('Noise floor dB'), ' dB')}")
    print(f"crest           {fnum(stats.get('Crest dB'), ' dB')}  (peak minus RMS)")
    print()
    sug, notes = suggest(loud, stats)
    print(f"suggested       {sug}")
    for n in notes:
        print(f"note            {n}")


DENOISE = {
    "off": None,
    "light": {"speech": "afftdn=nr=10:nf=-32:tn=1", "music": "afftdn=nr=5:nf=-42:tn=1"},
    "strong": {"speech": "afftdn=nr=20:nf=-25:tn=1", "music": "afftdn=nr=10:nf=-35:tn=1"},
}

TONE = {
    # minimal = loudness only. No EQ, no compression — the safe default for
    # phone recordings, which are usually fine tonally and only need loudness.
    "minimal": [],
    "speech": [
        "highpass=f=85",
        "equalizer=f=300:t=q:w=1.2:g=-3",     # cut boxiness
        "equalizer=f=3200:t=q:w=1.0:g=1.5",   # presence — was 3, boosted sibilance
        "highshelf=f=8000:g=1",               # air — was 2, pushed sibilance further
        "deesser=i=0.4",
        "acompressor=threshold=-18dB:ratio=3:attack=15:release=180:makeup=2",
    ],
    "music": [
        "highpass=f=60",
        "equalizer=f=250:t=q:w=1.0:g=-2",
        "equalizer=f=4000:t=q:w=1.2:g=2",
        "highshelf=f=10000:g=1.5",
        "acompressor=threshold=-16dB:ratio=2:attack=25:release=250:makeup=1",
    ],
}


def build_chain(args, loudnorm):
    chain = []
    if args.declip:
        chain.append("adeclip")
    nd = DENOISE[args.denoise]
    if nd:
        # minimal has no dedicated denoise strength — fall back to speech's
        chain.append(nd.get(args.preset, nd["speech"]))
    chain += TONE[args.preset]
    chain.append(loudnorm)
    chain.append("alimiter=limit=0.97")
    chain.append("aresample=48000")
    return ",".join(chain)


def cmd_run(args):
    info, audio, video = probe(args.input)
    before_loud, before_stats = measure(args.input)

    root, ext = os.path.splitext(args.input)
    if args.audio_only:
        out = args.out or root + "_cleaned.wav"
    else:
        out = args.out or root + "_cleaned" + (ext if video else ".m4a")
    if os.path.abspath(out) == os.path.abspath(args.input):
        sys.exit("Output would overwrite the input — pass a different --out.")

    tp = -1.5 if args.preset == "speech" else -1.0

    # pass 1: measure the chain's own output so loudnorm can correct exactly
    probe_ln = f"loudnorm=I={args.target}:TP={tp}:LRA=11:print_format=json"
    print("pass 1/2  measuring...")
    r = run(["ffmpeg", "-hide_banner", "-i", args.input, "-map", "0:a:0",
             "-af", build_chain(args, probe_ln), "-f", "null", NULL])
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S)
    if not m:
        sys.exit(f"loudnorm measurement failed:\n{r.stderr[-3000:]}")
    p1 = json.loads(m.group(0))

    final_ln = (f"loudnorm=I={args.target}:TP={tp}:LRA=11"
                f":measured_I={p1['input_i']}:measured_TP={p1['input_tp']}"
                f":measured_LRA={p1['input_lra']}:measured_thresh={p1['input_thresh']}"
                f":offset={p1['target_offset']}:linear=true")

    cmd = ["ffmpeg", "-hide_banner", "-y", "-i", args.input,
           "-af", build_chain(args, final_ln)]
    if args.audio_only or not video:
        # bare-audio input: match the codec to the output extension, otherwise
        # AAC written into a .wav container plays back as silence
        want_pcm = args.audio_only or out.lower().endswith(".wav")
        cmd += ["-map", "0:a:0", "-c:a", "pcm_s24le" if want_pcm else "aac"]
        if not want_pcm:
            cmd += ["-b:a", "192k"]
    else:
        cmd += ["-map", "0:v:0", "-map", "0:a:0",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"]
    cmd.append(out)

    print("pass 2/2  processing...")
    r = run(cmd)
    if r.returncode or not os.path.exists(out):
        sys.exit(f"ffmpeg failed:\n{r.stderr[-3000:]}")

    after_loud, after_stats = measure(out)
    print(f"\nwrote  {out}  ({os.path.getsize(out) / 1e6:.1f} MB)")
    print(f"chain  {args.preset} preset, denoise={args.denoise}"
          f"{', declip' if args.declip else ''}\n")
    def snr(st):
        """Noise floor relative to signal RMS — unaffected by the overall gain change,
        unlike the absolute noise floor, so it is the only fair before/after read."""
        if "Noise floor dB" in st and "RMS level dB" in st:
            return round(st["RMS level dB"] - st["Noise floor dB"], 1)
        return None

    rows = [
        ("integrated LUFS", before_loud.get("input_i"), after_loud.get("input_i"),
         f"target {args.target}"),
        ("true peak dBTP", before_loud.get("input_tp"), after_loud.get("input_tp"),
         f"ceiling {tp}"),
        ("loudness range LU", before_loud.get("input_lra"), after_loud.get("input_lra"), ""),
        ("signal - noise dB", snr(before_stats), snr(after_stats), "higher is cleaner"),
    ]
    print(f"{'':<20}{'before':>10}{'after':>10}   note")
    for name, b, a, note in rows:
        print(f"{name:<20}{str(b):>10}{str(a):>10}   {note}")

    try:
        miss = abs(float(after_loud["input_i"]) - args.target)
        if miss > 1.0:
            print(f"\nWARNING: loudness target missed by {miss:.1f} LU.")
    except (KeyError, TypeError, ValueError):
        pass
    print("\nListen to it. If it sounds hollow or watery, re-run one denoise step lower.")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("analyze")
    a.add_argument("input")
    a.set_defaults(func=cmd_analyze)

    p = sub.add_parser("run")
    p.add_argument("input")
    p.add_argument("--preset", choices=["speech", "music", "minimal"], default="minimal")
    p.add_argument("--denoise", choices=["off", "light", "strong"], default="light")
    p.add_argument("--target", type=float, default=-14.0)
    p.add_argument("--declip", action="store_true")
    p.add_argument("--audio-only", action="store_true")
    p.add_argument("--out")
    p.set_defaults(func=cmd_run)

    args = ap.parse_args()
    if not os.path.exists(args.input):
        sys.exit(f"No such file: {args.input}")
    args.func(args)


if __name__ == "__main__":
    main()
