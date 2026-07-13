---
name: literature-review
description: Conduct comprehensive, systematic literature reviews using multiple academic databases (arXiv, Semantic Scholar, ACL Anthology, DBLP, OpenReview, Papers with Code, etc.). This skill should be used when conducting systematic literature reviews, research synthesis, or comprehensive literature searches across AI/ML, computer science, and technical domains. Creates professionally formatted markdown documents and PDFs with verified citations in multiple citation styles (APA, IEEE, ACM, etc.).
allowed-tools: Read Write Edit Bash
license: MIT license
metadata:
    skill-author: K-Dense Inc.
---

# Literature Review

## Overview

Conduct systematic, comprehensive literature reviews following rigorous academic methodology. Search multiple literature databases, synthesize findings thematically, verify all citations for accuracy, and generate professional output documents in markdown and PDF formats.

This skill integrates with the paper-library skill and academic APIs for database access (arXiv, Semantic Scholar) and provides specialized tools for citation verification, result aggregation, and document generation.

## When to Use This Skill

Use this skill when:
- Conducting a systematic literature review for research or publication
- Synthesizing current knowledge on a specific topic across multiple sources
- Performing research synthesis or scoping reviews
- Writing the literature review section of a research paper or thesis
- Investigating the state of the art in a research domain
- Identifying research gaps and future directions
- Requiring verified citations and professional formatting

## Visual Enhancement with Scientific Schematics

**⚠️ MANDATORY: Every literature review MUST include at least 1-2 AI-generated figures using the scientific-schematics skill.**

This is not optional. Literature reviews without visual elements are incomplete. Before finalizing any document:
1. Generate at minimum ONE schematic or diagram (e.g., a search & screening flow diagram for systematic reviews)
2. Prefer 2-3 figures for comprehensive reviews (search strategy flowchart, thematic synthesis diagram, conceptual framework)

**How to generate figures:**
- Use the **scientific-schematics** skill to generate AI-powered publication-quality diagrams
- Simply describe your desired diagram in natural language
- Nano Banana Pro will automatically generate, review, and refine the schematic

**How to generate schematics:**
```bash
python scripts/generate_schematic.py "your diagram description" -o figures/output.png
```

The AI will automatically:
- Create publication-quality images with proper formatting
- Review and refine through multiple iterations
- Ensure accessibility (colorblind-friendly, high contrast)
- Save outputs in the figures/ directory

**When to add schematics:**
- Search & screening flow diagrams for systematic reviews
- Literature search strategy flowcharts
- Thematic synthesis diagrams
- Research gap visualization maps
- Citation network diagrams
- Conceptual framework illustrations
- Any complex concept that benefits from visualization

For detailed guidance on creating schematics, refer to the scientific-schematics skill documentation.

---

## Core Workflow

Literature reviews follow a structured, multi-phase workflow:

### Phase 1: Planning and Scoping

1. **Define Research Question**: Use a structured framing such as Problem / Method / Baseline / Metric (equivalently Task / Approach / Baselines / Benchmarks)
   - Example: "How does retrieval-augmented generation (Method) improve open-domain question answering (Problem/Task) compared to a closed-book LLM (Baseline) as measured by exact-match and F1 (Metric)?"

2. **Establish Scope and Objectives**:
   - Define clear, specific research questions
   - Determine review type (narrative, systematic, scoping, meta-analysis)
   - Set boundaries (time period, geographic scope, study types)

3. **Develop Search Strategy**:
   - Identify 2-4 main concepts from research question
   - List synonyms, abbreviations, and related terms for each concept
   - Plan Boolean operators (AND, OR, NOT) to combine terms
   - Select minimum 3 complementary databases

4. **Set Inclusion/Exclusion Criteria**:
   - Date range (e.g., last 10 years: 2015-2024)
   - Language (typically English, or specify multilingual)
   - Publication types (peer-reviewed, preprints, reviews)
   - Contribution types (empirical benchmarks, new methods, theory, surveys, etc.)
   - Document all criteria clearly

### Phase 2: Systematic Literature Search

