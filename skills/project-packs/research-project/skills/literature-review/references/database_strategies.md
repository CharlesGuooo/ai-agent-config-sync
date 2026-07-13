# Literature Database Search Strategies

This document provides comprehensive guidance for searching multiple literature databases systematically and effectively.

## Available Databases and Skills

### AI / ML / CS

#### arXiv
- **Access**: Use the `paper-library` skill or the arXiv API (`http://export.arxiv.org/api/query`)
- **Coverage**: 2M+ preprints in computer science, machine learning, statistics, math, physics
- **Best for**: Latest methods and results, ML/AI/NLP/CV/systems research, fast-moving fields
- **Search tips**: Use category filters (cs.LG, cs.CL, cs.CV, cs.AI, stat.ML), field prefixes `ti:`, `abs:`, `au:`, and Boolean operators (AND, OR, ANDNOT)
- **Example**: `cat:cs.LG AND ti:"retrieval augmented generation" AND abs:"language model"`

#### Semantic Scholar
- **Access**: Direct API (Semantic Scholar Academic Graph / `api.semanticscholar.org`; API key recommended)
- **Coverage**: 200M+ papers across all fields, rich citation graph
- **Best for**: Cross-disciplinary searches, citation graphs, influential-citation ranking, paper recommendations
- **Features**: Highly Influential Citations, TLDR summaries, related papers, citation velocity
- **Example**: query `retrieval augmented generation` with `fields=title,year,citationCount,influentialCitationCount`
- **Rate limits**: ~100 requests/5 minutes with API key

#### ACL Anthology
- **Access**: Direct site / BibTeX export (`aclanthology.org`)
- **Coverage**: Comprehensive NLP/CL proceedings (ACL, EMNLP, NAACL, COLING, TACL, CL journal)
- **Best for**: Natural language processing, computational linguistics, authoritative NLP citations
- **Example**: browse by venue/year, e.g. `EMNLP 2023` main track; download per-paper BibTeX

#### DBLP
- **Access**: Direct API (`dblp.org/search/publ/api`, free, no key)
- **Coverage**: 7M+ CS publications, complete venue and author bibliographies
- **Best for**: Author disambiguation, venue completeness, verifying publication metadata
- **Example**: `https://dblp.org/search/publ/api?q=mixture+of+experts&format=json`

#### OpenReview
- **Access**: Direct API (`api.openreview.net`)
- **Coverage**: Open peer reviews and submissions (ICLR, NeurIPS, and many workshops)
- **Best for**: Reviews, rebuttals, scores, accepted/rejected status, camera-ready versions
- **Example**: query submissions for `ICLR.cc/2024/Conference` and filter by decision

#### Papers with Code
- **Access**: Direct API (`paperswithcode.com/api/v1`, free)
- **Coverage**: Papers linked to code repositories, benchmark leaderboards, datasets
- **Best for**: Finding implementations, state-of-the-art on a benchmark, reproducibility
- **Example**: look up the leaderboard for a task (e.g. `question-answering` on a given benchmark)

#### IEEE Xplore
- **Access**: IEEE Xplore API (subscription/API key) or web search
- **Coverage**: IEEE and IET journals, conferences, standards
- **Best for**: Systems, signal processing, robotics, communications, TPAMI and related venues
- **Example**: `("Abstract":"graph neural network") AND ("Publication Year":2020-2024)`

#### ACM Digital Library
- **Access**: ACM DL web search / institutional access
- **Coverage**: ACM journals (CACM, JACM, TOG, ...) and conference proceedings (SIGGRAPH, KDD, ...)
- **Best for**: Systems, HCI, graphics, databases, theory, authoritative ACM citations
- **Example**: `[Abstract: "differential privacy"] AND [Publication Date: (2019 TO 2024)]`

### General Scientific Literature

#### OpenAlex
- **Access**: Direct API (`api.openalex.org`, free, no key required)
- **Coverage**: 250M+ works with comprehensive metadata and citation links
- **Best for**: Citation analysis, author disambiguation, institutional/bibliometric research
- **Features**: Open access, concepts/topics tagging, excellent for bibliometrics
- **Example**: `https://api.openalex.org/works?search=diffusion%20model&filter=from_publication_date:2021-01-01`

#### Google Scholar
- **Access**: Web scraping (use cautiously) or manual search
- **Coverage**: Comprehensive across all fields
- **Best for**: Finding highly cited papers, conference proceedings, theses, grey literature
- **Limitations**: No official API, rate limiting
- **Export**: Use the "Cite" feature for formatted citations

