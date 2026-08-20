# Scientific Writing Principles

## Overview

Effective scientific writing requires mastering fundamental principles that ensure clarity, precision, and impact. Unlike creative or narrative writing, scientific writing prioritizes accuracy, conciseness, and objectivity. This guide covers the core principles that distinguish good scientific writing from poor writing and provides practical strategies for improvement.

## The Three Pillars of Scientific Writing

### 1. Clarity

**Definition:** Writing that is immediately understandable to the intended audience without ambiguity or confusion.

**Why it matters:** Science is complex enough without unclear writing adding confusion. Readers should focus on understanding the science, not deciphering the prose.

#### Strategies for Clarity

**Use precise, unambiguous language:**
```
Poor: "The model seemed to help on quite a few tasks."
Better: "The model improved accuracy on 68% (32/47) of tasks."
```

**Define technical terms at first use:**
```
"We measured expected calibration error (ECE), a metric quantifying the gap between
a model's predicted confidence and its observed accuracy."
```

**Maintain logical flow within and between paragraphs:**
- Each paragraph should have one main idea
- Topic sentence introduces the paragraph's focus
- Supporting sentences develop that focus
- Transition sentences connect paragraphs

**Use active voice when it improves clarity:**
```
Passive (less clear): "The samples were analyzed by the researchers."
Active (clearer): "Researchers analyzed the samples."
```

However, passive voice is acceptable and often preferred in Methods when the action is more important than the actor:
```
"Blood samples were collected at baseline and after 6 weeks."
```

**Break up long, complex sentences:**
```
Poor: "The results of our study, which involved 200 models trained on
three datasets and evaluated over 12 checkpoints every 4 epochs using
held-out validation sets, showed significant improvements for the proposed
method."

Better: "Our study involved 200 models trained on three datasets.
Models were evaluated over 12 checkpoints every 4 epochs using
held-out validation sets. The proposed method showed significant improvements."
```

**Use specific verbs:**
```
Weak: "The study looked at errors in language models."
Stronger: "The study examined factors contributing to errors in language models."
```

#### Common Clarity Problems

**Ambiguous pronouns:**
```
Poor: "Model A used the new optimizer and Model B used SGD. They showed
improvement."
(Who is "they"?)

Better: "Model A used the new optimizer and Model B used SGD. The model with the
new optimizer showed improvement."
```

**Misplaced modifiers:**
```
Poor: "We measured latency on servers using an automated profiler."
(Are the servers using the profiler, or are we?)

Better: "Using an automated profiler, we measured latency on the servers."
```

**Unclear referents:**
```
Poor: "The increase in expression was accompanied by decreased proliferation, which
was unexpected."
(What was unexpected—the decrease, the accompaniment, or both?)

Better: "The increase in expression was accompanied by decreased proliferation.
This inverse relationship was unexpected."
```

### 2. Conciseness

**Definition:** Expressing ideas in the fewest words necessary without sacrificing clarity or completeness.

**Why it matters:** Concise writing respects readers' time. Every unnecessary word is a missed opportunity for clarity and impact. As the principle states: "We value concise writing because we value time."

#### Strategies for Conciseness

**Eliminate redundant words and phrases:**

| Wordy | Concise |
|-------|---------|
| "due to the fact that" | "because" |
| "in order to" | "to" |
| "it is important to note that" | [delete] |
| "a total of 50 participants" | "50 participants" |
| "completely eliminate" | "eliminate" |
| "has been shown to be" | "is" |
| "in the event that" | "if" |
| "at the present time" | "now" or "currently" |
| "conduct an investigation into" | "investigate" |
| "give consideration to" | "consider" |

**Avoid throat-clearing phrases:**
```
Wordy: "It is interesting to note that the results of our study demonstrate that..."
Concise: "Our results demonstrate that..." or "The results show that..."
```

**Use strong verbs instead of noun+verb combinations:**

| Wordy | Concise |
|-------|---------|
| "make a decision" | "decide" |
| "perform an analysis" | "analyze" |
| "conduct a study" | "study" or "studied" |
| "make an assessment" | "assess" |
| "provide information about" | "inform" |

**Eliminate unnecessary intensifiers:**
```
Wordy: "The results were very significant."
Concise: "The results were significant." (p-value conveys the degree)
```

