# Citation Styles Reference

This document provides detailed guidelines for formatting citations in various academic styles commonly used in literature reviews.

## APA Style (7th Edition)

### Journal Articles

**Format**: Author, A. A., Author, B. B., & Author, C. C. (Year). Title of article. *Title of Periodical*, *volume*(issue), page range. https://doi.org/xx.xxx/yyyy

**Example**: Smith, J. D., Johnson, M. L., & Williams, K. R. (2023). Retrieval-augmented generation for open-domain question answering. *Nature Machine Intelligence*, *5*(4), 301-318. https://doi.org/10.1038/natmachintell.2023.001

### Books

**Format**: Author, A. A. (Year). *Title of work: Capital letter also for subtitle*. Publisher Name. https://doi.org/xxxx

**Example**: Russell, S. J., & Norvig, P. (2021). *Artificial intelligence: A modern approach* (4th ed.). Pearson.

### Book Chapters

**Format**: Author, A. A., & Author, B. B. (Year). Title of chapter. In E. E. Editor & F. F. Editor (Eds.), *Title of book* (pp. xx-xx). Publisher.

**Example**: Vaswani, A., & Shazeer, N. (2020). Attention mechanisms for sequence modeling. In I. Goodfellow & Y. Bengio (Eds.), *Handbook of deep learning* (pp. 1-45). MIT Press.

### Preprints

**Format**: Author, A. A., & Author, B. B. (Year). Title of preprint. *Repository Name*. https://doi.org/xxxx

**Example**: Zhang, Y., Chen, L., & Wang, H. (2024). Sparse mixture-of-experts for efficient language models. *arXiv*. https://doi.org/10.48550/arXiv.2401.00001

### Conference Papers

**Format**: Author, A. A. (Year, Month day-day). Title of paper. In E. E. Editor (Ed.), *Title of conference proceedings* (pp. xx-xx). Publisher. https://doi.org/xxxx

---

## Nature Style

### Journal Articles

**Format**: Author, A. A., Author, B. B. & Author, C. C. Title of article. *J. Name* **volume**, page range (year).

**Example**: Smith, J. D., Johnson, M. L. & Williams, K. R. Retrieval-augmented generation for open-domain question answering. *Nat. Mach. Intell.* **5**, 301-318 (2023).

### Books

**Format**: Author, A. A. & Author, B. B. *Book Title* (Publisher, Year).

**Example**: Russell, S. J. & Norvig, P. *Artificial Intelligence: A Modern Approach* 4th edn (Pearson, 2021).

### Multiple Authors

- 1-2 authors: List all
- 3+ authors: List first author followed by "et al."

**Example**: Zhang, Y. et al. Sparse mixture-of-experts for efficient language models. *arXiv* https://doi.org/10.48550/arXiv.2401.00001 (2024).

---

## Chicago Style (Author-Date)

### Journal Articles

**Format**: Author, First Name Middle Initial. Year. "Article Title." *Journal Title* volume, no. issue (Month): page range. https://doi.org/xxxx.

**Example**: Smith, John D., Mary L. Johnson, and Karen R. Williams. 2023. "Retrieval-Augmented Generation for Open-Domain Question Answering." *Nature Machine Intelligence* 5, no. 4 (April): 301-318. https://doi.org/10.1038/natmachintell.2023.001.

### Books

**Format**: Author, First Name Middle Initial. Year. *Book Title: Subtitle*. Edition. Place: Publisher.

**Example**: Russell, Stuart J., and Peter Norvig. 2021. *Artificial Intelligence: A Modern Approach*. 4th ed. Hoboken: Pearson.

---

## IEEE Style

### Journal Articles

**Format**: [#] A. A. Author, B. B. Author, and C. C. Author, "Title of article," *Abbreviated Journal Name*, vol. x, no. x, pp. xxx-xxx, Month Year.

**Example**: [1] J. D. Smith, M. L. Johnson, and K. R. Williams, "Retrieval-augmented generation for open-domain question answering," *Nat. Mach. Intell.*, vol. 5, no. 4, pp. 301-318, Apr. 2023.

### Books

**Format**: [#] A. A. Author, *Title of Book*, xth ed. City, State: Publisher, Year.

**Example**: [2] S. J. Russell and P. Norvig, *Artificial Intelligence: A Modern Approach*, 4th ed. Hoboken, NJ: Pearson, 2021.

---

## Common Abbreviations for Journal Names

- Nature: Nat.
- Nature Machine Intelligence: Nat. Mach. Intell.
- Science: Science
- Communications of the ACM: Commun. ACM
- Journal of Machine Learning Research: J. Mach. Learn. Res.
- IEEE Transactions on Pattern Analysis and Machine Intelligence: IEEE Trans. Pattern Anal. Mach. Intell.
- Advances in Neural Information Processing Systems: Adv. Neural Inf. Process. Syst.
- ACM Transactions on Graphics: ACM Trans. Graph.
- ACM Computing Surveys: ACM Comput. Surv.

---

## DOI Best Practices

1. **Always verify DOIs**: Use the verify_citations.py script to check all DOIs
2. **Format as URLs**: https://doi.org/10.xxxx/yyyy (preferred over doi:10.xxxx/yyyy)
3. **No period after DOI**: DOI should be the last element without trailing punctuation
4. **Resolve redirects**: Check that DOIs resolve to the correct article

---

## In-Text Citation Guidelines

### APA Style
- (Smith et al., 2023)
- Smith et al. (2023) demonstrated...
- Multiple citations: (Brown, 2022; Smith et al., 2023; Zhang, 2024)

### Nature Style
- Superscript numbers: Recent studies^1,2^ have shown...
- Or: Recent studies (refs 1,2) have shown...

### Chicago Style
- (Smith, Johnson, and Williams 2023)
- Smith, Johnson, and Williams (2023) found...

---

## Reference List Organization

### By Citation Style
- **APA, Chicago**: Alphabetical by first author's last name
- **Nature, IEEE, ACM**: Numerical order of first appearance in text

### Hanging Indents
Most styles use hanging indents where the first line is flush left and subsequent lines are indented.

### Consistency
Maintain consistent formatting throughout:
- Capitalization (title case vs. sentence case)
- Journal name abbreviations
- DOI presentation
- Author name format