#### DOAJ / CORE
- **Access**: Direct APIs (free)
- **Coverage**: Open-access journals (DOAJ) and aggregated open full texts (CORE, 250M+)
- **Best for**: Retrieving open full-text PDFs and open-access metadata at scale

### Benchmarks, Code & Data

#### Hugging Face Hub
- **Access**: Direct API (`huggingface.co/api`)
- **Coverage**: Models, datasets, and Spaces with cards and metrics
- **Best for**: Reproducing results, locating datasets and pretrained checkpoints referenced in papers

#### GitHub
- **Access**: GitHub API / search
- **Best for**: Locating official implementations, checking stars/activity, verifying reproducibility artifacts

---

## Search Strategy Framework

### 1. Define Research Question (Problem / Method / Baseline / Metric)

For CS/AI reviews, frame the question along four axes (Task / Approach / Baselines / Benchmarks):
- **P**roblem (Task): What task or problem is being solved?
- **M**ethod (Approach): What technique or architecture is proposed?
- **B**aseline (Baselines): What prior approaches is it compared against?
- **M**etric (Benchmarks): What datasets/metrics measure success?

**Example**: "How effective is retrieval-augmented generation (Method) for open-domain question answering (Problem) compared to a closed-book large language model baseline (Baseline), as measured by exact-match and F1 on Natural Questions (Metric)?"

### 2. Develop Search Terms

#### Primary Concepts
Identify 2-4 main concepts from your research question.

**Example**:
- Concept 1: retrieval-augmented generation, RAG, retrieval augmentation
- Concept 2: open-domain question answering, ODQA, open-book QA
- Concept 3: large language model, LLM, dense retriever

#### Synonyms & Related Terms
List alternative terms, abbreviations, and related concepts.

**Tool**: Check the ACL Anthology and Papers with Code task taxonomy for standardized terminology.

#### Boolean Operators
- **AND**: Narrows search (must include both terms)
- **OR**: Broadens search (includes either term)
- **NOT** / **ANDNOT**: Excludes terms

**Example**: `(RAG OR "retrieval augmented" OR "retrieval-augmented") AND ("question answering" OR ODQA) AND ("language model" OR LLM)`

#### Wildcards & Truncation
- `*`: Matches any characters
- `?`: Matches single character

**Example**: `transform*` matches transformer, transformers, transformation

### 3. Set Inclusion/Exclusion Criteria

#### Inclusion Criteria
- **Date range**: e.g., 2018-2024 (last ~6 years for fast-moving ML)
- **Language**: English (or specify multilingual)
- **Publication type**: Peer-reviewed papers, preprints, workshop papers
- **Contribution type**: New method, empirical benchmark, theory, survey, ablation study
- **Artifacts**: Prefer papers with released code/data when reproducibility matters

#### Exclusion Criteria
- Extended abstracts / posters without a full paper
- Non-archival workshop notes without results
- Non-original research (editorials, opinion pieces)
- Duplicate publications (preprint + camera-ready of the same work)
- Retracted or withdrawn papers

### 4. Database Selection Strategy

#### Multi-Database Approach
Search at least 3 complementary databases:

1. **Primary preprint server**: arXiv
2. **Citation-graph database**: Semantic Scholar or OpenAlex
3. **Venue-authoritative source**: ACL Anthology, DBLP, IEEE Xplore, or ACM DL
4. **Code/benchmark source**: Papers with Code (and OpenReview for reviews)

#### Database-Specific Syntax

| Database | Field Tags | Example |
|----------|-----------|---------|
| arXiv | ti:, abs:, au:, cat: | ti:"mixture of experts" AND cat:cs.LG |
| Semantic Scholar | query, year, fieldsOfStudy | query="diffusion sampling" year=2020-2024 |
| OpenAlex | search=, filter= | search=graph+neural+network&filter=from_publication_date:2020-01-01 |
| DBLP | q= | q=retrieval+augmented+generation |

---

## Search Execution Workflow

### Phase 1: Pilot Search
1. Run initial search with broad terms
2. Review first 50 results for relevance
3. Note common keywords and canonical task names
4. Refine search strategy

### Phase 2: Comprehensive Search
1. Execute refined searches across all selected databases
2. Export results in standard format (BibTeX, RIS, JSON)
3. Document search strings and date for each database
4. Record number of results per database

### Phase 3: Deduplication
1. Import all results into a single file
2. Use `search_databases.py --deduplicate` to remove duplicates
3. Identify duplicates by DOI or arXiv ID (primary) or title (fallback)
4. Keep the version with most complete metadata (prefer camera-ready over preprint)

