#!/usr/bin/env python3
"""BM25 lexical search over a paper-library markdown corpus. Pure stdlib — no deps,
no API key, no vector DB. Ranks whole papers and returns the best passages from each.

The agent should pass an EXPANDED query (several keyword variants / synonyms /
notation forms) to cover BM25's synonym weakness, e.g.:
    python search.py "kernel fusion operator fusion fused kernels op fusion" --corpus ~/papers/.corpus

Usage:
    python search.py "<query terms>" --corpus <corpus-dir> [--top 6] [--snippets 3]
"""
import argparse
import glob
import json
import math
import os
import re
from collections import Counter

TOKEN_RE = re.compile(r"[a-z0-9]+(?:[-_][a-z0-9]+)*")


def tokenize(text):
    return TOKEN_RE.findall(text.lower())


def load_corpus(corpus_dir):
    """Return list of dicts: {path, title, text}. Uses corpus_index.jsonl for titles
    when present, else falls back to every *.md in the dir."""
    titles = {}
    idx = os.path.join(corpus_dir, "corpus_index.jsonl")
    if os.path.exists(idx):
        with open(idx, encoding="utf-8") as fh:
            for line in fh:
                try:
                    r = json.loads(line)
                    titles[os.path.abspath(r.get("markdown", ""))] = r.get("title", "")
                except Exception:
                    pass
    docs = []
    for p in sorted(glob.glob(os.path.join(corpus_dir, "*.md"))):
        ap = os.path.abspath(p)
        try:
            text = open(p, encoding="utf-8", errors="ignore").read()
        except Exception:
            continue
        docs.append({"path": p, "title": titles.get(ap) or os.path.basename(p), "text": text})
    return docs


def bm25_rank(docs, query_terms, k1=1.5, b=0.75):
    toks = [tokenize(d["text"]) for d in docs]
    N = len(docs)
    if N == 0:
        return []
    lengths = [len(t) for t in toks]
    avgdl = (sum(lengths) / N) or 1.0
    tfs = [Counter(t) for t in toks]
    df = Counter()
    for t in tfs:
        for term in t:
            df[term] += 1
    q = [w for w in query_terms if w]
    scores = []
    for i, tf in enumerate(tfs):
        s = 0.0
        for term in q:
            if term not in tf:
                continue
            idf = math.log(1 + (N - df[term] + 0.5) / (df[term] + 0.5))
            freq = tf[term]
            s += idf * (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * lengths[i] / avgdl))
        scores.append(s)
    order = sorted(range(N), key=lambda i: scores[i], reverse=True)
    return [(docs[i], scores[i]) for i in order if scores[i] > 0]


def best_snippets(text, query_terms, n=3, width=240):
    qset = set(query_terms)
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    scored = []
    for p in paras:
        pt = Counter(tokenize(p))
        hit = sum(pt[t] for t in qset)
        if hit:
            scored.append((hit, p))
    scored.sort(key=lambda x: x[0], reverse=True)
    out = []
    for _, p in scored[:n]:
        s = re.sub(r"\s+", " ", p)
        out.append(s[:width] + ("..." if len(s) > width else ""))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("--corpus", required=True)
    ap.add_argument("--top", type=int, default=6)
    ap.add_argument("--snippets", type=int, default=3)
    args = ap.parse_args()

    corpus = os.path.expanduser(args.corpus)
    docs = load_corpus(corpus)
    if not docs:
        print(f"no markdown corpus found in {corpus}. Run ingest.py first.")
        return
    qterms = tokenize(args.query)
    ranked = bm25_rank(docs, qterms)[: args.top]
    if not ranked:
        print("no matches. Try more / different keyword variants.")
        return
    print(f"top {len(ranked)} of {len(docs)} papers for: {qterms}\n")
    for rank, (d, score) in enumerate(ranked, 1):
        print(f"{rank}. [{score:.2f}] {d['title']}")
        print(f"   {d['path']}")
        for sn in best_snippets(d["text"], qterms, args.snippets):
            print(f"     - {sn}")
        print()
    print("Next: Read the full .md of the top papers into context to answer (don't rely on snippets).")


if __name__ == "__main__":
    main()
