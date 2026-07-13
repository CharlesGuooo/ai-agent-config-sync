# Citation Styles Guide

## Overview

Citation styles provide standardized formats for acknowledging sources in scientific writing. Different disciplines prefer different styles, and venues typically specify which style to use. The five most common citation styles in computing and the sciences are APA, IEEE, ACM, Nature, and Chicago.

## Choosing the Right Style

| Style | Primary Disciplines | In-Text Format |
|-------|-------------------|----------------|
| APA | Psychology, HCI, social computing, education | Author-date (Smith, 2023) |
| IEEE | Engineering, computer science, systems | Numbers in brackets [1] |
| ACM | Computer science (ACM venues) | Numbered [1] or author-date |
| Nature | Multidisciplinary science journals | Superscript numbers¹ |
| Chicago | Humanities, history, some sciences | Notes-bibliography or author-date |

**Default recommendation**: When in doubt, check the venue's author guidelines or LaTeX template. Most CS conferences and journals use numbered IEEE- or ACM-style references; many ML venues also accept author-date (e.g., ACL style).

## ACM Style (ACM Reference Format)

### Overview
- Used across ACM conferences and journals (CACM, TOG, CHI, KDD, etc.)
- Based on the *ACM Reference Format* (used by the `acmart` LaTeX class)
- Default is numbered citations in square brackets; an author-date variant is available
- References listed numerically in order of appearance (or alphabetically for author-date)

### In-Text Citations

**Basic format**: Numbers in square brackets after the relevant text.

**Examples:**
```
Several works have demonstrated this effect [1].

The results were inconclusive [2], although Smith et al. [3] reported otherwise.

These findings [3, 4, 5] suggest a correlation.

Multiple systems [1, 3, 5, 6, 7] have confirmed this.
```

**Multiple citations**: Use commas within one bracket
```
Multiple works [1, 3, 5] have confirmed this.
```

**Author-date variant**: `[Smith et al. 2023]` when the venue's template selects the author-year style

### Reference List Format

**Journal Articles:**
```
[1] Author First Last, Author First Last, and Author First Last. Year. Title of article. Journal Name Volume, Issue (Month Year), Page range. https://doi.org/xx.xxxx
```

**Example:**
```
[1] Jane D. Smith, Alan B. Johnson, and Carol D. Williams. 2023. Efficient attention for long-context transformers. Commun. ACM 66, 5 (May 2023), 78-87. https://doi.org/10.1145/3591234
```

**Conference Papers:**
```
[2] Author First Last and Author First Last. Year. Paper title. In Proceedings of the Conference Name (Abbrev 'YY). ACM, City, Country, Page range. https://doi.org/xx.xxxx
```

**Books:**
```
[3] Author First Last. Year. Book Title (Edition ed.). Publisher, City.
```

**Preprints/Online Resources:**
```
[4] Author First Last. Year. Title. arXiv:xxxx.xxxxx. Retrieved Month Day, Year from URL
```

### Special Cases

**Many authors**: List all authors; `acmart` handles truncation to "et al." in-text automatically

**No author**: Begin with title

**Artifacts and code**: Cite released software/datasets with a DOI when available (Zenodo, ACM DL)

## Nature Style

### Overview
- Used by Nature and Nature-portfolio journals (also similar to Science)
- Superscript numbered citations
- References listed numerically in order of appearance
- Journal names abbreviated; article titles included

### In-Text Citations

**Basic format**: Superscript numerals after the relevant text.

**Examples:**
```
Several studies have shown this effect¹.

The results were inconclusive², although Smith et al.³ reported otherwise.

These findings³⁻⁵ suggest a correlation.

Multiple studies¹,³,⁵⁻⁷ have confirmed this.
```

### Reference List Format

**Journal Articles:**
```
1. Author, A. A., Author, B. B. & Author, C. C. Title of article. Journal Abbrev. Volume, Page range (Year).
```

**Example:**
```
1. Smith, J. D., Johnson, A. B. & Williams, C. D. Scaling laws for sparse mixture-of-experts models. Nat. Mach. Intell. 5, 456-464 (2023).
```

