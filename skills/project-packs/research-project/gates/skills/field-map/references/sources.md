# CS-native sources

- [OpenReview — the one worth the most](#openreview--the-one-worth-the-most)
- [The rest](#the-rest)
- [Snowballing](#snowballing)
- [Thematic, not paper-by-paper](#thematic-not-paper-by-paper)
- [Gap vocabulary](#gap-vocabulary)

`paper-lookup` in `~/research-project/literature/` covers 11 general scholarly APIs — arXiv,
Semantic Scholar, OpenAlex, Crossref, CORE, Unpaywall, and six biomedical ones. The four below are
CS-specific and are what this skill actually needs.

---

## OpenReview — the one worth the most

**Reviewer objections are expert-written, pre-labelled, published gap statements.** Nothing else
available gives you a domain expert stating, in writing, exactly what a paper failed to do. When a
reviewer writes *"no compute-matched baseline"* or *"not evaluated beyond 7B"*, the anomaly is
already derived; you only have to record it.

- **Access:** `api.openreview.net`, free, no credentials
- **Query:** submissions for a venue id (e.g. `ICLR.cc/2024/Conference`), then the review notes
  attached to each. Decisions, scores, rebuttals and camera-ready diffs are all there
- **Where the value is:** the *rejected* and *borderline* papers as much as the accepted ones. A
  rejection thread is a list of the field's current standards, written by people applying them

**Coverage boundary — record this in `SEARCH-LOG.md`, do not let it be assumed:**

| Venue | On OpenReview |
|---|---|
| ICLR | Yes, thoroughly, many years |
| NeurIPS | Recent years |
| ACL / EMNLP | Partially (ARR) |
| Many workshops | Yes |
| **CVPR, ICCV, ECCV** | **No** |
| **ICML** | **No** |
| **Journals** | **No** |

So an anomaly sourced only from OpenReview is scoped to that slice of the field. Say so.

## The rest

**ACL Anthology** — `aclanthology.org`. Complete NLP/CL proceedings (ACL, EMNLP, NAACL, COLING,
TACL, CL journal), per-paper BibTeX. Browse by venue and year. The authoritative source for NLP
citations; `paper-lookup` has no equivalent.

**DBLP** — `dblp.org/search/publ/api?q=<query>&format=json`, free, no key. 7M+ CS publications with
complete venue and author bibliographies. Best for author disambiguation ("which of the four people
with this name"), venue completeness, and verifying metadata before it goes in a `.bib`.

**Papers with Code** — `paperswithcode.com/api/v1`, free. Papers linked to implementations,
benchmark leaderboards, datasets. Two uses here: finding what the actual state of the art on a
benchmark is (as opposed to what a paper claims), and **spotting the gap between reported numbers
and reproduced ones** — a leaderboard entry with no located reproduction is an anomaly.

## Snowballing

Both directions, and the asymmetry matters.

- **Backward** — the anchors' reference lists. Gets you the foundations.
- **Forward** — who cites the anchors *now*. Gets you what is live. This is the direction that
  finds the contradiction, because a paper that disagrees with an anchor cites it.

**A paper cited by several of your included papers is likely seminal even if its own citation count
is modest.** Co-citation within your own corpus is a better signal than a global count, and it is
not subject to the ossification problem that makes global counts misleading in a large field.

## Thematic, not paper-by-paper

When the map gets written, organise by **theme**, never by study.

> **Anti-pattern — study-by-study summary.** "Zhang et al. found X. Liu et al. found Y. Wang et al.
> found Z." That is a list, not a synthesis, and it makes contradictions invisible: X and Y may be
> incompatible and the format will never surface it.

Organise by what is being claimed, and put the papers that disagree in the same paragraph. The
contradictions are the product.

## Gap vocabulary

Four buckets, carried over from the review template this skill replaces. Use them to *label* a gap
once found — they are not a procedure for finding one, and they are not the five patterns in
SKILL.md, which are.

| Bucket | Meaning |
|---|---|
| **Knowledge** | An unanswered research question |
| **Methodological** | A study-design or measurement problem |
| **Practical** | A research-to-practice gap |
| **Settings** | Underrepresented tasks, domains or contexts |

**Not used here: the seven-gap taxonomies from the evidence-synthesis literature.** The widely
circulated one is an unrefereed workshop paper with no empirical validation, and its "population
gap" has no ML analogue. Four checkable buckets beat seven borrowed ones.
