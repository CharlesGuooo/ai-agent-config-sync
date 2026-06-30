#!/usr/bin/env python3
"""Heuristic terminology/acronym/variant consistency scan for a manuscript.

Stdlib only. Surfaces candidates — the author decides. Works on .tex/.md/.txt
files or a directory of them.

Usage:
    python scan.py paper.tex
    python scan.py ./paper_dir
"""
import os
import re
import sys
from collections import defaultdict, Counter

# Acronyms: 2+ chars, contains an uppercase letter, may start with a digit
# (e.g. NPU, 3DGS, BEV, ICML). Used for "is this an acronym token".
ACR_RE = re.compile(r"\b([A-Za-z0-9]*[A-Z][A-Za-z0-9]*)\b")
# "Capitalized Phrase (ACR)" definitions: >=2 words on one line (no newline/period
# crossing), acronym 2-10 upper/digit chars.
DEF_RE = re.compile(
    r"([A-Z0-9][\w'’\-]*(?:[ \t]+[A-Za-z0-9][\w'’\-]*){1,6})[ \t]*\(([A-Z0-9]{2,10})\)")
# Single hyphenated token (no spaces); must contain a letter; may start with a digit.
WORD_RE = re.compile(r"[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*")

COMMON = {
    "AI", "ML", "DL", "RL", "NLP", "CV", "GPU", "CPU", "API", "SOTA", "MLP", "CNN",
    "RNN", "LSTM", "GAN", "VAE", "LLM", "RAG", "OK", "ID", "IO", "OS", "PDF", "URL",
    "USA", "UK", "EU", "FAQ", "II", "III", "IV", "3D", "2D", "1D",
}


def gather(paths):
    files = []
    for p in paths:
        p = os.path.expanduser(p)
        if os.path.isdir(p):
            for dp, _, fns in os.walk(p):
                for fn in fns:
                    if fn.lower().endswith((".tex", ".md", ".txt")):
                        files.append(os.path.join(dp, fn))
        elif os.path.isfile(p):
            files.append(p)
    return files


def strip_tex(text):
    text = re.sub(r"%.*", "", text)
    text = re.sub(r"\\(cite|ref|label|eqref)\{[^}]*\}", " ", text)
    text = re.sub(r"\$[^$]*\$", " ", text)
    return text


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: scan.py <file-or-dir> [...]")
    files = gather(sys.argv[1:])
    if not files:
        sys.exit("no .tex/.md/.txt files found")

    parts = []
    for f in files:
        try:
            t = open(f, encoding="utf-8", errors="ignore").read()
        except Exception:
            continue
        parts.append(strip_tex(t) if f.lower().endswith(".tex") else t)
    text = "\n".join(parts)

    # --- acronym definitions (permissive: any "Phrase (ACR)") ---
    defs = defaultdict(set)
    def_pos = {}
    for m in DEF_RE.finditer(text):
        expansion, acr = m.group(1).strip(), m.group(2)
        defs[acr].add(expansion)
        def_pos.setdefault(acr, m.start())

    # --- acronym usages ---
    uses = Counter()
    first_use = {}
    for m in ACR_RE.finditer(text):
        a = m.group(1)
        # acronym-like = >=2 uppercase letters (rejects Title-case words like "We", "The")
        if len(re.findall(r"[A-Z]", a)) < 2:
            continue
        uses[a] += 1
        first_use.setdefault(a, m.start())

    print("=== Acronym ledger ===")
    for a in sorted(uses, key=lambda x: -uses[x]):
        if uses[a] < 2 and a not in defs:
            continue
        exp = " | ".join(sorted(defs.get(a, []))) or "(no definition found)"
        print(f"  {a:10} x{uses[a]:<3}  {exp}")

    flags = []
    for a, exps in defs.items():
        if len(exps) > 1:
            flags.append(f"[multi-def]  {a} defined {len(exps)} ways: {' / '.join(sorted(exps))}")
    for a in uses:
        if a in defs:
            if first_use.get(a, 0) < def_pos.get(a, 0):
                flags.append(f"[used-before-def]  {a} appears before its 'Full Name ({a})' definition")
        elif a.upper() not in COMMON and uses[a] >= 3:
            flags.append(f"[undefined]  {a} used {uses[a]}x, never defined as 'Full Name ({a})'")

    # --- surface variants: same form modulo hyphens, different surface spellings ---
    surface = defaultdict(Counter)
    for m in WORD_RE.finditer(text):
        w = m.group(0)
        if len(w) < 4:
            continue
        norm = w.replace("-", "").lower()
        surface[norm][w] += 1
    for norm, variants in surface.items():
        if len(variants) > 1 and sum(variants.values()) >= 3 and len({v.lower() for v in variants}) > 1:
            shown = ", ".join(f"{f}({variants[f]})" for f in sorted(variants, key=lambda x: -variants[x]))
            flags.append(f"[variant]  {shown}  -> pick one canonical form")

    print("\n=== Flags ===")
    if flags:
        for fl in sorted(flags):
            print("  " + fl)
    else:
        print("  none — terminology looks consistent (heuristic).")
    print("\nHeuristic only: verify before mass-replacing; keep genuinely distinct terms distinct.")


if __name__ == "__main__":
    main()