**Books:**
```
2. Author, A. A. Book Title (Publisher, Year).
```

**Conference/Preprint Sources:**
```
3. Author, A. A. et al. Paper title. In Proc. Conference Name (Year); preprint at https://arxiv.org/abs/xxxx.xxxxx.
```

### Special Cases

**More than 5 authors**: List first author then "et al."

**Journal title abbreviations**: Use standard ISO abbreviations
- *Nature Machine Intelligence* → *Nat. Mach. Intell.*
- *Journal of Machine Learning Research* → *J. Mach. Learn. Res.*

**No volume or issue**: Use year and article number

**Preprint**: Cite as "preprint at https://arxiv.org/abs/xxxx.xxxxx"

## APA Style (American Psychological Association)

### Overview
- Widely used in psychology, education, and social sciences
- Based on the *Publication Manual of the APA* (7th edition, 2020)
- Author-date format for in-text citations
- References listed alphabetically by author surname

### In-Text Citations

**Basic format**: (Author, Year)

**Examples:**
```
One study found significant effects (Smith, 2023).

Smith (2023) found significant effects.

Multiple studies (Jones, 2020; Smith, 2023; Williams, 2024) support this conclusion.
```

**Two authors**: Use "&" in parentheses, "and" in narrative
```
(Smith & Jones, 2023)
Smith and Jones (2023) demonstrated...
```

**Three or more authors**: Use "et al." after first author
```
(Smith et al., 2023)
Smith et al. (2023) reported...
```

**Multiple works by same author(s) in same year**: Add letters
```
(Smith, 2023a, 2023b)
```

**Direct quotations**: Include page numbers
```
(Smith, 2023, p. 45)
"Quote text" (Smith, 2023, p. 45).
Smith (2023) stated, "Quote text" (p. 45).
```

### Reference List Format

**Journal Articles:**
```
Author, A. A., Author, B. B., & Author, C. C. (Year). Title of article. Journal Name, Volume(Issue), page range. https://doi.org/xx.xxxx
```

**Example:**
```
Smith, J. D., Johnson, A. B., & Williams, C. D. (2023). Efficient attention for long-context transformers. Journal of Machine Learning Research, 24(5), 456-464. https://doi.org/10.5555/jmlr.2023.0123
```

**Books:**
```
Author, A. A. (Year). Book title: Subtitle (Edition). Publisher. https://doi.org/xx.xxxx
```

**Book Chapters:**
```
Chapter Author, A. A., & Chapter Author, B. B. (Year). Chapter title. In E. E. Editor & F. F. Editor (Eds.), Book title (pp. page range). Publisher.
```

**Websites:**
```
Author, A. A. (Year, Month Day). Page title. Website Name. URL
```

### Capitalization Rules
- Sentence case for article and book titles (capitalize only first word and proper nouns)
- Title case for journal names (capitalize all major words)

**Example:**
```
Smith, J. D. (2023). Effects of stress on cognitive performance: A meta-analysis. Journal of Experimental Psychology: General, 152(3), 456-478.
```

### Special Cases

**No author**: Move title to author position
```
Title of work. (Year). Journal Name...
```

**No date**: Use (n.d.)
```
Smith, J. D. (n.d.). Title...
```

**Up to 20 authors**: List all authors with "&" before last
**21 or more authors**: List first 19, then "...", then final author

## Chicago Style

### Overview
- Based on *The Chicago Manual of Style* (17th edition, 2017)
- Two systems: Notes-Bibliography and Author-Date
- Notes-Bibliography common in humanities
- Author-Date common in sciences

### Notes-Bibliography System

**In-Text**: Superscript numbers for footnotes or endnotes
```
One study demonstrated this effect.¹
```

**Note format:**
```
1. John D. Smith, Alice B. Johnson, and Carol D. Williams, "Efficient Attention for Long-Context Transformers," Journal of Machine Learning Research 24, no. 5 (2023): 456-64.
```

**Bibliography format:**
```
Smith, John D., Alice B. Johnson, and Carol D. Williams. "Efficient Attention for Long-Context Transformers." Journal of Machine Learning Research 24, no. 5 (2023): 456-64.
```

