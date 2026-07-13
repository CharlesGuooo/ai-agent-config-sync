# IMRAD Structure Guide

## Overview

IMRAD (Introduction, Methods, Results, And Discussion) is the predominant organizational structure for scientific journal articles of original research. Adopted as the majority format since the 1970s, it is now the standard across computer science, engineering, and the natural sciences.

## Why IMRAD?

The IMRAD structure mirrors the scientific method:
- **Introduction**: What question did you ask?
- **Methods**: How did you study it?
- **Results**: What did you find?
- **Discussion**: What does it mean?

This logical flow makes scientific papers easier to write, read, and evaluate.

## Complete Manuscript Components

A full scientific manuscript typically includes these sections in order:

1. **Title**
2. **Abstract**
3. **Introduction**
4. **Methods** (also called Materials and Methods, Methodology)
5. **Results**
6. **Discussion** (sometimes combined with Results)
7. **Conclusion** (sometimes part of Discussion)
8. **Acknowledgments**
9. **References**
10. **Supplementary Materials** (if applicable)

## Title

### Purpose
Attract readers and accurately represent the paper's content.

### Guidelines
- Be concise yet descriptive (typically 10-15 words)
- Include key variables and the relationship studied
- Avoid abbreviations, jargon, and question formats (unless the journal allows)
- Make it specific enough to distinguish from other studies
- Include key search terms for discoverability

### Examples
- Good: "Effects of Sparse Attention on Long-Context Accuracy in Transformer Language Models"
- Too vague: "Deep Learning and Performance"
- Too detailed: "A Controlled Study Examining the Effects of Sparse Attention Compared to Dense Attention on Long-Context Accuracy Measured by Perplexity in Transformer Models with 100M-1B Parameters"

## Abstract

### Purpose
Provide a complete, standalone summary enabling readers to decide if the full paper is relevant to them.

### Format: Flowing Paragraphs (Default)

**⚠️ CRITICAL: Write abstracts as flowing paragraphs, NOT with labeled sections.**

Most scientific papers use **unstructured abstracts** written as one or two cohesive paragraphs. This is the standard format for the majority of journals including Nature, Science, Cell, PNAS, and most field-specific journals.

❌ **WRONG - Structured abstract with labels:**
```
Background: Long-context inference in transformers remains computationally expensive.
Methods: We propose a sparse attention mechanism and evaluate it on five benchmarks...
Results: The method reduces latency by 47% with no loss in accuracy...
Conclusions: Sparse attention significantly improves inference efficiency.
```

✅ **CORRECT - Flowing paragraph style:**
```
Long-context inference in transformer models remains computationally expensive, yet 
efficient attention mechanisms often trade away accuracy. We propose a sparse attention 
mechanism and evaluate it on five long-context benchmarks against dense-attention and 
low-rank baselines, training each configuration with five random seeds. Across 
benchmarks, our method reduced inference latency by 47% (95% CI: 38-56%, p<0.001) while 
matching dense-attention accuracy, and improved long-document retrieval from 3.2 to 1.8 
errors per 1000 queries (relative reduction 0.56, 95% CI: 0.38-0.83, p=0.004). No 
degradation was observed on short-context tasks. These findings demonstrate that sparse 
attention significantly improves inference efficiency without sacrificing accuracy, 
suggesting it may be a valuable component of long-context language models.
```

### Abstract Structure (as unified paragraph)

While written as flowing prose, the abstract should cover these elements in order:

1. **Context and problem** (1-2 sentences): Why the research matters, what gap exists
2. **Study description** (1-2 sentences): What was done and how (study design, methods)
3. **Key findings** (2-4 sentences): Main results with specific quantitative data
4. **Significance** (1-2 sentences): Interpretation, implications, and conclusions

### Length
- Typically 150-300 words (check journal requirements)
- Some journals allow up to 350 words