1. **Multi-Database Search**:

   Select databases appropriate for the domain:

   **AI / ML / Computer Science:**
   - Use the `paper-library` skill or the arXiv API for preprints (cs.LG, cs.CL, cs.CV, stat.ML, etc.)
   - Use the Semantic Scholar API for cross-disciplinary metadata and citation graphs
   - Use ACL Anthology for NLP/computational linguistics venues
   - Use DBLP for authoritative CS bibliographic records

   **General Scientific Literature:**
   - Search arXiv via direct API (preprints in CS, math, physics, statistics)
   - Search Semantic Scholar via API (200M+ papers, cross-disciplinary)
   - Use Google Scholar for comprehensive coverage (manual or careful scraping)

   **Specialized Resources:**
   - Use Papers with Code for SOTA leaderboards, benchmarks, and code links
   - Use OpenReview for peer reviews and open discussion (ICLR, NeurIPS, etc.)
   - Use IEEE Xplore and the ACM Digital Library for published proceedings/journals
   - Use specialized resources as appropriate for the subfield

2. **Document Search Parameters**:
   ```markdown
   ## Search Strategy

   ### Database: arXiv
   - **Date searched**: 2024-10-25
   - **Date range**: 2015-01-01 to 2024-10-25
   - **Search string**:
     ```
     (ti:"retrieval-augmented generation" OR abs:"RAG")
     AND cat:cs.CL
     AND submittedDate:[20150101 TO 20241025]
     ```
   - **Results**: 247 papers
   ```

   Repeat for each database searched.

3. **Export and Aggregate Results**:
   - Export results in JSON format from each database
   - Combine all results into a single file
   - Use `scripts/search_databases.py` for post-processing:
     ```bash
     python search_databases.py combined_results.json \
       --deduplicate \
       --format markdown \
       --output aggregated_results.md
     ```

### Phase 3: Screening and Selection

1. **Deduplication**:
   ```bash
   python search_databases.py results.json --deduplicate --output unique_results.json
   ```
   - Removes duplicates by DOI (primary) or title (fallback)
   - Document number of duplicates removed

2. **Title Screening**:
   - Review all titles against inclusion/exclusion criteria
   - Exclude obviously irrelevant studies
   - Document number excluded at this stage

3. **Abstract Screening**:
   - Read abstracts of remaining studies
   - Apply inclusion/exclusion criteria rigorously
   - Document reasons for exclusion

4. **Full-Text Screening**:
   - Obtain full texts of remaining studies
   - Conduct detailed review against all criteria
   - Document specific reasons for exclusion
   - Record final number of included studies

5. **Create Search & Screening Flow Diagram**:
   ```
   Initial search: n = X
   ├─ After deduplication: n = Y
   ├─ After title screening: n = Z
   ├─ After abstract screening: n = A
   └─ Included in review: n = B
   ```

### Phase 4: Data Extraction and Quality Assessment

1. **Extract Key Data** from each included study:
   - Paper metadata (authors, year, venue, DOI/arXiv ID)
   - Method design and experimental setup
   - Datasets, benchmarks, and evaluation metrics
   - Key findings and reported results
   - Limitations noted by authors
   - Code/data availability and reproducibility notes

2. **Assess Reproducibility and Rigor**:
   - **Reproducibility**: code/data available, fixed seeds, multiple runs, reported variance
   - **Baseline fairness**: strong and correctly tuned baselines, matched compute/data budgets
   - **Benchmark validity**: appropriate datasets/metrics, no test-set leakage, honest evaluation protocol
   - **Ablation coverage**: key design choices isolated and justified
   - Rate each paper: High, Moderate, Low, or Very Low rigor
   - Consider excluding very low-rigor papers

3. **Organize by Themes**:
   - Identify 3-5 major themes across studies
   - Group studies by theme (studies may appear in multiple themes)
   - Note patterns, consensus, and controversies

### Phase 5: Synthesis and Analysis

1. **Create Review Document** from template:
   ```bash
   cp assets/review_template.md my_literature_review.md
   ```