### Phase 4: Screening
1. **Title screening**: Review titles, exclude obviously irrelevant
2. **Abstract screening**: Read abstracts, apply inclusion/exclusion criteria
3. **Full-text screening**: Obtain and review full texts
4. Document reasons for exclusion at each stage

### Phase 5: Reproducibility & Rigor Appraisal
1. Appraise each study's rigor using CS-appropriate criteria:
   - **Code/data availability**: Is code released? Are datasets and seeds specified?
   - **Baseline fairness**: Are baselines tuned and compared under matched conditions?
   - **Benchmark validity**: Are the datasets/metrics appropriate and not leaked?
   - **Ablation coverage**: Are the key design choices isolated and justified?
2. Rate reproducibility (high, moderate, low) based on artifact availability and reporting
3. Consider excluding claims that cannot be reproduced or that lack fair baselines

---

## Search Documentation Template

### Required Documentation
All searches must be documented for reproducibility:

```markdown
## Search Strategy

### Database: arXiv
- **Date searched**: 2024-10-25
- **Date range**: 2018-01-01 to 2024-10-25
- **Search string**:
  ```
  (ti:"retrieval augmented generation" OR abs:"retrieval-augmented")
  AND (abs:"question answering" OR abs:ODQA)
  AND (abs:"language model" OR abs:LLM)
  AND cat:cs.CL
  ```
- **Results**: 247 papers
- **After deduplication**: 189 papers

### Database: Semantic Scholar
- **Date searched**: 2024-10-25
- **Date range**: 2018-01-01 to 2024-10-25
- **Search string**: "retrieval augmented generation" AND "question answering" (title/abstract)
- **Results**: 34 papers
- **After deduplication**: 28 papers

### Total Unique Papers
- **Combined results**: 217 unique papers
- **After title screening**: 156 papers
- **After abstract screening**: 89 papers
- **After full-text screening**: 52 papers included in review
```

---

## Advanced Search Techniques

### Prioritizing High-Impact Papers (CRITICAL)

**Always prioritize papers based on citation count, venue quality, and author reputation.** Quality matters more than quantity.

#### Citation Metrics in Database Searches

Use citation counts to identify influential work:

| Paper Age | Citations | Classification |
|-----------|-----------|----------------|
| 0-3 years | 20+ | Noteworthy |
| 0-3 years | 100+ | Highly Influential |
| 3-7 years | 100+ | Significant |
| 3-7 years | 500+ | Landmark |
| 7+ years | 500+ | Seminal |
| 7+ years | 1000+ | Foundational |

**Database-Specific Citation Features:**
- **Google Scholar:** Sort by citation count, use "Cited by" feature
- **Semantic Scholar:** "Highly Influential Citations" metric, citation velocity
- **OpenAlex:** Citation counts, citation context analysis
- **DBLP:** Complete venue records to confirm the authoritative version to cite

#### Filtering by Venue Quality

Prioritize papers from higher-tier venues:

**Tier 1 (Always Prefer):**
- NeurIPS, ICML, ICLR, CVPR, ACL, EMNLP
- JMLR, TPAMI, CACM, JACM
- Search tip: `venue:NeurIPS` in Semantic Scholar, or filter by venue in DBLP

**Tier 2 (High Priority):**
- Strong specialized venues: AAAI, KDD, SIGIR, NAACL, ECCV, ICCV, COLING
- High-impact journals in the subfield

**Tier 3 (Include When Relevant):**
- Reputable field-specific workshops and journals

**Semantic Scholar Venue Filtering:**
```
venue:"Neural Information Processing Systems" OR venue:"International Conference on Machine Learning"
```

**Google Scholar Venue Filtering:**
```
source:NeurIPS source:ICML source:ICLR
```

#### Leveraging "Cited by" Features

**Finding Influential Work:**
1. Start with a known key paper
2. Click "Cited by" to find papers that cite it
3. Sort citing papers by their citation count
4. Highly-cited citing papers indicate important follow-up work

**Identifying Seminal Papers:**
1. Search your topic broadly
2. Note which papers appear repeatedly in reference lists
3. Papers cited by many of your results are likely seminal
4. Check citation counts to confirm influence

**Semantic Scholar Features:**
- "Highly Influential Citations" shows citations that significantly built on the paper
- "Citation Velocity" shows recent citation growth
- Paper recommendations based on citation networks

### Citation Chaining

#### Forward Citation Search
Find papers that cite a key paper:
- Use Google Scholar "Cited by" feature
- Use OpenAlex or Semantic Scholar APIs
- Identifies newer research building on seminal work
- **Tip:** Sort by citation count to find the most influential follow-up work