### Key Rules
- Write the abstract **last** (after completing all other sections)
- **Write as flowing paragraph(s)** - no labeled sections
- Make it fully understandable without reading the paper
- Do not cite references in the abstract
- Avoid abbreviations or define them at first use
- Use past tense for methods and results, present tense for conclusions
- Include key quantitative results with statistical measures
- Use transitions to connect sentences naturally

### When to Use Structured Abstracts (Exception)

Only use labeled sections (Background/Objective, Methods, Results, Conclusions) when:
- The journal **explicitly requires** structured abstracts in their author guidelines
- Uncommon in CS/ML venues; a few applied or interdisciplinary journals request them
- Always check venue requirements before formatting

Even for structured abstracts, write each section as complete sentences, not fragments.

### Example: Flowing Paragraph Abstract

```
Learned performance models offer unique advantages for compiler optimization by 
capturing complex interactions between code and hardware. Using a corpus of over 1.2 
million compiled functions with measured execution times, we developed deep neural 
network models to predict runtime from static code features. Our best-performing model 
achieved a mean absolute error of 4.2% (R² = 0.89) on held-out test data, substantially 
outperforming traditional machine learning approaches including elastic net regression 
(MAE = 6.8%) and random forests (MAE = 5.9%). Feature importance analysis identified 
loop structure, memory-access patterns, and instruction mix as the strongest predictors. 
Cross-architecture validation revealed that x86 and ARM targets yielded the most accurate 
predictions, while GPU kernels showed the highest variance. These findings establish deep 
learning as a powerful approach for runtime prediction and identify candidate features 
for hardware-aware performance modeling.
```

## Introduction

### Purpose
Convince readers that the research addresses an important question using an appropriate approach.

### Structure and Content

**Paragraph 1: The Big Picture**
- Establish the broad research area
- Explain why this topic matters
- Use present tense for established facts
- Keep it accessible to non-specialists

**Paragraphs 2-3: Narrowing Down**
- Review relevant prior research
- Show what is already known
- Identify controversies or limitations in existing work
- Create a logical progression toward the gap

**Paragraph 4: The Gap**
- Explicitly identify what remains unknown
- Explain why this knowledge gap is problematic
- Connect the gap to the big picture importance

**Final Paragraph: This Study**
- State the specific research question or hypothesis
- Describe the overall approach briefly
- Explain how this study addresses the gap
- Optional: Preview key findings (some journals discourage this)

### Length
- Typically 1.5-2 pages (depending on journal)
- Usually 4-5 paragraphs
- Shorter for letters/brief communications

### Verb Tense
- **Present tense**: Established facts ("Exercise improves cardiovascular health")
- **Past tense**: Previous studies and their findings ("Smith et al. found that...")
- **Present/past tense**: Your study aims ("This study investigates..." or "This study investigated...")

### Common Mistakes to Avoid
- Starting too broad (e.g., "Since the beginning of time...")
- Exhaustive literature review (save for review articles)
- Citing irrelevant or outdated references
- Failing to identify a clear gap
- Weak justification for the study
- Not stating a clear research question or hypothesis
- Including methods or results (these belong in later sections)

### Key Questions to Answer
1. What do we know about this topic?
2. What don't we know? (the gap)
3. Why does this gap matter?
4. What did this study aim to find out?

## Methods

### Purpose
Provide sufficient detail for others to replicate the study and evaluate its validity.

### Key Principle
Another expert in the field should be able to repeat your experiment exactly as you performed it.

### Standard Subsections

#### Study Design
- State the overall design (e.g., controlled experiment, ablation study, benchmark evaluation, user study)
- Justify the design choice if not obvious
- Mention baselines, controls, and how conditions were held fixed if applicable

#### Datasets/Participants/Sample
- Define the datasets or population of interest
- Describe inclusion and exclusion (or filtering) criteria precisely
- Report dataset size / sample size and how it was determined
- Explain data sources, collection, or recruitment methods and setting
- For datasets: specify version, splits, preprocessing, license, and any known biases (e.g., a Datasheet)

#### Materials and Equipment
- List all materials, reagents, and equipment used
- Include manufacturer names and locations (in parentheses)
- Specify catalog numbers for specialized items
- Report software names and versions