2. **Write Thematic Synthesis** (NOT study-by-study summaries):
   - Organize Results section by themes or research questions
   - Synthesize findings across multiple studies within each theme
   - Compare and contrast different approaches and results
   - Identify consensus areas and points of controversy
   - Highlight the strongest evidence

   Example structure:
   ```markdown
   #### 3.3.1 Theme: Retrieval Integration Strategies

   Multiple integration strategies have been investigated for
   retrieval-augmented generation. Input-level concatenation was used in
   15 studies^1-15^ and showed strong gains on knowledge-intensive tasks
   (65-85% recall) but raised context-length and latency concerns^3,7,12^.
   In contrast, cross-attention fusion demonstrated lower recall
   (40-60%) but improved inference efficiency^16-23^.
   ```

3. **Critical Analysis**:
   - Evaluate methodological strengths and limitations across studies
   - Assess quality and consistency of evidence
   - Identify knowledge gaps and methodological gaps
   - Note areas requiring future research

4. **Write Discussion**:
   - Interpret findings in broader context
   - Discuss practical, research, and deployment implications
   - Acknowledge limitations of the review itself
   - Compare with previous reviews if applicable
   - Propose specific future research directions

### Phase 6: Citation Verification

**CRITICAL**: All citations must be verified for accuracy before final submission.

1. **Verify All DOIs**:
   ```bash
   python scripts/verify_citations.py my_literature_review.md
   ```

   This script:
   - Extracts all DOIs from the document
   - Verifies each DOI resolves correctly
   - Retrieves metadata from CrossRef
   - Generates verification report
   - Outputs properly formatted citations

2. **Review Verification Report**:
   - Check for any failed DOIs
   - Verify author names, titles, and publication details match
   - Correct any errors in the original document
   - Re-run verification until all citations pass

3. **Format Citations Consistently**:
   - Choose one citation style and use throughout (see `references/citation_styles.md`)
   - Common styles: APA, IEEE, ACM, Nature, Chicago
   - Use verification script output to format citations correctly
   - Ensure in-text citations match reference list format

### Phase 7: Document Generation

1. **Generate PDF**:
   ```bash
   python scripts/generate_pdf.py my_literature_review.md \
     --citation-style apa \
     --output my_review.pdf
   ```

   Options:
   - `--citation-style`: apa, ieee, acm, nature, chicago
   - `--no-toc`: Disable table of contents
   - `--no-numbers`: Disable section numbering
   - `--check-deps`: Check if pandoc/xelatex are installed

2. **Review Final Output**:
   - Check PDF formatting and layout
   - Verify all sections are present
   - Ensure citations render correctly
   - Check that figures/tables appear properly
   - Verify table of contents is accurate

3. **Quality Checklist**:
   - [ ] All DOIs verified with verify_citations.py
   - [ ] Citations formatted consistently
   - [ ] Search & screening flow diagram included (for systematic reviews)
   - [ ] Search methodology fully documented
   - [ ] Inclusion/exclusion criteria clearly stated
   - [ ] Results organized thematically (not study-by-study)
   - [ ] Quality assessment completed
   - [ ] Limitations acknowledged
   - [ ] References complete and accurate
   - [ ] PDF generates without errors

## Database-Specific Search Guidance

### arXiv

Access via the `paper-library` skill or the arXiv API:
```python
# Example search categories:
# cs.LG (Machine Learning)
# cs.CL (Computation and Language / NLP)
# cs.CV (Computer Vision)
# cs.AI (Artificial Intelligence)
# stat.ML (Machine Learning Statistics)

# Search format: category AND terms
search_query = "cat:cs.CL AND ti:\"retrieval-augmented generation\""
```

**Search tips**:
- Field prefixes: `ti:` (title), `abs:` (abstract), `au:` (author), `cat:` (category)
- Date filters: `submittedDate:[20200101 TO 20241025]`
- Boolean operators: AND, OR, ANDNOT
- Browse the taxonomy: https://arxiv.org/category_taxonomy

### Semantic Scholar