**Avoid repeating information unnecessarily:**
```
Redundant: "The results showed that runs in the proposed-method group, which
used the proposed method, had better outcomes."
Concise: "The proposed-method group had better outcomes."
```

**Favor shorter constructions:**
```
Wordy: "In spite of the fact that the sample size was small..."
Concise: "Although the sample size was small..."
```

#### Acceptable Length vs. Unnecessary Length

**Not all long sentences are bad:**
```
This detailed sentence is fine: "We analyzed blood samples using liquid
chromatography-tandem mass spectrometry (LC-MS/MS) with a Waters Acquity UPLC
system coupled to a Xevo TQ-S mass spectrometer (Waters Corporation, Milford, MA)."

Why? Because each element is necessary information.
```

**The key question:** Can any word be removed without losing meaning or precision? If yes, remove it.

### 3. Accuracy

**Definition:** Precise, correct representation of data, methods, and interpretations.

**Why it matters:** Scientific credibility depends on accuracy. Inaccurate reporting undermines the entire scientific enterprise.

#### Strategies for Accuracy

**Report exact values with appropriate precision:**
```
Poor: "The mean was about 25."
Better: "The mean was 24.7 ± 3.2 (SD)."
```

**Match precision to measurement capability:**
```
Inappropriate: "Mean age was 45.237 years" (implies false precision)
Appropriate: "Mean age was 45.2 years"
```

**Use consistent terminology throughout:**
```
Inconsistent: Introduction calls it "inference latency," Methods call it "response
time," Results call it "serving delay."

Consistent: Use "inference latency" throughout, or define explicitly: "inference
latency (also termed response time)"
```

**Distinguish observations from interpretations:**
```
Observation: "Mean latency decreased from 145 to 132 ms (p=0.003)."
Interpretation: "This suggests the method effectively lowers latency."
```

**Be specific about uncertainty:**
```
Vague: "There may be some error in these measurements."
Specific: "Measurements have a standard error of ±2.5 ms based on the profiler's
resolution."
```

**Use correct statistical language:**
```
Incorrect: "The correlation was highly significant (p=0.03)."
Correct: "The correlation was statistically significant (p=0.03)."
(p=0.03 is not "highly" significant; that's reserved for p<0.001)
```

**Verify all numbers:**
- Check that numbers in text match tables/figures
- Verify that n values sum correctly
- Confirm percentages are correctly calculated
- Double-check all statistics

#### Common Accuracy Problems

**Overgeneralization:**
```
Poor: "Data augmentation prevents overfitting."
Better: "In our experiments, models trained with data augmentation showed
lower generalization error than baselines (mean difference 3.2 points in test
accuracy, 95% CI: 1.5-4.9, p<0.001)."
```

**Unwarranted causal claims:**
```
Poor (from observational analysis): "Larger batch sizes reduce test error."
Better: "Batch size was inversely associated with test error across these runs
(coefficient = -0.82, 95% CI: -0.95 to -0.71)."
```

**Imprecise numerical descriptions:**
```
Vague: "Many participants dropped out."
Precise: "15/50 (30%) participants withdrew before study completion."
```

## Additional Key Principles

### 4. Objectivity

**Definition:** Presenting information impartially without bias, exaggeration, or unsupported opinion.

**Strategies:**

**Present results without bias:**
```
Biased: "As expected, our superior method performed better."
Objective: "Method A showed higher accuracy than Method B (87% vs. 76%, p=0.02)."
```

**Acknowledge conflicting evidence:**
```
"Our findings contrast with Smith et al. (2022), who reported no significant effect.
This discrepancy may result from differences in training budget or dataset
characteristics."
```

**Avoid emotional or evaluative language:**
```
Subjective: "The results were disappointing and concerning."
Objective: "The method did not significantly reduce error (p=0.42)."
```

**Distinguish fact from speculation:**
```
"The observed decrease in accuracy was accompanied by an increased gradient norm,
suggesting that training instability may be the primary cause of the degradation."
(Uses "suggesting" and "may be" to indicate interpretation)
```

### 5. Consistency

**Maintain consistency throughout the manuscript:**

**Terminology:**
- Use the same term for the same concept (not synonyms for variety)
- Define abbreviations at first use and use consistently thereafter
- Use standard nomenclature for genes, proteins, chemicals

**Notation:**
- Statistical notation (p-value format, CI presentation)
- Units of measurement
- Number formatting (decimal places)