#### Backward Citation Search
Review references in key papers:
- Extract references from included papers
- Search for highly cited references (500+ citations for older papers)
- Identifies foundational research
- **Tip:** Focus on references that appear in multiple papers' bibliographies

### Snowball Sampling
1. Start with 3-5 highly relevant papers **from Tier-1 venues**
2. Extract all their references
3. Check which references are cited by multiple papers
4. Review those high-overlap references - these are likely seminal
5. Repeat for newly identified key papers
6. **Prioritize papers with high citation counts** at each step

### Author Search
Follow prolific and reputable authors in the field:
- Search by author name across databases (DBLP is ideal for complete author records)
- Check author profiles (ORCID, Google Scholar, Semantic Scholar) for h-index and venues
- Review recent publications and preprints
- **Prefer authors with multiple Tier-1 publications** and high h-index (>40)
- Look for senior authors who are recognized field leaders

### Related Article Features
Many databases suggest related articles:
- Semantic Scholar "Recommended papers"
- Papers with Code "related methods/tasks"
- Use to discover papers missed by keyword search
- **Filter recommendations by citation count and venue quality**

---

## Quality Control Checklist

### Before Searching
- [ ] Research question clearly defined
- [ ] Problem/Method/Baseline/Metric criteria established (if applicable)
- [ ] Search terms and synonyms listed
- [ ] Inclusion/exclusion criteria documented
- [ ] Target databases selected (minimum 3)
- [ ] Date range determined

### During Searching
- [ ] Search string tested and refined
- [ ] Results exported with complete metadata
- [ ] Search parameters documented
- [ ] Number of results recorded per database
- [ ] Search date recorded

### After Searching
- [ ] Duplicates removed
- [ ] Screening protocol followed
- [ ] Reasons for exclusion documented
- [ ] Reproducibility & rigor appraisal completed
- [ ] All citations verified with verify_citations.py
- [ ] Search methodology documented in review

---

## Common Pitfalls to Avoid

1. **Too narrow search**: Missing relevant papers
   - Solution: Include synonyms, related terms, broader concepts

2. **Too broad search**: Thousands of irrelevant results
   - Solution: Add specific concepts with AND, use field tags

3. **Single database**: Incomplete coverage
   - Solution: Search minimum 3 complementary databases

4. **Ignoring preprints**: Missing latest findings
   - Solution: Include arXiv and OpenReview submissions

5. **No documentation**: Irreproducible search
   - Solution: Document every search string, date, and result count

6. **Manual deduplication**: Time-consuming and error-prone
   - Solution: Use search_databases.py script

7. **Unverified citations**: Broken DOIs, incorrect metadata
   - Solution: Run verify_citations.py on final reference list

8. **Publication bias**: Only including published positive results
   - Solution: Search preprint servers and check for negative/ablation results

---

## Example Multi-Database Search Workflow

```python
# Example workflow using available skills and APIs

# 1. Search arXiv via the API (or the paper-library skill)
import urllib.request, urllib.parse
query = 'all:"retrieval augmented generation" AND cat:cs.CL'
url = "http://export.arxiv.org/api/query?" + urllib.parse.urlencode(
    {"search_query": query, "start": 0, "max_results": 100}
)
arxiv_atom = urllib.request.urlopen(url).read()  # parse Atom XML for entries

# 2. Search Semantic Scholar via the Graph API
import requests
r = requests.get(
    "https://api.semanticscholar.org/graph/v1/paper/search",
    params={"query": "retrieval augmented generation question answering",
            "fields": "title,year,venue,citationCount,influentialCitationCount",
            "limit": 100},
    headers={"x-api-key": "<YOUR_KEY>"},
)
semantic_results = r.json()["data"]

# 3. Check Papers with Code for implementations / leaderboards
# GET https://paperswithcode.com/api/v1/search/?q=retrieval+augmented+generation

# 4. Aggregate and deduplicate results
# python search_databases.py combined_results.json --deduplicate --format markdown --output review_papers.md

# 5. Verify all citations
# python verify_citations.py review_papers.md

# 6. Generate final PDF
# python generate_pdf.py review_papers.md --citation-style ieee
```

---

## Resources

### arXiv API Documentation
https://info.arxiv.org/help/api/index.html

### Semantic Scholar API
https://api.semanticscholar.org/api-docs/

### Papers with Code API
https://paperswithcode.com/api/v1/docs/

### ACL Anthology
https://aclanthology.org/

### Citation Style Guides
See references/citation_styles.md in this skill