#### Procedures
- Describe what was done in chronological order
- Include sufficient detail for replication
- Use subheadings to organize complex procedures
- Specify timing (e.g., "incubated for 2 hours at 37°C")
- For surveys/interviews: describe instruments, validation, administration

#### Measurements and Outcomes
- Define all variables measured
- Specify primary and secondary outcomes
- Describe measurement instruments and their validity
- Include units of measurement

#### Statistical Analysis
- Name all statistical tests used
- Justify test selection
- State significance level (typically α = 0.05)
- Report power analysis for sample size
- Name statistical software with version
- Describe handling of missing data
- Mention adjustments for multiple comparisons if applicable

#### Ethical Considerations
- For human-subjects studies (e.g., user studies): state IRB/ethics approval (with approval number)
- Mention informed consent procedures where applicable
- For datasets: document provenance, consent, licensing, and PII handling (e.g., a Datasheet)
- Include a broader-impacts / ethics statement where the venue requires it (e.g., NeurIPS)

### Length
- Typically 2-4 pages
- Proportional to study complexity

### Verb Tense
- **Past tense** for actions you performed ("We measured...", "Participants completed...")
- **Present tense** for established procedures ("PCR amplifies...", "The questionnaire contains...")

### Common Mistakes
- Insufficient detail for replication
- Methods appearing for the first time in Results
- Including results or discussion
- Missing statistical tests
- Undefined abbreviations
- Lack of ethical approval statement

## Results

### Purpose
Present the findings objectively without interpretation.

### Key Principle
Show, don't interpret. Save interpretation for the Discussion.

### Structure and Content

**Opening Paragraph**
- Describe the dataset/sample characteristics
- Report data flow (e.g., collected, filtered, split into train/val/test)
- Consider including a data/experiment pipeline diagram

**Subsequent Paragraphs**
- Present results in logical order (usually primary outcome first)
- Follow the order of objectives stated in Introduction
- Organize by theme or by chronology, depending on what's clearest
- Reference figures and tables by number

**Each Finding Should Include:**
- The observed result
- The direction of the effect
- The magnitude of the effect
- The statistical significance
- The confidence interval

**Example**: "Top-1 accuracy improved by 12 points for the proposed model compared to 3 points for the baseline (difference: 9 points, 95% CI: 4-14, p=0.002)."

### Integration with Figures and Tables

**When to Use:**
- **Figures**: Trends, patterns, distributions, comparisons, relationships
- **Tables**: Precise values, demographic data, multiple variables

**How to Reference:**
- "Figure 1 shows the distribution of..." (not "Figure 1 below")
- "Table 2 presents baseline characteristics..."
- Don't repeat all table data in text; highlight key findings
- Each figure/table should be referenced in text

### Figures and Tables Guidelines
- Number consecutively in order of mention
- Include complete, standalone captions
- Define all abbreviations in caption or footnote
- Report sample sizes (n)
- Indicate statistical significance (*, p-values)
- Use consistent formatting

### Statistical Reporting

**Required Elements:**
- Test statistic (t, F, χ², etc.)
- Degrees of freedom
- p-value (exact if p > 0.001, otherwise report as "p < 0.001")
- Effect size and confidence interval
- Sample sizes

**Example**: "Groups differed significantly on test performance (t(48) = 3.21, p = 0.002, Cohen's d = 0.87, 95% CI: 0.34-1.40)."

### Length
- Typically 2-4 pages
- Roughly equivalent to Methods length

### Verb Tense
- **Past tense** for your findings ("The mean was...", "Participants showed...")

### Common Mistakes
- Interpreting results (save for Discussion)
- Repeating all table/figure data in text
- Presenting new methods
- Insufficient statistical detail
- Inconsistent units or notation
- Not addressing negative or unexpected findings
- Selective reporting (all tested hypotheses should be reported)

### Organization Strategies