**Tense:**
- Past tense for your specific study actions
- Present tense for established facts
- See detailed tense guide in IMRAD structure reference

**Style:**
- Follow journal guidelines consistently
- Citation format
- Heading capitalization
- Number vs. word for numerals

### 6. Logical Organization

**Create a clear "red thread" through the manuscript:**

**Paragraph structure:**
1. Topic sentence (main idea)
2. Supporting sentences (evidence, explanation)
3. Concluding/transition sentence (link to next idea)

**Section flow:**
- Each section builds logically on the previous
- Questions raised in Introduction are answered in Results
- Findings presented in Results are interpreted in Discussion

**Signposting:**
```
"First, we examined..."
"Next, we investigated..."
"Finally, we assessed..."
```

**Parallelism:**
```
Not parallel: "Aims were to (1) measure latency, (2) assessment of
accuracy, and (3) we wanted to evaluate memory use."

Parallel: "Aims were to (1) measure latency, (2) assess accuracy,
and (3) evaluate memory use."
```

## Verb Tense in Scientific Writing

### General Guidelines

**Present tense** for:
- Established facts and general truths
  - "DNA is composed of nucleotides."
- Conclusions you are drawing
  - "These findings suggest that..."
- Referring to figures and tables
  - "Figure 1 shows the distribution..."

