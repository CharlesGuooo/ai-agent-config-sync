#!/usr/bin/env python3
"""OPTIONAL semantic re-ranker for paper-library. Off by default — only useful for
fuzzy conceptual queries where BM25 keyword variants (search.py) fail.

Local embeddings via sentence-transformers (no API key). If the package is not
installed, this prints a one-line note and exits 0 (it is strictly optional).

Usage:
    python embed_index.py build --corpus <corpus-dir> [--model all-MiniLM-L6-v2]
    python embed_index.py query "<question>" --corpus <corpus-dir> [--top 6]
"""
import argparse
import glob
import json
import os
import sys


def _have_st():
    try:
        import sentence_transformers  # noqa: F401
        import numpy  # noqa: F401
        return True
    except Exception:
        sys.stderr.write(
            "paper-library: optional semantic layer needs sentence-transformers + numpy.\n"
            "  (skip it and use search.py BM25, or install:  pip install sentence-transformers numpy)\n"
        )
        return False


def _chunks(text, size=1200, overlap=200):
    out, i = [], 0
    while i < len(text):
        out.append(text[i:i + size])
        i += size - overlap
    return out


def build(corpus, model_name):
    import numpy as np
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(model_name)
    rows, texts = [], []
    for p in sorted(glob.glob(os.path.join(corpus, "*.md"))):
        text = open(p, encoding="utf-8", errors="ignore").read()
        for j, ch in enumerate(_chunks(text)):
            rows.append({"path": p, "chunk": j, "preview": ch[:160].replace("\n", " ")})
            texts.append(ch)
    if not texts:
        print(f"no corpus in {corpus}; run ingest.py first.")
        return
    emb = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)
    np.save(os.path.join(corpus, ".embeddings.npy"), emb)
    with open(os.path.join(corpus, ".embeddings.jsonl"), "w", encoding="utf-8") as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"embedded {len(texts)} chunks from {corpus} (model: {model_name})")


def query(corpus, q, model_name, top):
    import numpy as np
    from sentence_transformers import SentenceTransformer
    epath = os.path.join(corpus, ".embeddings.npy")
    mpath = os.path.join(corpus, ".embeddings.jsonl")
    if not (os.path.exists(epath) and os.path.exists(mpath)):
        print("no embeddings yet. Run:  embed_index.py build --corpus <dir>")
        return
    emb = np.load(epath)
    meta = [json.loads(l) for l in open(mpath, encoding="utf-8")]
    model = SentenceTransformer(model_name)
    qv = model.encode([q], normalize_embeddings=True)[0]
    sims = emb @ qv
    order = np.argsort(-sims)[:top]
    print(f"top {len(order)} chunks (semantic) for: {q}\n")
    for rank, i in enumerate(order, 1):
        m = meta[i]
        print(f"{rank}. [{sims[i]:.3f}] {os.path.basename(m['path'])}#chunk{m['chunk']}")
        print(f"   {m['preview']}…\n   {m['path']}")
    print("\nNext: Read the full .md of the matched papers into context.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["build", "query"])
    ap.add_argument("q", nargs="?", default="")
    ap.add_argument("--corpus", required=True)
    ap.add_argument("--model", default="all-MiniLM-L6-v2")
    ap.add_argument("--top", type=int, default=6)
    args = ap.parse_args()
    if not _have_st():
        sys.exit(0)
    corpus = os.path.expanduser(args.corpus)
    if args.mode == "build":
        build(corpus, args.model)
    else:
        if not args.q:
            print("query mode needs a question argument.")
            sys.exit(0)
        query(corpus, args.q, args.model, args.top)


if __name__ == "__main__":
    main()