### Author-Date System

**In-Text**: Similar to APA
```
(Smith, Johnson, and Williams 2023)
Smith, Johnson, and Williams (2023) found...
```

**Reference list**: Similar to APA but with different punctuation
```
Smith, John D., Alice B. Johnson, and Carol D. Williams. 2023. "Efficient Attention for Long-Context Transformers." Journal of Machine Learning Research 24 (5): 456-64.
```

### Special Features
- Full names in bibliography (not just initials)
- Uses "and" not "&"
- Different punctuation from APA

## IEEE Style

### Overview
- Used in engineering, computer science, and technology
- Published by the Institute of Electrical and Electronics Engineers
- Numbered citations in square brackets
- References listed numerically

### In-Text Citations

**Format**: Numbers in square brackets

**Examples:**
```
Several studies have demonstrated this effect [1].

The algorithm was described by Smith [2] and later improved [3], [4].

Multiple implementations [1]-[4] have been proposed.
```

### Reference List Format

**Journal Articles:**
```
[1] A. A. Author, B. B. Author, and C. C. Author, "Title of article," Journal Name, vol. X, no. X, pp. XX-XX, Month Year.
```

**Example:**
```
[1] J. D. Smith, A. B. Johnson, and C. D. Williams, "Efficient attention for long-context transformers," IEEE Trans. Pattern Anal. Mach. Intell., vol. 45, no. 5, pp. 456-464, May 2023.
```

**Books:**
```
[2] A. A. Author, Book Title, Edition. City, State: Publisher, Year.
```

**Conference Papers:**
```
[3] A. A. Author, "Paper title," in Proc. Conference Name, City, State, Year, pp. XX-XX.
```

**Online Sources:**
```
[4] A. A. Author. "Title." Website. URL (accessed Mon. Day, Year).
```

### Special Features
- Abbreviated first and middle names
- Uses "and" before last author (not comma)
- Month abbreviations (Jan., Feb., etc.)
- "vol." and "no." before volume and issue
- "pp." before page range

## Additional Styles

### ACS Style (American Chemical Society)

**In-Text**: Superscript numbers or numbers in parentheses
```
This reaction has been well studied.¹
This reaction has been well studied (1).
```

**Reference format:**
```
(1) Smith, J. D.; Johnson, A. B.; Williams, C. D. Title of Article. J. Am. Chem. Soc. 2023, 145, 1234-1245.
```

**Features:**
- Semicolons between authors
- Abbreviated journal names
- Year in bold
- No issue numbers

### ACL Style (Association for Computational Linguistics)

**Author-year style** used across ACL, EMNLP, and NAACL (via the `acl` BibTeX style)

**Key features:**
- In-text author-date citations: `(Smith et al., 2023)` or narrative `Smith et al. (2023)`
- References listed alphabetically by author surname
- arXiv preprints and ACL Anthology entries cited directly (with anthology ID)

**Example:**
```
Jane D. Smith, Alan B. Johnson, and Carol D. Williams. 2023. Efficient attention for long-context transformers. In Proceedings of the 61st Annual Meeting of the Association for Computational Linguistics (ACL 2023), pages 456-464.
```

## General Citation Best Practices

### Across All Styles

**When to cite:**
- Direct quotations
- Paraphrased ideas from others
- Statistics, data, or figures from other sources
- Theories, models, or frameworks developed by others
- Information that is not common knowledge

**Citation density:**
- Introduction: Cite liberally to establish context
- Methods: Cite when referencing established protocols or instruments
- Results: Rarely cite (focus on your own findings)
- Discussion: Cite frequently when comparing to prior work

**Source quality:**
- Prefer peer-reviewed journal articles
- Cite original sources when possible (not secondary citations)
- Use recent sources (within 5-10 years for active fields)
- Ensure sources are reputable and relevant

**Common mistakes to avoid:**
- Inconsistent formatting
- Missing required elements (DOI, page numbers, etc.)
- Citing sources not actually read (citation chaining)
- Over-reliance on review articles instead of primary sources
- Including uncited references or missing cited references
- Incorrect author names or initials
- Wrong year of publication
- Truncated titles