**Past tense** for:
- Specific findings from completed research (yours and others')
  - "Smith et al. (2022) found that..."
  - "We observed a significant decrease..."
- Methods you performed
  - "Participants completed questionnaires at baseline."

**Present perfect** for:
- Recent developments with current relevance
  - "Recent studies have demonstrated..."
- Research area background
  - "Several approaches have been proposed..."

### Section-Specific Tense

| Section | Primary Tense | Examples |
|---------|---------------|----------|
| **Abstract - Background** | Present or present perfect | "Transformers dominate NLP" / "Research has shown..." |
| **Abstract - Methods** | Past | "We recruited 100 participants" |
| **Abstract - Results** | Past | "The method reduced error" |
| **Abstract - Conclusions** | Present | "These findings suggest..." |
| **Introduction - Background** | Present (facts), present perfect (research) | "Attention is effective" / "Studies have shown..." |
| **Introduction - Gap** | Present or present perfect | "However, little is known..." |
| **Introduction - This study** | Past or present | "We investigated..." / "This study investigates..." |
| **Methods** | Past | "We collected samples..." |
| **Results** | Past | "Mean age was 45 years" |
| **Discussion - Your findings** | Past | "We found that..." |
| **Discussion - Interpretation** | Present | "This suggests..." |
| **Discussion - Prior work** | Past or present | "Smith found..." / "Previous work demonstrates..." |

## Common Writing Pitfalls

### 1. Jargon Overload

**Problem:** Excessive use of technical terms without definition

**Example:**
```
Poor: "We utilized MHSA with RoPE and pre-LN followed by SwiGLU FFNs, quantized to
INT8 via PTQ with per-channel GPTQ calibration."

Better: "We used multi-head self-attention (MHSA) with rotary position embeddings
(RoPE) and pre-layer-normalization, followed by SwiGLU feed-forward networks (FFNs).
Weights were quantized to 8-bit integers (INT8) using post-training quantization (PTQ)."
```

### 2. Nominalization

**Problem:** Turning verbs into nouns, making writing heavy and indirect

**Examples:**

| Nominalized | Direct |
|-------------|--------|
| "give consideration to" | "consider" |
| "make an assumption" | "assume" |
| "perform an investigation" | "investigate" |
| "conduct an examination" | "examine" |
| "achieve a reduction" | "reduce" |

### 3. Hedging Excessively or Insufficiently

**Excessive hedging** (sounds uncertain):
```
"It could perhaps be possible that the method might possibly have some effect
on accuracy under certain conditions."
```

**Insufficient hedging** (overstates conclusions):
```
"The method solves language understanding."
```

**Appropriate hedging:**
```
"The method significantly reduced error in these experiments,
suggesting it may be effective for long-context tasks."
```

**Hedging words to use appropriately:**
- Suggests, indicates, implies (not proves, demonstrates for correlational data)
- May, might, could (possibilities)
- Appears to, seems to (observations needing confirmation)
- Likely, probably, possibly (degrees of certainty)

### 4. Anthropomorphism

**Problem:** Attributing human characteristics to non-human entities

**Examples:**

| Anthropomorphic | Scientific |
|----------------|-----------|
| "The study wanted to examine..." | "We aimed to examine..." or "The study examined..." |
| "The data suggest they want..." | "The data suggest that..." |
| "This paper will prove..." | "This paper demonstrates..." |
| "Table 1 tells us..." | "Table 1 shows..." |

### 5. Abbreviation Abuse

**Problems:**
- Too many abbreviations burden the reader
- Abbreviating terms used only once or twice
- Not defining abbreviations at first use

**Guidelines:**
- Only abbreviate terms used ≥3-4 times
- Define at first use in abstract (if used in abstract)
- Define at first use in main text
- Don't abbreviate in title
- Limit to 3-4 new abbreviations per paper when possible
- Use standard abbreviations (DNA, RNA, HIV, etc.) without definition

**Example:**
```
Poor: "We measured Expected Calibration Error (ECE) at baseline. ECE
values were elevated."
(Only used twice, abbreviation unnecessary)

Better: "We measured expected calibration error at baseline. Values were
elevated."
```

## Specific Sentence-Level Issues

### Dangling Modifiers

**Problem:**
```
"After incubating for 2 hours, we measured absorbance."
(The sentence suggests "we" were incubated)

Better: "After incubating samples for 2 hours, we measured absorbance."
Or: "After 2-hour incubation, we measured absorbance."
```

### Misplaced Commas

**Common errors:**

**Between subject and verb:**
```
Wrong: "The runs in the proposed-method group, showed improvement."
Right: "The runs in the proposed-method group showed improvement."
```

**In compound predicates:**
```
Wrong: "We measured latency, and recorded memory use."
Right: "We measured latency and recorded memory use."
(No comma before "and" when it doesn't join independent clauses)
```

### Pronoun Agreement

```
Wrong: "Each participant completed their questionnaire."
Right: "Each participant completed his or her questionnaire."
Or better: "Participants completed their questionnaires."
```

### Subject-Verb Agreement

```
Wrong: "The group of participants were heterogeneous."
Right: "The group of participants was heterogeneous."
(Subject is "group" [singular], not "participants")

But: "The participants were heterogeneous." (Plural subject)
```

## Word Choice

### Commonly Confused Words in Scientific Writing

| Often Misused | Correct Usage |
|---------------|---------------|
| **affect / effect** | Affect (verb): influence; Effect (noun): result; Effect (verb): bring about |
| **among / between** | Among: three or more; Between: two |
| **continual / continuous** | Continual: repeated; Continuous: uninterrupted |
| **data is / data are** | Data are (plural); datum is (singular) |
| **fewer / less** | Fewer: countable items; Less: continuous quantities |
| **i.e. / e.g.** | i.e. (that is): restatement; e.g. (for example): examples |
| **imply / infer** | Imply: suggest; Infer: deduce |
| **parameter / variable** | Parameter: population value; Variable: measured characteristic |
| **principal / principle** | Principal: main; Principle: rule or concept |
| **significant** | Reserve for statistical significance, not importance |
| **that / which** | That: restrictive clause; Which: nonrestrictive clause |

### Words to Avoid or Use Carefully

**Avoid informal language:**
- "a lot of" → "many" or "substantial"
- "got" → "obtained" or "became"
- "showed up" → "appeared" or "was evident"

**Avoid vague quantifiers:**
- "some" → specify how many
- "often" → specify frequency
- "recently" → specify timeframe

**Avoid unnecessary modifiers:**
- "very significant" → "significant" (p-value shows degree)
- "quite large" → "large" or specify size
- "rather interesting" → delete or explain why

## Numbers and Units

### When to Use Numerals vs. Words

**Use numerals for:**
- All numbers ≥10
- Numbers with units (5 mg, 3 mL)
- Statistical values (p=0.03, t=2.14)
- Ages, dates, times
- Scores and scales
- Percentages (15%)

**Use words for:**
- Numbers <10 when not connected to units (five participants)
- Numbers beginning a sentence (spell out or restructure)

**Examples:**
```
"Five participants withdrew" OR "There were 5 withdrawals"
(NOT: "5 participants withdrew")

"We tested 15 samples at 3 time points"
"Mean age was 45 years"
```

### Units and Formatting

**Guidelines:**
- Space between number and unit (5 mg, not 5mg)
- No period after units (mg not mg.)
- Use SI units unless field convention differs
- Be consistent in decimal places
- Use commas for thousands in text (12,500 not 12500)

**Ranges:**
- Use en-dash (–) for ranges: 15–20 mg
- Include unit only after second number: 15–20 mg (not 15 mg–20 mg)

## Paragraph Structure

### Ideal Paragraph Length

**Guidelines:**
- 3-7 sentences typically
- One main idea per paragraph
- Too short (<2 sentences): may indicate idea needs development or combining
- Too long (>10 sentences): may need splitting

### Paragraph Coherence

**Techniques:**

**1. Topic sentence:**
```
"Data augmentation improves generalization through multiple mechanisms.
[Following sentences explain these mechanisms]"
```

**2. Transitional phrases:**
- First, second, third, finally
- Furthermore, moreover, in addition
- However, nevertheless, conversely
- Therefore, thus, consequently
- For example, specifically, particularly

**3. Repetition of key terms:**
```
"...this mechanism of action. This mechanism may explain..."
(Not: "...this mechanism. This process may explain...")
```

**4. Parallel structure:**
```
"Model A used the new optimizer. Model B used SGD. Model C used no optimizer tuning."
(Not: "Model A used the new optimizer. SGD was used by Model B. No optimizer tuning was
applied to the third model.")
```

## Revision Checklist

### Content Level

- [ ] Does every sentence add value?
- [ ] Are claims supported by data?
- [ ] Is the logic clear and sound?
- [ ] Are interpretations warranted by results?

### Paragraph Level

- [ ] Does each paragraph have one main idea?
- [ ] Are paragraphs in logical order?
- [ ] Are transitions smooth?
- [ ] Is there a clear "red thread"?

### Sentence Level

- [ ] Are sentences clear and concise?
- [ ] Is sentence structure varied?
- [ ] Are there no dangling modifiers?
- [ ] Do subjects and verbs agree?

### Word Level

- [ ] Is word choice precise?
- [ ] Are technical terms defined?
- [ ] Is terminology consistent?
- [ ] Are abbreviations necessary and defined?
- [ ] Are numbers formatted correctly?

### Grammar and Mechanics

- [ ] Is verb tense correct and consistent?
- [ ] Are commas used correctly?
- [ ] Do pronouns agree with antecedents?
- [ ] Is punctuation correct?
- [ ] Is spelling correct (including technical terms)?

## Tools for Improving Writing

### Grammar and Style Checkers

- **Grammarly**: Grammar, style, clarity
- **ProWritingAid**: In-depth writing analysis
- **Hemingway Editor**: Readability, simplification
- **LanguageTool**: Open-source grammar checker

**Caution:** These tools don't understand scientific writing conventions. Use them as a starting point, not final arbiter.

### Readability Metrics

**Flesch Reading Ease:**
- 60-70: acceptable for scientific papers
- <60: may be too complex

**Caution:** Don't sacrifice precision for readability scores designed for general audiences.

### Peer Review

**Most valuable tool:**
- Ask colleagues to read and provide feedback
- Identify unclear passages
- Check logical flow
- Verify interpretations are warranted

## Additional Resources

### Books on Scientific Writing

- *The Elements of Style* by Strunk & White (classic on clear writing)
- *On Writing Well* by William Zinsser
- *Scientific Writing: A Reader and Writer's Guide* by Jean-Luc Lebrun
- *How to Write a Scientific Paper* by George M. Whitesides
- *Style: Lessons in Clarity and Grace* by Joseph Williams

### Online Resources

- **Academic Phrasebank** (University of Manchester): Common academic phrases
- **Purdue OWL**: Grammar, punctuation, style
- **Nature Masterclasses**: Scientific writing courses
- **WritingCenters**: Many universities provide free online resources

### University Writing Centers

Most research universities offer:
- Individual consultations
- Workshops on scientific writing
- Online resources and handouts
- Support for non-native English speakers

## Venue-Specific Writing Styles

### Four Major Writing Style Categories

1. **Broad-audience accessible** (Nature, Science, PNAS)
2. **Archival-journal formal** (JMLR, TPAMI, CACM)
3. **Technical-specialist** (field-specific journals)
4. **ML conference** (NeurIPS, ICML, ICLR, CVPR)

### Writing Style Comparison

| Aspect | Nature/Science | CS journal | Specialized | ML Conference |
|--------|---------------|---------|-------------|---------------|
| **Sentence length** | 15-20 words | 12-18 words | 18-25 words | 12-20 words |
| **Vocabulary** | Minimal jargon | Formal CS terms | Field-specific | Technical + math |
| **Tone** | Engaging, significant | Conservative | Formal | Direct, contribution-focused |
| **Key phrases** | "Here we show" | "We conducted" | "To elucidate" | "We propose", "Our contributions" |

**ML Conference Style:**

**Characteristics:**
- Direct, technical language with mathematical notation
- Contribution-focused (numbered lists common)
- Assumes ML expertise (CNNs, transformers, SGD, etc.)
- Emphasizes novelty and performance gains
- Pseudocode and equations expected

**Example opening (NeurIPS style):**
```
Vision transformers have achieved state-of-the-art performance on image classification,
but their quadratic complexity limits applicability to high-resolution images. We propose
Efficient-ViT, which reduces complexity to O(n log n) while maintaining accuracy. Our
contributions are: (1) a novel sparse attention mechanism, (2) theoretical analysis
showing preserved expressive power, and (3) empirical validation on ImageNet showing
15% speedup with comparable accuracy.
```
- Problem stated with technical context
- Solution previewed
- Numbered contributions
- Quantitative claims

### Key Writing Differences

| Aspect | Nature/Science | CS journal | Specialized | ML Conference |
|--------|---------------|---------|-------------|---------------|
| **Paragraph length** | 3-5 sentences | 5-7 sentences | 6-10 sentences | 4-6 sentences |
| **Math/equations** | Minimize | Rare | Moderate | Essential |
| **Active voice** | Preferred | Mixed | Passive OK | Preferred |
| **Hedging** | Moderate | Conservative | Detailed | Minimal (claim gains) |
| **Figure integration** | Tight | Systematic | Detailed | Dense, in-page |

### Evaluation Focus by Venue

| Venue | Key Evaluation Criteria |
|-------|------------------------|
| **Nature/Science** | Accessible to non-specialists? Broad significance clear? Compelling story? |
| **CS journals** | Deployment relevance apparent? Rigorous tone? Methods reproducible? |
| **Specialized** | Technical precision? Field expertise shown? Methods detailed? |
| **ML conferences** | Clear contributions? Claims supported by experiments? Reproducible? |

**Common rejection reasons:**
- Poor writing quality/unclear prose
- Inappropriate style for venue
- Overstated claims
- Methods insufficient for reproduction
- Missing key details (baselines, ablations for ML; statistics for journals)

### Quick Style Adaptation Guide

| From → To | Key Changes |
|-----------|-------------|
| **Journal → ML conference** | Add numbered contributions; include equations/pseudocode; emphasize quantitative gains; condense prose |
| **ML conference → Journal** | Remove contribution numbering; expand motivation; separate Results/Discussion; reduce equations in main text |
| **Specialist → Broad** | Simplify language; emphasize broad implications; explain technical concepts; add context for non-experts |
| **Broad → Specialist** | Add technical detail; use field terminology freely; expand mechanistic discussion; cite field literature |
| **Method paper → Applied/systems paper** | Add deployment context; use systems language; emphasize outcomes/implications; cite applied/systems evidence |

### Pre-Submission Style Checklist

**All venues:**
- [ ] Writing style matches 3-5 recent papers from venue
- [ ] Sentence length appropriate
- [ ] Technical vocabulary level correct
- [ ] Tone consistent with venue
- [ ] No overstated claims

**ML conferences add:**
- [ ] Contributions clearly numbered in intro
- [ ] Mathematical notation correct and consistent
- [ ] Pseudocode/algorithms included where appropriate
- [ ] Claims quantified (e.g., "15% faster", "2.3% accuracy gain")
- [ ] Limitations acknowledged

## Final Thoughts

Effective scientific writing is a skill developed through practice. Key principles:

1. **Clarity** trumps complexity
2. **Conciseness** respects readers' time
3. **Accuracy** builds credibility
4. **Objectivity** maintains scientific integrity
5. **Consistency** aids comprehension
6. **Logical organization** guides readers
7. **Journal-specific adaptation** maximizes publication success

**Remember:** The goal is not to impress readers with vocabulary or complexity, but to communicate your science clearly and precisely so readers can understand, evaluate, and build upon your work. Adapt your writing style to match your target journal's expectations and audience.