Access via the Semantic Scholar API (works free-tier; API key raises rate limits):
```python
# Keyword search returns metadata + abstracts + citation counts
# GET https://api.semanticscholar.org/graph/v1/paper/search
#   ?query=mixture-of-experts+routing&fields=title,abstract,year,citationCount,externalIds
```
- 200M+ papers across all fields
- Excellent for cross-disciplinary searches
- Provides citation graphs and paper recommendations
- Use for finding highly influential papers

### ACL Anthology / DBLP

- **ACL Anthology**: authoritative open archive for NLP/computational linguistics venues (ACL, EMNLP, NAACL, etc.)
- **DBLP**: comprehensive, well-curated bibliographic index for computer science; use for accurate author/venue metadata and disambiguation

### Specialized CS/AI resources

Use appropriate resources:
- **Papers with Code**: SOTA leaderboards, benchmark results, and links to reference implementations
- **OpenReview**: open peer reviews, ratings, and rebuttals for ICLR/NeurIPS and other venues
- **Hugging Face**: models and datasets accompanying papers
- **IEEE Xplore / ACM Digital Library**: published proceedings and journals
- **OpenAlex**: open scholarly metadata and citation graph

### Citation Chaining

Expand search via citation networks:

1. **Forward citations** (papers citing key papers):
   - Use Google Scholar "Cited by"
   - Use Semantic Scholar or OpenAlex APIs
   - Identifies newer research building on seminal work

2. **Backward citations** (references from key papers):
   - Extract references from included papers
   - Identify highly cited foundational work
   - Find papers cited by multiple included studies

## Citation Style Guide

Detailed formatting guidelines are in `references/citation_styles.md`. Quick reference:

### APA (7th Edition)
- In-text: (Smith et al., 2023)
- Reference: Smith, J. D., Johnson, M. L., & Williams, K. R. (2023). Title. *Journal*, *22*(4), 301-318. https://doi.org/10.xxx/yyy

### IEEE
- In-text: Bracketed numbers [1], [2]
- Reference: J. D. Smith, M. L. Johnson, and K. R. Williams, "Title," *IEEE Trans. Pattern Anal. Mach. Intell.*, vol. 45, no. 4, pp. 301-318, 2023.

### ACM
- In-text: Bracketed numbers [1] or author-year (Smith et al. 2023)
- Reference: Jane D. Smith, Mark L. Johnson, and Kate R. Williams. 2023. Title. *ACM Comput. Surv.* 55, 4 (2023), 301-318. https://doi.org/10.xxx/yyy

### Nature
- In-text: Superscript numbers^1,2^
- Reference: Smith, J. D., Johnson, M. L. & Williams, K. R. Title. *Nat. Mach. Intell.* **5**, 301-318 (2023).

**Always verify citations** with verify_citations.py before finalizing.

### Prioritizing High-Impact Papers (CRITICAL)

**Always prioritize influential, highly-cited papers from reputable authors and top venues.** Quality matters more than quantity in literature reviews.

#### Citation Count Thresholds

Use citation counts to identify the most impactful papers:

| Paper Age | Citation Threshold | Classification |
|-----------|-------------------|----------------|
| 0-3 years | 20+ citations | Noteworthy |
| 0-3 years | 100+ citations | Highly Influential |
| 3-7 years | 100+ citations | Significant |
| 3-7 years | 500+ citations | Landmark Paper |
| 7+ years | 500+ citations | Seminal Work |
| 7+ years | 1000+ citations | Foundational |

#### Journal and Venue Tiers

Prioritize papers from higher-tier venues:

- **Tier 1 (Always Prefer):** Top-tier conferences (NeurIPS, ICML, ICLR, CVPR, ACL, EMNLP, SIGGRAPH, OSDI/SOSP, STOC/FOCS) and flagship journals (JMLR, IEEE TPAMI, CACM); cross-disciplinary Nature/Science for landmark work
- **Tier 2 (Strong Preference):** Strong conferences (AAAI, KDD, NAACL, ECCV, WWW, NSDI) and high-impact specialized journals
- **Tier 3 (Include When Relevant):** Respected specialized venues and workshops with archival proceedings
- **Tier 4 (Use Sparingly):** Lower-impact peer-reviewed venues and non-archival workshops

