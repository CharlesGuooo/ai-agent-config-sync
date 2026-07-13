# [Literature Review Title]

**Authors**: [Author Names and Affiliations]
**Date**: [Date]
**Review Type**: [Narrative / Systematic / Scoping / Meta-Analysis / Umbrella Review]
**Review Protocol**: [OSF registration link if registered, or state "Not registered"]
**Reporting Compliance**: [Yes/No/Partial - specify which reporting guidelines]

---

## Abstract

**Background**: [Context and rationale]  
**Objectives**: [Primary and secondary objectives]  
**Methods**: [Databases, dates, selection criteria, rigor appraisal]  
**Results**: [n studies included; key findings by theme]  
**Conclusions**: [Main conclusions and implications]  
**Registration**: [OSF ID or "Not registered"]  
**Keywords**: [5-8 keywords]

---

## 1. Introduction

### 1.1 Background and Context

[Provide background information on the topic. Establish why this literature review is important and timely. Discuss the broader context and current state of knowledge.]

### 1.2 Scope and Objectives

[Clearly define the scope of the review and state the specific objectives. What questions will this review address?]

**Primary Research Questions:**
1. [Research question 1]
2. [Research question 2]
3. [Research question 3]

### 1.3 Significance

[Explain the significance of this review. Why is it important to synthesize this literature now? What gaps does it fill?]

---

## 2. Methodology

### 2.1 Protocol and Registration

**Protocol**: [OSF link / registry ID / Not registered]  
**Deviations**: [Document any protocol deviations]  
**Reporting checklist**: [Screening checklist in Appendix B]

### 2.2 Search Strategy

**Databases:** [arXiv, Semantic Scholar, ACL Anthology, DBLP, OpenReview, Papers with Code, etc.]  
**Supplementary:** [Citation chaining, grey literature, code repositories]

**Search String Example:**
```
(abs:"retrieval augmented generation" OR abs:"retrieval-augmented") AND
(cat:cs.CL) AND (submittedDate:[20180101 TO 20241231])
```

**Dates:** [YYYY-MM-DD to YYYY-MM-DD] | **Executed:** [Date]  
**Validation:** [Key papers used to test search strategy]

### 2.3 Tools and Software

**Screening:** [Rayyan, Covidence, ASReview]  
**Analysis:** [VOSviewer, R, Python]  
**Citation Management:** [Zotero, Mendeley, EndNote]  
**AI Tools:** [Any AI-assisted tools used; document validation approach]

### 2.4 Inclusion and Exclusion Criteria

**Inclusion Criteria:**
- [Criterion 1: e.g., Published between 2018-2024]
- [Criterion 2: e.g., Peer-reviewed papers and preprints]
- [Criterion 3: e.g., English language]
- [Criterion 4: e.g., Releases code or reproducible artifacts]
- [Criterion 5: e.g., Original research or surveys]

**Exclusion Criteria:**
- [Criterion 1: e.g., Extended abstracts or posters without a full paper]
- [Criterion 2: e.g., Non-archival notes without results]
- [Criterion 3: e.g., Editorials and opinion pieces]
- [Criterion 4: e.g., Duplicate publications]
- [Criterion 5: e.g., Retracted or withdrawn papers]
- [Criterion 6: e.g., Papers with unavailable full text after author contact]

### 2.5 Study Selection

