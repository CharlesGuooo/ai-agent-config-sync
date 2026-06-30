#!/usr/bin/env python3
"""Ingest a folder of paper PDFs into a lossless, greppable markdown corpus.

Each PDF -> <out>/<stem>.md (plain text), plus one metadata row appended to
<out>/corpus_index.jsonl. Incremental: skips files already in the index.

Dependency: pypdf (pure-python). If missing, prints the install hint and exits 1.
Never auto-installs anything.

Usage:
    python ingest.py --pdf-dir ~/papers --out ~/papers/.corpus
"""
import argparse
import json
import os
import re
import sys


def _need_pypdf():
    try:
        from pypdf import PdfReader  # noqa: F401
        return
    except Exception:
        sys.stderr.write(
            "paper-library: 'pypdf' is required to read PDFs.\n"
            "  install it yourself (not auto-installed):  pip install pypdf\n"
        )
        sys.exit(1)


def extract_text(path):
    from pypdf import PdfReader
    try:
        reader = PdfReader(path)
    except Exception as e:
        return None, f"unreadable ({e})"
    parts = []
    for page in reader.pages:
        try:
            parts.append(page.extract_text() or "")
        except Exception:
            parts.append("")
    return "\n\n".join(parts), None


ARXIV_RE = re.compile(r"(\d{4}\.\d{4,5})(v\d+)?")


def guess_metadata(stem, text):
    """Cheap heuristics — good enough for indexing, not authoritative."""
    head = "\n".join(text.splitlines()[:60])
    # arXiv id: prefer filename, then text
    arxiv = None
    m = ARXIV_RE.search(stem) or ARXIV_RE.search(head)
    if m:
        arxiv = m.group(1)
    # title: first substantial line that isn't a header/url/arxiv stamp
    title = stem
    for line in text.splitlines():
        s = line.strip()
        if len(s) >= 8 and not s.lower().startswith(("arxiv", "http", "doi")) \
                and not ARXIV_RE.fullmatch(s) and sum(c.isalpha() for c in s) >= 6:
            title = s
            break
    # year
    ym = re.search(r"\b(19|20)\d{2}\b", head)
    year = ym.group(0) if ym else None
    # abstract: text after an 'Abstract' marker, up to ~1500 chars
    abstract = None
    am = re.search(r"\babstract\b", text, re.IGNORECASE)
    if am:
        abstract = re.sub(r"\s+", " ", text[am.end(): am.end() + 1500]).strip()
    return {"title": title[:300], "arxiv": arxiv, "year": year,
            "abstract": (abstract or "")[:1200]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf-dir", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    _need_pypdf()

    pdf_dir = os.path.expanduser(args.pdf_dir)
    out = os.path.expanduser(args.out)
    os.makedirs(out, exist_ok=True)
    index_path = os.path.join(out, "corpus_index.jsonl")

    done = set()
    if os.path.exists(index_path):
        with open(index_path, encoding="utf-8") as fh:
            for line in fh:
                try:
                    done.add(json.loads(line)["source"])
                except Exception:
                    pass

    pdfs = [f for f in sorted(os.listdir(pdf_dir)) if f.lower().endswith(".pdf")]
    added = skipped = failed = 0
    with open(index_path, "a", encoding="utf-8") as idx:
        for fn in pdfs:
            src = os.path.join(pdf_dir, fn)
            if src in done:
                skipped += 1
                continue
            text, err = extract_text(src)
            if err or not text or not text.strip():
                sys.stderr.write(f"  skip {fn}: {err or 'no extractable text'}\n")
                failed += 1
                continue
            stem = os.path.splitext(fn)[0]
            md_path = os.path.join(out, stem + ".md")
            with open(md_path, "w", encoding="utf-8") as mh:
                mh.write(text)
            meta = guess_metadata(stem, text)
            meta.update({"source": src, "markdown": md_path})
            idx.write(json.dumps(meta, ensure_ascii=False) + "\n")
            added += 1
            print(f"  + {fn}  ->  {os.path.basename(md_path)}  [{meta['title'][:60]}]")

    print(f"\ningested {added}, skipped {skipped} (already done), failed {failed}")
    print(f"corpus: {out}\nindex:  {index_path}")


if __name__ == "__main__":
    main()