### Managing Citations

**Reference Management Software:**
- **Zotero**: Free, open-source, browser integration
- **Mendeley**: Free, PDF annotation, social features
- **EndNote**: Commercial, powerful, institutional support
- **RefWorks**: Web-based, institutional subscriptions

**Software benefits:**
- Automatic formatting in multiple styles
- In-text citation insertion
- Reference list generation
- PDF organization
- Sharing capabilities

### Verifying Citations

**Before submission, check:**
1. Every in-text citation has a corresponding reference
2. Every reference is cited in text
3. Formatting is consistent throughout
4. Author names and initials are correct
5. Titles are accurate
6. Journal names match required abbreviations
7. Volume, issue, and page numbers are correct
8. DOIs are included (when required)
9. URLs are functional (for web sources)
10. Citations appear in correct order (numerical styles)

## DOI (Digital Object Identifier)

### What is a DOI?
A unique alphanumeric string identifying digital content permanently.

**Format:**
```
doi:10.1145/3591234
or
https://doi.org/10.1145/3591234
```

### When to include:
- Required by most journals for recent publications
- Preferred over URLs because DOIs don't change
- Look up DOIs at https://www.crossref.org/ if not provided; for preprints, cite the arXiv ID

### Style-specific formatting:
- **ACM**: `https://doi.org/10.xxxx/xxxxx`
- **APA**: `https://doi.org/10.xxxx/xxxxx`
- **IEEE**: DOI or arXiv ID added at the end of the reference
- **Nature**: DOI included; preprints cited as "preprint at https://arxiv.org/abs/xxxx.xxxxx"
- **Chicago**: `https://doi.org/10.xxxx/xxxxx`

## Quick Reference: Journal Article Format

| Style | Format |
|-------|--------|
| **ACM** | [1] Author First Last and Author First Last. Year. Title. *Journal* Vol, Iss (Month Year), pp. https://doi.org/xx |
| **Nature** | 1. Author, A. A. & Author, B. B. Title. *J. Abbrev.* Vol, pp (Year). |
| **APA** | Author, A. A., & Author, B. B. (Year). Title of article. *Journal*, Vol(Iss), pp. https://doi.org/xx |
| **Chicago A-D** | Author, A. A., and B. B. Author. Year. "Title." *Journal* Vol (Iss): pp. |
| **IEEE** | A. A. Author and B. B. Author, "Title," *Journal*, vol. X, no. X, pp. XX-XX, Mon. Year. |

## Common Abbreviations

### Journal Abbreviations
Follow the venue's specified system (usually ISO 4 abbreviations):
- *Journal of Machine Learning Research* → *J. Mach. Learn. Res.*
- *IEEE Transactions on Pattern Analysis and Machine Intelligence* → *IEEE Trans. Pattern Anal. Mach. Intell.*
- *Communications of the ACM* → *Commun. ACM*

### Month Abbreviations
- Jan., Feb., Mar., Apr., May, June, July, Aug., Sept., Oct., Nov., Dec.
- Some styles use three-letter abbreviations without periods

### Edition Abbreviations
- 1st ed., 2nd ed., 3rd ed., etc.
- Or: 1st edition, 2nd edition

## Special Publication Types

### Preprints
```
APA: Author, A. A. (Year). Title [Preprint]. Repository Name. https://doi.org/xx.xxxx
```

### Theses and Dissertations
```
APA: Author, A. A. (Year). Title [Doctoral dissertation, University Name]. Repository Name. URL
```

### Conference Proceedings
```
IEEE: A. A. Author, "Title," in Proc. Conf. Name, City, Year, pp. XX-XX.
```

### Software/Code
```
APA: Author, A. A. (Year). Title (Version X.X) [Computer software]. Publisher. URL
```

### Datasets
```
APA: Author, A. A. (Year). Title of dataset (Version X) [Data set]. Repository. https://doi.org/xx.xxxx
```

## Transitioning Between Styles

When converting between citation styles:

