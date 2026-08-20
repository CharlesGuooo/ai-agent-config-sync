# Optional semantic re-ranker (off by default)

Only for fuzzy conceptual queries where BM25 keyword variants fail — and only if
`sentence-transformers` is installed. Local model, no API key. If the package is absent the
script says so and exits cleanly; don't install it just to try.

```
python scripts/embed_index.py build  --corpus <corpus-dir>            # one-time local embed
python scripts/embed_index.py query "your fuzzy question" --corpus <corpus-dir> --top 6
```

It returns semantically-matched chunks; then `Read` the full papers those chunks belong to —
the answer still comes from the full read, not the chunks. Lexical-first stays the default;
this is a fallback, not the primary path.