**Reviewers:** [n independent reviewers] | **Conflict resolution:** [Method]  
**Inter-rater reliability:** [Cohen's kappa = X]

**Search & Screening Flow:**
```
Records identified: n=[X] → Deduplicated: n=[Y] → 
Title/abstract screened: n=[Y] → Full-text assessed: n=[Z] → Included: n=[N]
```

**Exclusion reasons:** [List with counts]

### 2.6 Data Extraction

**Method:** [Standardized form (Appendix E); pilot-tested on n studies]  
**Extractors:** [n independent] | **Verification:** [Double-checked]

**Items:** Study ID, contribution type, task/problem, method/approach, baselines, datasets/metrics, results, code/data availability, funding, COI, rigor concerns

**Missing data:** [Author contact protocol]

### 2.7 Reproducibility & Rigor Appraisal

**Criteria:** [Code/data availability, baseline fairness, benchmark validity, ablation coverage, seeds/runs reported]  
**Method:** [2 independent reviewers; third for conflicts]  
**Rating:** [High/Moderate/Low reproducibility & rigor]  
**Publication bias:** [Funnel plots, Egger's test - if meta-analysis]

### 2.8 Synthesis and Analysis

**Approach:** [Narrative / Meta-analysis / Both]  
**Statistics** (if meta-analysis): Effect measures, heterogeneity (I², τ²), sensitivity analyses, subgroups  
**Software:** [RevMan, R, Stata]  
**Confidence:** [Robustness assessment; factors: rigor, inconsistency across benchmarks, generalization, statistical significance]

---

## 3. Results

### 3.1 Study Selection

**Summary:** [X records → Y deduplicated → Z full-text → N included (M in meta-analysis)]  
**Contribution types:** [New method: n=X, Empirical benchmark: n=Y, Theory: n=Z, Survey: n=W, Ablation study: n=V]  
**Years:** [Range; peak year]  
**Geography:** [Countries/institutions represented]  
**Source:** [Peer-reviewed: n=X, Preprints: n=Y]

### 3.2 Bibliometric Overview

[Optional: Trends, venue distribution, author networks, citations, keywords - if analyzed with VOSviewer or similar]

### 3.3 Study Characteristics

| Study | Year | Contribution | Benchmarks | Key Methods | Main Findings | Rigor |
|-------|------|--------------|------------|-------------|---------------|-------|
| First Author et al. | 2023 | [Type] | [Datasets] | [Methods] | [Brief findings] | [Low/Mod/High] |

**Rigor:** High: n=X ([%]); Moderate: n=Y ([%]); Low: n=Z ([%])

### 3.4 Thematic Synthesis

[Organize by themes, NOT study-by-study. Synthesize across studies to identify consensus, controversies, and gaps.]

#### 3.4.1 Theme 1: [Title]

**Findings:** [Synthesis of key findings from multiple studies]  
**Supporting studies:** [X, Y, Z]  
**Contradictory evidence:** [If any]  
**Confidence:** [Robustness rating if applicable]

### 3.5 Methodological Approaches

**Common methods:** [Method 1 (n studies), Method 2 (n studies)]  
**Emerging techniques:** [New approaches observed]  
**Methodological quality:** [Overall assessment]

### 3.6 Meta-Analysis Results

[Include only if conducting meta-analysis]

**Effect estimates:** [Primary/secondary outcomes with 95% CI, p-values]  
**Heterogeneity:** [I²=X%, τ²=Y, interpretation]  
**Subgroups & sensitivity:** [Key findings from analyses]  
**Publication bias:** [Funnel plot, Egger's p=X]  
**Forest plots:** [Include for primary outcomes]

### 3.7 Knowledge Gaps

**Knowledge:** [Unanswered research questions]  
**Methodological:** [Study design/measurement issues]  
**Practical:** [Research-to-practice gaps]  
**Settings:** [Underrepresented tasks/domains/contexts]

---

## 4. Discussion

### 4.1 Main Findings

[Synthesize key findings by research question]

**Principal findings:** [Top 3-5 takeaways]  
**Consensus:** [Where studies agree]  
**Controversy:** [Conflicting results]

### 4.2 Interpretation and Implications

**Context:** [How findings advance/challenge current understanding]  
**Mechanisms:** [Potential explanations for observed patterns]

**Implications for:**
- **Practice:** [Actionable recommendations]
- **Policy:** [If relevant]
- **Research:** [Theoretical, methodological, priority directions]

### 4.3 Strengths and Limitations

**Strengths:** [Comprehensive search, rigorous methods, large evidence base, transparency]

**Limitations:**
- Search/selection: [Language bias, database coverage, grey literature, publication bias]
- Methodological: [Heterogeneity, study quality]
- Temporal: [Rapid evolution, search cutoff date]

**Impact:** [How limitations affect conclusions]

### 4.4 Comparison with Previous Reviews

[If relevant: How does this review update/differ from prior reviews?]

### 4.5 Future Research

**Priority questions:**
1. [Question] - Rationale, suggested approach, expected impact
2. [Question] - Rationale, suggested approach, expected impact
3. [Question] - Rationale, suggested approach, expected impact

**Recommendations:** [Methodological improvements, understudied tasks, emerging technologies]

---

## 5. Conclusions

[Concise conclusions addressing research questions]

1. [Conclusion directly addressing primary research question]
2. [Key finding conclusion]
3. [Gap/future direction conclusion]

**Evidence confidence:** [High/Moderate/Low]  
**Deployment readiness:** [Ready / Needs more research / Preliminary]

---

## 6. Declarations

### Author Contributions
[CRediT taxonomy: Author 1 - Conceptualization, Methodology, Writing; Author 2 - Analysis, Review; etc.]

### Funding
[Grant details with numbers] OR [No funding received]

### Conflicts of Interest
[Author-specific declarations] OR [None]

### Data Availability
**Protocol:** [OSF ID or "Not registered"]  
**Data/Code:** [Repository URL/DOI or "Available upon request"]  
**Materials:** [Search strategies (Appendix A), screening checklist (Appendix B), extraction form (Appendix E)]

### Acknowledgments
[Contributors not meeting authorship criteria, librarians, community/user involvement]

---

## 7. References

[Use consistent style: APA / IEEE / ACM / Nature]

**Format examples:**

APA: Author, A. A., & Author, B. B. (Year). Title. *Journal*, *volume*(issue), pages. https://doi.org/xx.xxxx

Nature: Author, A. A. & Author, B. B. Title. *J. Name* **volume**, pages (year).

IEEE: [#] A. A. Author and B. B. Author, "Title," *J. Abbrev.*, vol. x, no. x, pp. xxx-xxx, Year.

1. [First reference]
2. [Second reference]
3. [Continue...]

---

## 8. Appendices

### Appendix A: Search Strings

**arXiv** (Date: YYYY-MM-DD; Results: n)
```
[Complete search string with field prefixes and Boolean operators]
```

[Repeat for each database: Semantic Scholar, ACL Anthology, DBLP, OpenReview, Papers with Code, etc.]

### Appendix B: Screening Checklist

| Section | Item | Reported? | Page |
|---------|------|-----------|------|
| Title | Identify as systematic review | Yes/No | # |
| Abstract | Structured summary | Yes/No | # |
| Methods | Eligibility, sources, search, selection, data, rigor appraisal | Yes/No | # |
| Results | Selection, characteristics, rigor appraisal, syntheses | Yes/No | # |
| Discussion | Interpretation, limitations, conclusions | Yes/No | # |
| Other | Registration, support, conflicts, availability | Yes/No | # |

### Appendix C: Excluded Studies

| Study | Year | Reason | Category |
|-------|------|--------|----------|
| Author et al. | Year | [Reason] | [Wrong task/metric/contribution/etc.] |

**Summary:** Wrong task (n=X), Wrong benchmark (n=Y), etc.

### Appendix D: Reproducibility & Rigor Appraisal

**Criteria:** [Code/data availability, baseline fairness, benchmark validity, ablation coverage]

| Study | Code/Data | Baseline Fairness | Benchmark Validity | Overall |
|-------|-----------|-------------------|--------------------|---------|
| Study 1 | High | High | Some concerns | High |
| Study 2 | [Score] | [Score] | [Score] | [Overall] |

### Appendix E: Data Extraction Form

```
STUDY: Author______ Year______ DOI/arXiv______
CONTRIBUTION: □New method □Empirical benchmark □Theory □Survey □Ablation study □Other______
TASK/PROBLEM: Domain_____ Setting_____
METHOD/APPROACH: _____
BASELINES: _____
BENCHMARKS/METRICS: Datasets_____ Metrics_____
RESULTS: Score_____ 95%CI_____ Significance_____
REPRODUCIBILITY: □Code □Data □Seeds □Runs reported
RIGOR: □Low □Moderate □High
FUNDING/COI: _____
```

### Appendix F: Meta-Analysis Details

[Only if meta-analysis performed]

**Software:** [R 4.x.x with meta/metafor packages / RevMan / Stata]  
**Model:** [Random-effects; justification]  
**Code:** [Link to repository]  
**Sensitivity analyses:** [Details]

### Appendix G: Author Contacts

| Study | Contact Date | Response | Data Received |
|-------|--------------|----------|---------------|
| Author et al. | YYYY-MM-DD | Yes/No | Yes/No/Partial |

---

## 9. Supplementary Materials

[If applicable]

**Tables:** S1 (Full study characteristics), S2 (Rigor scores), S3 (Subgroups), S4 (Sensitivity)  
**Figures:** S1 (Search & screening flow diagram), S2 (Rigor appraisal), S3 (Funnel plot), S4 (Forest plots), S5 (Networks)  
**Data:** S1 (Extraction file), S2 (Search results), S3 (Analysis code), S4 (Screening checklist)  
**Repository:** [OSF/GitHub/Zenodo URL with DOI]

---

## Review Metadata

**Registration:** [Registry] ID: [Number] (Date: YYYY-MM-DD)  
**Search dates:** Initial: [Date]; Updated: [Date]  
**Version:** [1.0] | **Last updated:** [Date]

**Quality checks:**
- [ ] Citations verified with verify_citations.py
- [ ] Screening checklist completed
- [ ] Search reproducible
- [ ] Independent data verification
- [ ] Code peer-reviewed
- [ ] All authors approved

---

## Usage Notes

**Review type adaptations:**
- Systematic Review: Use all sections
- Meta-Analysis: Include sections 3.6, Appendix F
- Narrative Review: May omit some methodology detail
- Scoping Review: Broad mapping of the field, may omit rigor appraisal

**Key principles:**
1. Remove all [bracketed placeholders]
2. Follow transparent reporting guidelines (records identified → screened → included)
3. Pre-register when feasible (OSF)
4. Use thematic synthesis, not study-by-study
5. Be transparent and reproducible
6. Verify all DOIs before submission
7. Make data/code openly available

**Common pitfalls to avoid:**
- Don't list studies - synthesize them
- Don't cherry-pick results
- Don't ignore limitations
- Don't overstate conclusions
- Don't skip publication bias assessment

**Resources:**
- arXiv API: https://info.arxiv.org/help/api/index.html
- Semantic Scholar API: https://api.semanticscholar.org/api-docs/
- Papers with Code: https://paperswithcode.com/
- ACL Anthology: https://aclanthology.org/
- OSF: https://osf.io/

**DELETE THIS SECTION FROM YOUR FINAL REVIEW**

---