1. **Use reference management software** for automatic conversion
2. **Check these elements** that vary by style:
   - In-text citation format (numbered vs. author-date)
   - Author name format (initials vs. full names)
   - Title capitalization (sentence case vs. title case)
   - Journal name formatting (abbreviated vs. full)
   - Punctuation (periods, commas, semicolons)
   - Use of italics and bold
   - Order of elements
3. **Manually verify** after automatic conversion
4. **Check journal guidelines** for specific requirements

## Journal-Specific Citation Styles and Requirements

### How to Identify a Journal's Citation Style

**Step 1: Check Author Guidelines**
- Every journal provides author instructions (usually "Instructions for Authors" or "Author Guidelines")
- Citation style is typically specified in "References" or "Citations" section
- Look for example references formatted in the journal's style

**Step 2: Review Recent Publications**
- Examine 3-5 recent articles from your target journal
- Note the in-text citation format (numbered vs. author-date)
- Compare reference list formatting
- Check for journal-specific variations

**Step 3: Verify Journal-Specific Variations**
Some journals use modified versions of standard styles:
- Abbreviated vs. full journal names
- DOI inclusion requirements
- Article titles in title case vs. sentence case
- Maximum number of authors before "et al."

### Common Journals and Their Citation Styles

| Venue | Citation Style | Key Features |
|---------|---------------|--------------|
| **NeurIPS/ICML/ICLR** | Numbered or author-year (per template) | `.sty` template dictates format; arXiv preprints common |
| **CVPR/ICCV/ECCV** | Numbered [1] (IEEE-like) | Compact numbered brackets; conference proceedings |
| **ACL/EMNLP/NAACL** | ACL author-year | `(Author, Year)`; ACL Anthology IDs |
| **ACM venues (CHI, KDD, SIGMOD)** | ACM Reference Format | Numbered [1] via `acmart`; DOIs required |
| **JMLR** | JMLR (author-year) | Author-date; open-access, DOIs/arXiv IDs |
| **IEEE journals (TPAMI, etc.)** | IEEE | Numbered brackets; specific format for conference papers |
| **Nature, Nature journals** | Nature style (numbered) | Numbered superscripts, abbreviated journals, article titles included |
| **Science** | Science style (numbered) | Numbered in-text, abbreviated format |
| **HCI / social-computing journals** | APA | Author-date, DOIs required |
| **ACS journals** | ACS | Superscript or numbered, semicolons between authors |

### Journal Family Consistency

**Venues from the same publisher or community often share citation styles:**

**Elsevier journals:**
- Vary widely; check specific journal
- Many use numbered styles
- Some allow author-date

**Springer Nature journals:**
- Nature journals: Nature style (numbered, abbreviated)
- Springer LNCS proceedings: numbered, author-first references
- Other Springer journals: numbered or author-date depending on field

**ACM and IEEE:**
- All ACM venues use the ACM Reference Format (via `acmart`)
- All IEEE venues use IEEE style (numbered brackets)

**ML conference community (*ACL, NeurIPS/ICML/ICLR):**
- *ACL venues use ACL author-year style
- NeurIPS/ICML/ICLR provide `.sty` files that fix the format (numbered or author-year)

### High-Impact Journal and Conference Preferences

| Venue | Field | Citation Preference | Key Features |
|-------|-------|-------------------|--------------|
| **Nature/Science** | Multidisciplinary | Numbered, abbreviated | Space-saving, broad readability |
| **JMLR/TPAMI** | Machine Learning | Author-year / numbered | Archival journal standard |
| **CACM/ACM journals** | Computer Science | ACM Reference Format | Numbered [1] via `acmart` |
| **NeurIPS/ICML/ICLR** | Machine Learning | Numbered [1] or (Author, Year) | Varies by conference, check template |
| **CVPR/ICCV/ECCV** | Computer Vision | Numbered [1], IEEE-like | Compact format |
| **ACL/EMNLP** | NLP | Author-year (ACL style) | Attribution-focused |

### Adapting Citations for Different Target Journals

**When switching journals after desk rejection or withdrawal:**

**Use reference management software:**
1. Import references into Zotero, Mendeley, or EndNote
2. Select target journal's citation style from software library
3. Regenerate citations and reference list automatically
4. Manually verify formatting matches journal examples