**By Objective:**
```
Effect of intervention on primary outcome
Effect of intervention on secondary outcome A
Effect of intervention on secondary outcome B
```

**By Analysis Type:**
```
Descriptive statistics
Univariate analyses
Multivariate analyses
```

**Chronological:**
```
Baseline characteristics
Short-term outcomes (1 month)
Long-term outcomes (6 months)
```

## Discussion

### Purpose
Interpret findings, relate them to existing knowledge, acknowledge limitations, and propose future directions.

### Structure and Content

**Paragraph 1: Summary of Main Findings**
- Restate the primary objective or hypothesis
- Summarize the principal findings in 2-4 sentences
- Avoid repeating details from Results
- State clearly whether the hypothesis was supported

**Paragraphs 2-4: Interpretation in Context**
- Compare your findings with previous research
- Explain agreements and disagreements with prior work
- Propose mechanisms or explanations for findings
- Discuss unexpected results
- Consider alternative explanations
- Address whether findings support or refute existing theories

**Paragraph 5: Strengths and Limitations**
- Acknowledge study limitations honestly
- Explain how limitations might affect interpretation
- Mention study strengths (design, sample, methods)
- Avoid generic limitations ("larger sample needed")—be specific

**Paragraph 6: Implications**
- Practical / deployment implications (for applied research)
- Practical applications
- Policy implications
- Theoretical contributions

**Final Paragraph: Conclusions and Future Directions**
- Summarize the take-home message
- Suggest specific future research to address gaps or limitations
- End with a strong concluding statement

### Length
- Typically 3-5 pages
- Usually the longest section

### Verb Tense
- **Past tense**: Your study findings ("We found that...", "The results showed...")
- **Present tense**: Established facts and your interpretations ("This suggests that...", "These findings indicate...")
- **Future tense**: Implications and future research ("Future studies should investigate...")

### Discussion Strategies

**Comparing to Prior Work:**
```
"Our finding of a 30% reduction in error aligns with Smith et al. (2023), who
reported a 28% reduction using a similar method. However, Jones et al. (2022)
found no significant improvement, possibly due to their smaller training budget."
```

**Proposing Mechanisms:**
```
"The observed improvement in accuracy may result from the sparse attention mechanism
focusing on more relevant tokens, as evidenced by the concurrent increase in attention
mass on salient positions in later layers. This interpretation is consistent with the
hypothesis that redundant attention limits long-context performance."
```

**Acknowledging Limitations:**
```
"Evaluating on a single benchmark prevents strong generalization claims. Additionally, using
one model family trained on a single corpus may limit generalizability to other domains.
Automatic metrics may not capture all aspects of quality, though we attempted to
mitigate this with a human evaluation."
```

### Common Mistakes
- Simply repeating results without interpretation
- Over-interpreting findings or claiming causation without warrant
- Ignoring inconsistent or negative findings
- Failing to compare with existing literature
- Introducing new data or methods
- Generic or superficial discussion of limitations
- Overgeneralization beyond the study population
- Missing the "so what?"—failing to explain significance

### Key Questions to Answer
1. What do these findings mean?
2. How do they compare to prior research?
3. Why might differences exist?
4. What are alternative explanations?
5. What are the limitations?
6. What are the practical implications?
7. What should future research investigate?

## Conclusion

### Purpose
Provide a concise summary of key findings and their significance.

### Placement
- May be a separate section or the final paragraph of Discussion (check journal requirements)

### Content
- 1-2 paragraphs maximum
- Restate the main finding(s)
- Emphasize the significance or implications
- End with a strong, memorable statement
- Do NOT introduce new information

### Example
```
This study demonstrates that sparse attention significantly reduces inference latency in
long-context transformers while matching dense-attention accuracy, with gains persisting
across five benchmarks. These findings support integrating sparse attention into production
long-context models. Given the efficiency and simplicity of the approach, it offers a
promising strategy to address the growing cost of long-context inference at scale.
```

## Additional Sections