#### Author Reputation Assessment

Prefer papers from:
- **Senior researchers** with high h-index (>40 in established fields)
- **Leading research groups** at recognized institutions (Harvard, Stanford, MIT, Oxford, etc.)
- **Authors with multiple Tier-1 publications** in the relevant field
- **Researchers with recognized expertise** (awards, editorial positions, society fellows)

#### Identifying Seminal Papers

For any topic, identify foundational work by:
1. **High citation count** (typically 500+ for papers 5+ years old)
2. **Frequently cited by other included studies** (appears in many reference lists)
3. **Published in Tier-1 venues** (NeurIPS, ICML, ICLR, CVPR, ACL)
4. **Written by field pioneers** (often cited as establishing concepts)

## Best Practices

### Search Strategy
1. **Use multiple databases** (minimum 3): Ensures comprehensive coverage
2. **Include preprint servers**: Captures latest unpublished findings
3. **Document everything**: Search strings, dates, result counts for reproducibility
4. **Test and refine**: Run pilot searches, review results, adjust search terms
5. **Sort by citations**: When available, sort search results by citation count to surface influential work first

### Screening and Selection
1. **Use multiple databases** (minimum 3): Ensures comprehensive coverage
2. **Include preprint servers**: Captures latest unpublished findings
3. **Document everything**: Search strings, dates, result counts for reproducibility
4. **Test and refine**: Run pilot searches, review results, adjust search terms

### Screening and Selection
1. **Use clear criteria**: Document inclusion/exclusion criteria before screening
2. **Screen systematically**: Title → Abstract → Full text
3. **Document exclusions**: Record reasons for excluding studies
4. **Consider dual screening**: For systematic reviews, have two reviewers screen independently

### Synthesis
1. **Organize thematically**: Group by themes, NOT by individual studies
2. **Synthesize across studies**: Compare, contrast, identify patterns
3. **Be critical**: Evaluate quality and consistency of evidence
4. **Identify gaps**: Note what's missing or understudied

### Quality and Reproducibility
1. **Assess reproducibility and rigor**: Check code/data availability, seeds, multiple runs, baseline fairness
2. **Verify all citations**: Run verify_citations.py script
3. **Document methodology**: Provide enough detail for others to reproduce
4. **Document the pipeline**: Report the full search & screening flow for systematic reviews

### Writing
1. **Be objective**: Present evidence fairly, acknowledge limitations
2. **Be systematic**: Follow structured template
3. **Be specific**: Include numbers, statistics, effect sizes where available
4. **Be clear**: Use clear headings, logical flow, thematic organization

## Common Pitfalls to Avoid

1. **Single database search**: Misses relevant papers; always search multiple databases
2. **No search documentation**: Makes review irreproducible; document all searches
3. **Study-by-study summary**: Lacks synthesis; organize thematically instead
4. **Unverified citations**: Leads to errors; always run verify_citations.py
5. **Too broad search**: Yields thousands of irrelevant results; refine with specific terms
6. **Too narrow search**: Misses relevant papers; include synonyms and related terms
7. **Ignoring preprints**: Misses latest findings; include arXiv and OpenReview submissions
8. **No rigor assessment**: Treats all evidence equally; assess and report reproducibility and rigor
9. **Publication bias**: Only positive results published; note potential bias
10. **Outdated search**: Field evolves rapidly; clearly state search date

## Example Workflow

Complete workflow for an AI/ML systematic literature review (e.g., retrieval-augmented generation for open-domain QA):

