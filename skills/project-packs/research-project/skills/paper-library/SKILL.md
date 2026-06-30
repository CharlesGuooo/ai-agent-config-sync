---
name: paper-library
description: >-
  Search and reason over a LOCAL library of research papers (your downloaded
  arXiv/conference PDFs). Use when the user asks to find, recall, compare, or
  pull evidence from papers they have already collected ("which of my papers
  did X", "find the paper about Y in my library", "compare the methods across
  my 3DGS papers", "what did I save on NPU operator fusion"). This is an
  agentic, lexical-first workflow — ingest PDFs once, then BM25 keyword search +
  read the full top papers into context. NOT a vector database. Do NOT use for
  live web/literature discovery (use research-lookup / literature-review) or for
  guided reading of a single new paper (use paper-reading-guide).
metadata:
  category: research
  tags: [retrieval, bm25, arxiv, local-corpus, long-context]
---

# Paper Library (agentic local search)

A personal research library: your collected PDFs become a fast, lossless,
keyword-searchable corpus that the agent searches and then reads in full.

## Why lexical-first, not vector RAG

For a personal, jargon-heavy AI/CS corpus, classic "embed everything into a vector
DB" is **not** the best approach (and is no longer best-practice in general):

- **Agentic BM25 + query rewriting ≈ or beats dense embeddings** — you (the agent)
  rewrite the query into keyword variants, which fixes lexical search's only real
  weakness (synonyms). This is what code agents (Cursor, Claude Code, Devin) do.
- **Rare jargon wins on lexical.** Terms like `3DGS`, `densification`, `operator
  fusion`, `NPU`, `world model`, `BEV`, `occupancy` are rare and discriminative —
  BM25's IDF weighting rewards them, while dense embeddings *dilute* them.
- **No index drift / no infra.** Grep/BM25 reflects the corpus as-is; no vector DB
  to maintain, no re-embedding when you add papers, no API key.
- **Long context does the reasoning.** Retrieval just narrows to the right papers;
  the actual answer comes from reading the **full** top papers into context — no
  chunk-boundary information loss.

Embeddings are available as an *optional* fallback re-ranker (see step 4), off by
default. Only reach for them on genuinely fuzzy conceptual queries where keyword
variants fail.

## Workflow

### 1. Ingest (one-time, and whenever you add papers)
```
python scripts/ingest.py --pdf-dir <folder-of-pdfs> --out <corpus-dir>
```
Extracts each PDF to clean markdown in `<corpus-dir>/` and appends a metadata row
(title, authors, arXiv id, year, abstract, path) to `<corpus-dir>/corpus_index.jsonl`.
Re-running is incremental (skips already-ingested files). Requires `pypdf`; if it's
missing the script prints the one-line install command and exits — it never
auto-installs.

### 2. Search (lexical, ranked) — the default
First **rewrite the user's question into 3-6 keyword variants** covering synonyms and
notation (e.g. "operator fusion" → `fusion`, `kernel fusion`, `operator fusion`,
`fused kernels`, `op fusion`). Then:
```
python scripts/search.py "kernel fusion operator fusion fused kernels NPU" \
    --corpus <corpus-dir> --top 6
```
Returns the top papers (title, path, score) plus the best-matching passages from each.
You can also use the harness `Grep` tool directly over `<corpus-dir>` for exact-string
or regex lookups — both are valid; `search.py` adds BM25 ranking across the whole corpus.

### 3. Read (long context) — where the answer comes from
Open the **full** markdown of the top 1-4 papers (`Read` the `.md` files search
returned) and reason over them directly. Do not answer from snippets alone — the
snippets are for locating, the full read is for understanding. With a large context
window you can hold several full papers at once; prefer that over re-querying.

### 4. Optional: semantic re-ranker (off by default)
Only if keyword variants genuinely fail on a fuzzy conceptual query, and only if
`sentence-transformers` is installed:
```
python scripts/embed_index.py build  --corpus <corpus-dir>     # one-time local embed
python scripts/embed_index.py query "your fuzzy question" --corpus <corpus-dir> --top 6
```
Local model, no API key. If `sentence-transformers` is absent the script says so and
exits cleanly — embeddings are strictly optional.

## Notes
- Corpus markdown + index are plain files — portable, diffable, greppable, no DB.
- Keep `<corpus-dir>` out of the skill directory (it's the user's data); a sibling
  like `~/papers/.corpus/` is a good default.
- For discovery of papers you do NOT yet have, this skill is the wrong tool — route to
  `research-lookup` (live API search) or `literature-review` (systematic multi-source).
