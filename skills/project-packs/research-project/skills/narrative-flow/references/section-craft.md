# Section-specific structural craft

Load **only the section you are editing**. Each entry lists the distinctive
structural moves — not generic writing advice.

---

## Abstract

Pick the ladder that fits the paper:
- **V1 — Challenge → Contribution.** For a single clean contribution.
- **V2 — Challenge → Insight → Contribution.** When one key insight carries the work.
- **V3 — Multiple Contributions.** State each contribution **together with its
  technical advantage in one sentence**. Being able to say "contribution + why it
  is better" in a single sentence is the core skill here.

Rule: in the contribution sentence, **name the technical term only; do not explain
every step.** The term must be immediately understandable — the reader should feel
no *jump*.

---

## Introduction

Think **backward, then write forward.**

- **Backward (reason first):** What is the problem? Why is there no established
  solution? What benefit + insight does our idea give? How do we use prior work to
  lead the reader to it?
- **Forward (then write):** task → prior methods lead to the challenge →
  our contributions → their advantages + insight.

**Hard anti-pattern:** do NOT present a naive solution then patch it. "Even if the
work is actually incremental, do not write it this way" — it erases reader
curiosity and makes the idea look trivial.

Skeleton for the contribution paragraph:
```
In this paper, we propose a novel framework ... named ...
Our innovation is in ...
Specifically, ...
In contrast to previous methods, ...
```
Do **not** dress a plain pipeline in "insight" language to fake novelty.

---

## Related Work

- Group by **technical topic, not publication year.**
- End each topic paragraph by **clarifying your distinction**, then a **transition
  sentence that leads into your method.**
- Don'ts: no **citation dump**; do **not hide your strongest baselines**; state the
  difference in **technical terms, not marketing terms.**

---

## Method

Write each module as a **triad: module design + motivation + technical advantage.**

- **Write the module design first** (concrete backbone), then add motivation and
  advantages. Design = structures first, then the forward process in **strict
  execution order**: `Given [input], we first ... then ... finally ...`.
- **Motivation is problem-driven:** "because problem X exists, we design module Y."
  Openers: "A remaining problem/challenge is ...", "Previous methods have
  difficulty in ...".
- **Sketch the pipeline figure before the prose**; map subsections from it.

Three-level clarity check after drafting:
1. **Logic level** — summarize the Method's writing logic; is it smooth to follow?
2. **Paragraph level** — first sentence tells the reader the paragraph's job; one message per paragraph.
3. **Sentence level** — is the *motivation* of each sentence explicit? The reader
   must always know **why this sentence is needed.**

---

## Experiments

Organize around **three questions:**
1. Are we **better than strong baselines**? (fair comparison, not cherry-picked)
2. **Which module/design choice causes the gain**? (ablations: remove / replace /
   disable, report the delta)
3. **How far does it generalize** under harder / OOD / stress settings? Report both
   gains **and failure modes.**

Tables are first-class content, not decoration — hard rules:
- Caption **above** the table.
- **No vertical rules** (`|`); use `booktabs` (`\toprule / \midrule / \bottomrule`); minimize horizontal rules.
- Label metric direction in headers (`PSNR ↑`, `LPIPS ↓`).
- **One table, one message**; consistent numeric precision.
- Subtle color highlight for the best/target row only.
- Single-column floats go in the **right column** so reading flow enters from the top-left text.

---

## Conclusion

Distinguish two very different framings:
- **Scope limitation** (preferred) — bounded by the task setting, still competitive
  vs SOTA. This is fine to state.
- **Technical defect** — underperforms baselines. Avoid framing the conclusion
  around fixable implementation flaws unless they critically define your method's scope.

---

## Transition bank (for step 6 of the reverse outline)

Use explicit connectors so relations are visible:
- **Cause / effect:** therefore, as a result, consequently, thus, hence, because
- **Comparison:** similarly, likewise, in the same way
- **Contrast / exception:** however, in contrast, whereas, yet, nonetheless, unlike
- **Example:** for example, for instance, specifically, in particular
- **Addition / refinement:** moreover, furthermore, in addition, more precisely
- **Summary / conclusion:** in summary, overall, taken together, in conclusion
