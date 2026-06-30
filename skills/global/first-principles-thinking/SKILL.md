---
name: first-principles-thinking
description: >-
  Reason from base truths instead of by analogy. Use when a problem is being
  solved by copying how others did it, when an answer rests on inherited
  assumptions, when stuck because "that's how it's done", when estimating what
  is actually possible (cost, performance, scope) rather than what is
  conventional, or when the user asks to "think from first principles",
  "question the assumptions", "why do we believe this", "break it down to
  fundamentals", or "is this actually true". Apply before committing to an
  approach whose justification is precedent rather than evidence. Do NOT use for
  routine execution where the path is known and uncontested, or when the user
  just wants a quick factual answer.
category: thinking
---

# First-Principles Thinking

Reason up from things that are demonstrably true, not sideways from how something
is usually done. Reasoning by analogy copies the conclusion *and* the hidden
assumptions baked into it. First-principles reasoning strips a problem to parts
that cannot be reduced further, verifies each, and rebuilds — so the answer is
constrained only by what is actually true, not by convention.

Lineage: Aristotle (first causes), Feynman (explain it simply or you don't
understand it), Musk (reason from physical limits), Munger (invert).

## When it pays off

- The current approach is justified by "that's how everyone does it."
- A plan inherits an assumption nobody has checked recently.
- You're estimating a hard bound — true cost, true latency, true minimum scope.
- Two experts disagree and are talking past each other on undefined terms.

Skip it when the path is known and uncontested, or the user wants a quick fact.
The method is deliberate and slower; spend it where the assumption actually
carries weight.

## The method

1. **State the claim plainly.** Write the problem or proposed answer in one
   sentence, with no jargon. Vague wording hides assumptions.
2. **Surface every assumption.** List what must be true for the claim to hold.
   For each, ask: *Why do we believe this? What evidence supports it? Is it a
   law, or just a habit?* Mark each as **verified**, **unverified**, or
   **inherited convention**.
3. **Decompose to base elements.** Keep asking "why" / "what is this made of"
   until you reach things that are either physically/logically necessary or
   independently checkable. Those are your first principles.
4. **Rebuild from the base.** Construct a solution using only the verified base
   elements. Deliberately ignore the discarded conventions. Ask the generative
   question: *given only what is actually true, what is possible here?*
5. **Test the reconstruction.** Does it survive without the assumptions you
   dropped? If it collapses, an assumption you discarded was load-bearing —
   promote it back to a base element and note the evidence for it.

## Techniques to apply within the method

- **Five whys** — chase a claim down to its root cause, not its first plausible
  explanation.
- **Feynman test** — explain the base elements simply enough for a smart novice.
  Where the explanation gets hand-wavy, the understanding isn't yet at bedrock.
- **Inversion (Munger)** — ask what would have to be true for this to fail, then
  design against it.
- **Physical bound (Musk)** — compute the limit set by physics/economics (the
  cost of raw materials, the minimum operations required), and compare it to the
  conventional number. The gap is the opportunity.

## Anti-patterns

- **Reasoning by analogy in disguise** — "X did it this way" is not a first
  principle; it imports X's hidden assumptions.
- **Stopping at a comfortable assumption** — quitting the "why" chain at the
  first answer that feels familiar rather than one that is verifiable.
- **Decomposition theater** — listing parts without actually questioning whether
  each is true or necessary.

## Output

When you apply this, make the reasoning legible:

- The **base elements** you reduced to (and which you verified vs. assumed).
- The **assumptions you discarded** and why they weren't load-bearing.
- The **reconstructed conclusion**, built only from the base elements.

The value is not just the answer — it's that the user can see exactly which
assumption, if it changed, would change the conclusion.