### Acknowledgments
- Thank funding sources (with grant numbers)
- Acknowledge substantial contributions not qualifying for authorship
- Thank those who provided materials, equipment, or assistance
- Declare any conflicts of interest

### References
- Format according to journal style (see `citation_styles.md`)
- Verify all citations are accurate
- Ensure all citations appear in text and vice versa
- Typical range: 20-50 references for original research

### Supplementary Materials
- Additional figures, tables, or data sets
- Detailed protocols or questionnaires
- Video or audio files
- Large datasets or code repositories

## Tense Usage Summary

| Section | Verb Tense |
|---------|-----------|
| Abstract - Background | Present (established facts) or past (prior studies) |
| Abstract - Methods | Past |
| Abstract - Results | Past |
| Abstract - Conclusions | Present |
| Introduction - General background | Present |
| Introduction - Prior studies | Past |
| Introduction - Your objectives | Present or past |
| Methods | Past (your actions), present (general procedures) |
| Results | Past |
| Discussion - Your findings | Past |
| Discussion - Interpretations | Present |
| Discussion - Prior work | Present or past |
| Conclusion | Present |

## IMRAD Variations

### Combined Results and Discussion
- Some journals allow or require this format
- Interweaves presentation and interpretation
- Each result is presented then immediately discussed
- Useful for complex studies with multiple experiments

### IMRaD without separate Conclusion
- Conclusion integrated into final Discussion paragraph
- Common in many journals

### Extended IMRAD (ILMRaD)
- Adds "Literature Review" as separate section
- More common in theses and dissertations

## Adapting IMRAD to Different Study Types

### Empirical ML Papers
- Add a data/experiment pipeline diagram in Results/Experiments
- Include dataset versions, splits, and seeds in Methods
- Report ablations and failure cases in Results

### Systematic Reviews/Surveys
- Methods describes search strategy and inclusion criteria
- Results includes a search & screening flow diagram and synthesis
- May have additional sections (taxonomy, quality/rigor assessment)

### Case Studies / Deployment Reports
- Introduction: background on the system or deployment setting
- System Description: replaces Methods and Results
- Discussion: relates the case to prior work

### Systems / Measurement Studies
- Follow reproducibility reporting standards (e.g., the NeurIPS checklist)
- Careful attention to confounds (hardware, warm-up, variance) in Methods
- Discussion addresses threats to validity and generalizability

## Venue-Specific Structure Expectations

### Journal vs. Conference Formats

| Venue Type | Length | Structure | Methods Placement | Key Focus |
|-----------|--------|-----------|-------------------|-----------|
| **Nature/Science** | 2,000-4,500 words | Modified IMRAD | Supplement | Broad significance |
| **CS journals (TPAMI/JMLR)** | 8,000-12,000 words | Standard IMRAD | Main text | Rigor and reproducibility |
| **Field journals** | 3,000-6,000 words | Standard IMRAD | Main text | Technical depth |
| **ML conferences** | 8-9 pages (~6,000 words) | Intro-Method-Experiments-Conclusion | Main text (concise) | Novel contribution |

### ML Conference Structure (NeurIPS/ICML/ICLR)

**Typical 8-page structure:**
1. **Abstract** (150-200 words): Problem, method, key results
2. **Introduction** (1 page): Motivation, contribution summary, related work overview
3. **Method** (2-3 pages): Technical approach, architecture, algorithms
4. **Experiments** (2-3 pages): Setup, datasets, baselines, results, ablations
5. **Related Work** (0.5-1 page, often in appendix): Detailed literature comparison
6. **Conclusion** (0.25-0.5 pages): Summary, limitations, future work
7. **References** (within page limit or separate depending on conference)
8. **Appendix/Supplement** (unlimited): Additional experiments, proofs, details

**Key differences from journals:**
- **Contribution bullets**: Often numbered list in intro (e.g., "Our contributions are: (1)... (2)... (3)...")
- **No separate Results/Discussion**: Integrated in Experiments section
- **Ablation studies**: Critical component showing what matters
- **Computational requirements**: Often required (training time, GPUs, memory)
- **Code availability**: Increasingly expected