**Key elements to check when converting:**
- In-text format (switch numbered ↔ author-date)
- Journal name abbreviation style
- Article title capitalization
- Author name format (initials vs. full names)
- DOI format and inclusion
- Issue number inclusion/exclusion
- Page number format

**Manual verification essential for:**
- Preprints and non-standard sources
- Software/datasets citations
- Conference proceedings
- Dissertations and theses

### Venue-Specific Evaluation Criteria

**Content expectations:**
- **Archival journals (JMLR/TPAMI)**: >50% citations from last 5 years; primary sources preferred
- **Systems/DB venues**: Recent, reproducible work valued; surveys valued
- **ML conferences**: Recent papers (last 2-3 years); preprints (arXiv) acceptable
- **Self-citation**: Keep <20% across all venues

**Format compliance (often automated):**
- Match venue citation style exactly
- All in-text citations have corresponding references
- Include DOIs when required (journals) or arXiv IDs (ML conferences)
- Use correct abbreviations (ISO 4 for journals, venue `.sty` for conferences)

**ML conference specifics:**
- **NeurIPS/ICML/ICLR**: ArXiv preprints widely cited; recent work heavily valued
- **Page limits strict**: Citation formatting affects space
- **Supplementary material**: Can include extended bibliography
- **Double-blind review**: Avoid obvious self-citation patterns during review

### Citation Density by Venue Type

| Venue Type | Expected Citations | Key Notes |
|-----------|-------------------|-----------|
| **Nature/Science research** | 30-50 | Selective, high-impact citations |
| **Archival CS journals (TPAMI)** | 25-40 | Recent, reproducible evidence |
| **Field-specific journals** | 30-60 | Comprehensive field coverage |
| **ML conferences (8-page)** | 20-40 | Space-limited, recent work |
| **Review articles** | 100-300+ | Comprehensive coverage |

**ML conference citation practices:**
- **NeurIPS/ICML**: 25-40 references typical for 8-page papers
- **Workshop papers**: 15-25 references
- **ArXiv preprints**: Widely accepted and cited
- **Related work**: Concise but comprehensive; often moved to appendix
- **Recency critical**: Cite work from last 1-2 years when relevant

### Pre-Submission Citation Checklist

**Content:**
- [ ] ≥50% citations from last 5-10 years (or 2-3 years for ML conferences)
- [ ] <20% self-citations; balanced perspectives
- [ ] Primary sources cited (not citation chains)
- [ ] All claims supported by appropriate citations

**Format:**
- [ ] Style matches venue exactly (check template)
- [ ] All in-text citations in reference list and vice versa
- [ ] DOIs/arXiv IDs included as required
- [ ] Abbreviations match venue style

**ML conferences additional:**
- [ ] ArXiv preprints properly formatted
- [ ] Self-citations anonymized if double-blind review
- [ ] References fit within page limits

## Resources for Citation Styles

### Official Manuals
- APA: https://apastyle.apa.org/
- IEEE: https://ieeeauthorcenter.ieee.org/
- ACM Reference Format: https://www.acm.org/publications/authors/reference-formatting
- Chicago: https://www.chicagomanualofstyle.org/
- ACL style/BibTeX: https://github.com/acl-org/acl-style-files

### Venue-Specific Style Guides
- Nature: https://www.nature.com/nature/for-authors/formatting-guide
- Science: https://www.science.org/content/page/instructions-authors
- JMLR: https://www.jmlr.org/author-info.html
- NeurIPS: https://neurips.cc/Conferences/CallForPapers

### Quick Reference Guides
- Purdue OWL: https://owl.purdue.edu/
- Citation Machine: https://www.citationmachine.net/
- EasyBib: https://www.easybib.com/

### Reference Management
- Zotero: https://www.zotero.org/
- Mendeley: https://www.mendeley.com/
- EndNote: https://endnote.com/

### Journal Citation Style Databases
- Journal Citation Reports (Clarivate): Lists journal citation styles
- EndNote style repository: >7000 journal-specific styles
- Zotero Style Repository: https://www.zotero.org/styles
