# The twelve kinds of ablation

- [Why a taxonomy at all](#why-a-taxonomy-at-all)
- [1. Component removal](#1-component-removal)
- [2. Trivial-version replacement](#2-trivial-version-replacement)
- [3. Budget-matched control](#3-budget-matched-control)
- [4. Hyperparameter attribution](#4-hyperparameter-attribution)
- [5. Data / subset](#5-data--subset)
- [6. Interaction / additivity](#6-interaction--additivity)
- [7. Objective-term](#7-objective-term)
- [8. Gradient-path](#8-gradient-path)
- [9. Seed / initialisation](#9-seed--initialisation)
- [10. Negative control](#10-negative-control)
- [11. Oracle / ceiling](#11-oracle--ceiling)
- [12. Reviewer-anticipation](#12-reviewer-anticipation)

## Why a taxonomy at all

Asked "what ablations should I run", the default generator is *the boxes in the architecture
figure* — remove each named module in turn. That is kind 1 and nothing else, and it is why the
strongest frontier model recovers only **29%** of the ablations a paper's own authors actually ran
([2507.08038](https://arxiv.org/pdf/2507.08038): 34% author-side, 26% reviewer-side).

The remaining eleven kinds are the gap. Walk them in order. Each either yields a candidate or gets
a written "n/a, because —". Skipping one silently is not available, because silence is
indistinguishable from not having thought of it, which is the failure being fixed.

---

## 1. Component removal

**Holds fixed:** nothing. **Defends:** "this part contributes."

Delete a named module, retrain, report the drop. The default, and the only one an agent proposes
unprompted. It is necessary and it is nowhere near sufficient — a component removal cannot
distinguish "this part does the work" from "this part adds capacity", which is what kinds 2 and 3
exist for.

---

## 2. Trivial-version replacement

**Holds fixed:** capacity, parameter count. **Defends:** "the module's *function* helps, not its
parameters."

Replace the module with a trivial version rather than deleting it — random output, uniform
weights, an identity map, a fixed constant. Same shape, same parameter budget, no content.

*Example:* the learned attention over neighbours becomes uniform attention. If the metric holds up,
the learning was not the point; the pooling was.

---

## 3. Budget-matched control

**Holds fixed:** FLOPs, parameters, training steps, or wall-clock — say which. **Defends:** "the
gain is not bought with compute."

Give the baseline the same budget your method consumes. More parameters, more steps, a wider layer
— whatever makes the comparison fair on cost.

**This is the single most common reviewer demand, and leave-one-out never produces it.** A method
that adds a module also adds capacity and usually training time; without this control, every number
in the table is confounded with compute. Expect to be asked. Better to have run it.

---

## 4. Hyperparameter attribution

**Holds fixed:** the tuning budget. **Defends:** "the gain is the method, not the sweep."

Re-run the baseline under **your** sweep budget, not the paper's defaults.

The commonest unfair comparison in the field is a carefully tuned proposed method against a
default-configured baseline. Reviewers know it. `paper-stress-test` names it as an attack; this is
the pre-emption.

---

## 5. Data / subset

**Holds fixed:** the method. **Defends:** "the gain concentrates where the mechanism says it
should."

Split the evaluation by the axis your mechanism claim implies — rare versus common, long versus
short, in-distribution versus shifted.

The asymmetry is the point: **a gain that is uniform across subsets kills a subset-specific
mechanism claim.** If you argued the method helps on hard cases and it helps equally everywhere,
the story is wrong even though the number is good.

---

## 6. Interaction / additivity

**Holds fixed:** nothing. **Defends:** "the components compose."

Run A alone, B alone, and A+B. Is A+B ≈ A + B?

Super-additivity is a result worth reporting. Sub-additivity is a result you need to explain before
a reviewer does it for you. Either way it belongs in the paper, and neither shows up in a
leave-one-out table.

---

## 7. Objective-term

**Holds fixed:** the architecture. **Defends:** "this loss term is load-bearing."

Zero each coefficient in turn. Then sweep it, and show the result is not balanced on a knife-edge —
a term that only helps at exactly one value is a tuning artefact, not a contribution.

---

## 8. Gradient-path

**Holds fixed:** the forward pass. **Defends:** "the signal flows where I claim it flows."

Insert `stop_gradient` / `.detach()` on specific paths. Forward computation identical, gradient
routing changed.

Nearly never proposed unprompted, and it is the sharpest tool available for a *mechanism* claim:
if the story is "the auxiliary head shapes the encoder", detaching it should cost you the gain. If
it does not, the encoder was never listening.

---

## 9. Seed / initialisation

**Holds fixed:** everything else. **Defends:** "the effect exceeds seed noise."

Multiple seeds, with variance reported. Sizing is not this skill's job — `statsmodels.stats.power`
in `~/data-analysis-project/`, or G*Power.

The bar is not "we ran three seeds". It is "the gap exceeds the spread", stated with the spread
visible.

---

## 10. Negative control

**Holds fixed:** the method. **Defends:** "the mechanism is the mechanism."

Apply the method where it should **not** help. If it helps there too, the explanation is wrong even
though the headline number stands.

This is the missing control behind right-answer-wrong-mechanism results, where an agent reached a
correct-looking conclusion through reasoning that collapsed under changed conditions
([2606.23175](https://arxiv.org/abs/2606.23175)). A negative control is what would have caught it.

---

## 11. Oracle / ceiling

**Holds fixed:** nothing. **Defends:** "the remaining headroom is worth another paper."

Replace a component with ground truth and measure the ceiling.

Not defensive — it is how you tell the reader (and yourself) whether the next increment is worth
pursuing, and it converts a limitations paragraph from an apology into a research direction.

---

## 12. Reviewer-anticipation

**Holds fixed:** nothing. **Defends:** whatever the three nearest papers ablated and you did not.

Not a kind so much as a diff. It is produced by step 3 of the procedure, and it is the one that
targets AblationBench's 26% reviewer-side score directly: the reviewer is drawn from your subarea
and has read the papers your related-work section names. What they ablated is what they will ask
about.