### Section Length Proportions

| Venue | Intro | Methods | Results/Experiments | Discussion/Conclusion |
|-------|-------|---------|---------------------|----------------------|
| **Nature/Science** | 10% | 15%* | 40% | 35% |
| **CS journals (TPAMI/JMLR)** | 10% | 25% | 30% | 35% |
| **Field journals** | 20% | 25% | 30% | 25% |
| **ML conferences** | 12-15% | 30-35% | 40-45% | 5-8% |

*Methods often in supplement for Nature/Science

**Key CS journal features:**
- TPAMI/JMLR/CACM: Standard IMRAD; rigor focus; thorough Discussion; reproducibility-checklist compliance
- Clear primary/secondary metrics; pre-specified evaluation protocol

**Key ML conference features:**
- Numbered contribution list in intro
- Method details with pseudocode/equations
- Extensive experiments: main results, ablations, analysis
- Brief conclusion (limitations noted)
- Related work often in appendix

### Writing Style by Venue

| Venue | Audience | Intro Focus | Methods Detail | Results/Experiments | Discussion/Conclusion |
|-------|----------|-------------|----------------|---------------------|----------------------|
| **Nature/Science** | Non-specialists | Broad significance | Brief, supplement | Story-driven | Broad implications |
| **CS journals** | CS researchers | Problem framing | Comprehensive | Primary metric first | Deployment relevance |
| **Specialized** | Experts | Field context | Full technical | By experiment | Mechanistic depth |
| **ML conferences** | ML researchers | Novel contribution | Reproducible | Baselines, ablations | Brief, limitations |

**ML conference emphasis:**
- **Introduction**: Clear problem statement; numbered contributions; positioning vs. prior work
- **Method**: Mathematical notation; pseudocode; architecture diagrams; complexity analysis
- **Experiments**: Datasets described; multiple baselines; ablation studies; error analysis
- **Conclusion**: Summary; acknowledged limitations; broader impact (if required)

### Evaluation Across Venues

**What gets checked:**
- **Fit**: Appropriate for venue scope and audience
- **Length**: Within limits (strict for conferences)
- **Clarity**: Writing quality sufficient; claims supported
- **Reproducibility**: Methods enable replication
- **Completeness**: All outcomes reported; limitations acknowledged

**Common rejection reasons:**
- Insufficient significance for venue
- Methods lack detail for reproduction
- Results don't support claims
- Discussion overstates findings
- Page/word limits exceeded (conferences strict)

**ML conference specific evaluation:**
- Clear problem formulation and motivation
- Novelty and contribution well-articulated
- Baselines comprehensive and fair
- Ablation studies demonstrate what works
- Code/data availability (increasingly required)
- Reproducibility information (seeds, hyperparameters)

### Quick Adaptation Guide

**Journal → ML conference:**
- Condense intro; add numbered contributions
- Methods: keep concise, add pseudocode
- Combine Results+Discussion → Experiments section
- Add extensive ablations and baseline comparisons
- Brief conclusion with limitations

**ML conference → Journal:**
- Expand introduction with more background
- Separate Methods section with full details
- Split Experiments into Results and Discussion
- Remove contribution numbering
- Expand limitations discussion

**Specialist → Broad journal:**
- Simplify intro; emphasize broad significance
- Move technical methods to supplement
- Story-driven results organization
- Lead discussion with implications

**Broad → Specialist:**
- Add detailed literature review
- Full methods in main text
- Organize results by experiment
- Add mechanistic discussion depth

### Pre-Submission Structure Checklist

**All venues:**
- [ ] Word/page count within limits
- [ ] Section proportions appropriate
- [ ] Writing style matches venue
- [ ] Methods enable reproducibility
- [ ] Limitations acknowledged

**ML conferences add:**
- [ ] Contributions clearly listed
- [ ] Ablation studies included
- [ ] Baselines comprehensive
- [ ] Hyperparameters/seeds reported
- [ ] Code availability statement