```bash
# 1. Create review document from template
cp assets/review_template.md rag_qa_review.md

# 2. Search multiple databases using appropriate resources
# - Use the paper-library skill / arXiv API for preprints
# - Use the Semantic Scholar API for metadata and citation counts
# - Use ACL Anthology, DBLP, and Papers with Code for venues/benchmarks
# - Export results in JSON format

# 3. Aggregate and process results
python scripts/search_databases.py combined_results.json \
  --deduplicate \
  --rank citations \
  --year-start 2015 \
  --year-end 2024 \
  --format markdown \
  --output search_results.md \
  --summary

# 4. Screen results and extract data
# - Manually screen titles, abstracts, full texts
# - Extract key data into the review document
# - Organize by themes

# 5. Write the review following template structure
# - Introduction with clear objectives
# - Detailed methodology section
# - Results organized thematically
# - Critical discussion
# - Clear conclusions

# 6. Verify all citations
python scripts/verify_citations.py rag_qa_review.md

# Review the citation report
cat rag_qa_review_citation_report.json

# Fix any failed citations and re-verify
python scripts/verify_citations.py rag_qa_review.md

# 7. Generate professional PDF
python scripts/generate_pdf.py rag_qa_review.md \
  --citation-style ieee \
  --output rag_qa_review.pdf

# 8. Review final PDF and markdown outputs
```

## Integration with Other Skills

This skill works seamlessly with other research skills:

### Database Access Skills
- **paper-library**: programmatic search over arXiv and Semantic Scholar (metadata + abstracts)
- **arXiv API**: preprint search across CS categories (cs.LG, cs.CL, cs.CV, ...)
- **Semantic Scholar API**: citation graphs, influence metrics, and recommendations

### Analysis Skills
- **scientific-schematics**: AI-generated diagrams (flow, framework, citation-network figures)
- **Papers with Code**: benchmark tables and SOTA tracking (for methods/results context)
- **OpenReview**: reviewer scores and rebuttals (for appraising rigor)

### Visualization Skills
- **matplotlib**: Generate figures and plots for review
- **seaborn**: Statistical visualizations

### Writing Skills
- **brand-guidelines**: Apply institutional branding to PDF
- **internal-comms**: Adapt review for different audiences

## Resources

### Bundled Resources

**Scripts:**
- `scripts/verify_citations.py`: Verify DOIs and generate formatted citations
- `scripts/generate_pdf.py`: Convert markdown to professional PDF
- `scripts/search_databases.py`: Process, deduplicate, and format search results

**References:**
- `references/citation_styles.md`: Detailed citation formatting guide (APA, IEEE, ACM, Nature, Chicago)
- `references/database_strategies.md`: Comprehensive database search strategies

**Assets:**
- `assets/review_template.md`: Complete literature review template with all sections

### External Resources

**Databases & APIs:**
- arXiv (API docs): https://info.arxiv.org/help/api/
- Semantic Scholar API: https://api.semanticscholar.org/
- DBLP: https://dblp.org/
- Papers with Code: https://paperswithcode.com/
- ACL Anthology: https://aclanthology.org/

**Tools:**
- OpenReview: https://openreview.net/
- OpenAlex: https://openalex.org/
- arXiv category taxonomy: https://arxiv.org/category_taxonomy

**Citation Styles:**
- APA Style: https://apastyle.apa.org/
- IEEE Author Center: https://journals.ieeeauthorcenter.ieee.org/
- ACM Reference Format: https://www.acm.org/publications/authors/reference-formatting

## Dependencies

### Required Python Packages
```bash
pip install requests  # For citation verification
```

### Required System Tools
```bash
# For PDF generation
brew install pandoc  # macOS
apt-get install pandoc  # Linux

# For LaTeX (PDF generation)
brew install --cask mactex  # macOS
apt-get install texlive-xetex  # Linux
```

Check dependencies:
```bash
python scripts/generate_pdf.py --check-deps
```

## Summary

This literature-review skill provides:

1. **Systematic methodology** following academic best practices
2. **Multi-database integration** via existing scientific skills
3. **Citation verification** ensuring accuracy and credibility
4. **Professional output** in markdown and PDF formats
5. **Comprehensive guidance** covering the entire review process
6. **Quality assurance** with verification and validation tools
7. **Reproducibility** through detailed documentation requirements

Conduct thorough, rigorous literature reviews that meet academic standards and provide comprehensive synthesis of current knowledge in any domain.

