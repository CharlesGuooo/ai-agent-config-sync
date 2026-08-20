---
name: paper-library
description: Search and reason over a LOCAL library of collected research papers (downloaded arXiv/conference PDFs). Use to find, recall, compare, or pull evidence from papers the user already has ("which of my papers did X", "find the one about Y in my library"). NOT for live web discovery (use research-lookup / literature-review) or guided reading of one new paper (use paper-reading-guide).
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Paper Library — lexical-first local search

Your collected PDFs become a lossless, keyword-searchable corpus. The method is
**lexical-first**: BM25 keyword search narrows to the right papers, then you read the full
top papers into long context and reason. This is not a vector database — for a personal,
jargon-heavy corpus, agentic BM25 + query rewriting matches or beats embeddings, with no
index to drift, and rare terms (`3DGS`, `operator fusion`, `NPU`) get the IDF weight that
dense embeddings dilute.

## Workflow

**1. Ingest** (once, and when you add papers)
```
python scripts/ingest.py --pdf-dir <folder> --out <corpus-dir>
```
Each PDF → clean markdown + a `corpus_index.jsonl` row. Incremental; needs `pypdf` (prints
the install hint if missing, never auto-installs).

**2. Search — lexical, the default.** First **rewrite the question into 3–6 keyword variants**
(synonyms + notation), then rank:
```
python scripts/search.py "kernel fusion operator fusion fused kernels NPU" --corpus <corpus-dir> --top 6
```
Query rewriting is the whole trick — it covers BM25's one weakness (synonyms). The harness
`Grep` tool over the corpus is also valid for exact strings.

**3. Read — where the answer comes from.** `Read` the full markdown of the top 1–4 papers and
reason over them directly. Snippets locate; the full read is for understanding. Prefer holding
several full papers in context over re-querying.

**Fuzzy conceptual query that keyword variants can't crack?** Only then reach for the optional
embedding re-ranker — [`references/semantic-layer.md`](references/semantic-layer.md).

## Notes
- Corpus markdown + index are plain files — portable, greppable, no DB. Keep `<corpus-dir>`
  out of the skill folder (it's the user's data; e.g. `~/papers/.corpus/`).
