# Reproducibility and Reporting Standards for CS/ML Research

## Overview

Reproducibility and reporting standards are community-developed recommendations for what information should be disclosed when reporting specific types of computer science and machine learning research. They provide checklists, documentation templates, and flow diagrams to ensure complete, accurate, and transparent reporting, which is essential for readers to assess the validity of a result and for other researchers to reproduce the work.

CS/ML has no single central registry, but a well-established set of artifacts has emerged: conference paper checklists (NeurIPS, ICML, ICLR), the ML Reproducibility Checklist, documentation templates (Model Cards, Datasheets for Datasets), experiment/compute reporting recommendations, ACM artifact-evaluation badges, and pre-registration. Using the appropriate standard improves manuscript quality, satisfies venue requirements, and increases the likelihood of acceptance.

## Why Use Reporting Standards?

### Benefits

**For authors:**
- Ensures nothing important is forgotten (seeds, splits, compute, hyperparameters)
- Increases acceptance rates and passes automated/desk checks
- Improves manuscript and appendix organization
- Reduces reviewer requests for additional experiments or clarifications

**For readers and reviewers:**
- Enables critical appraisal of experimental validity (baseline fairness, leakage, variance)
- Facilitates meta-analyses, leaderboards, and survey papers
- Improves understanding of what was actually trained and evaluated

**For the field:**
- Enhances reproducibility and replication
- Reduces wasted compute and duplicated effort
- Improves transparency around data provenance and model behavior
- Enables better synthesis of empirical evidence across papers

### When to Use

- **During study design**: Decide splits, seeds, and evaluation protocol before running experiments (pre-registration templates help here)
- **During manuscript drafting**: Use the checklist to ensure every item is covered in the paper or appendix
- **Before submission**: Verify adherence and complete the venue's paper checklist (mandatory at NeurIPS/ICML/ICLR)
- **Many venues require**: A completed checklist and/or a code/data availability statement as part of submission

## Major Reporting Standards by Study Type

### NeurIPS Paper Checklist - Empirical ML Papers

**Full name:** NeurIPS Paper Checklist (formerly the NeurIPS Reproducibility Checklist)

**When to use:** Any paper submitted to NeurIPS; also a strong template for ICML, ICLR, and other empirical ML venues

**Latest version:** Updated annually with the call for papers

**Key components:**
- **Checklist**: A per-paper questionnaire authors must complete and include, with justifications and pointers to where each item is addressed
- **Coverage**: Claims, theoretical assumptions/proofs, experimental reproducibility, data/code access, compute, safeguards, licensing, and broader impact

**Main checklist items:**
1. Abstract and introduction claims match contributions and scope
2. Limitations of the work are discussed
3. Theoretical results state full assumptions and complete proofs
4. Information needed to reproduce main experimental results is disclosed
5. Open access to data and code, with instructions to reproduce
6. Training and test details specified (data splits, optimizer, hyperparameters)
7. Error bars / statistical significance reported and how they were computed
8. Compute resources (hardware, memory, wall-clock time) specified
9. Research conforms to the code of ethics
10. Broader impacts (positive and negative societal consequences) discussed
11. Safeguards for responsible release of high-risk data or models
12. Existing assets (code, data, models) are properly credited and licensed
13. New assets are documented (e.g., with a Datasheet or Model Card)
14. Details of any human-subjects / crowdsourcing and IRB-equivalent approval
15. Use of LLMs disclosed where they materially affect the method

**Extensions and relatives:**
- ICML reproducibility guidance and code-submission policy
- ICLR reproducibility statement (a required paragraph pointing to reproducibility artifacts)
- The ML Reproducibility Challenge (independent reproduction of accepted papers)

**Where to access:** https://neurips.cc/public/guides/PaperChecklist

### ML Reproducibility Checklist - Empirical Studies

**Full name:** The Machine Learning Reproducibility Checklist (Pineau et al.)

**When to use:** Any empirical ML paper; the field-wide superset from which venue checklists were derived

**Latest version:** v2.0

**Key components:**
- A concise checklist organized around models/algorithms, datasets, and experimental results

**Main checklist items:**
1. A clear description of the mathematical setting, algorithm, and/or model
2. A clear explanation of any assumptions
3. An analysis of complexity (time, space, sample size)
4. A link to a downloadable source of the dataset or simulation environment
5. An explanation of data collection and any preprocessing steps
6. An explanation of train/validation/test splits
7. The range of hyperparameters considered, and the selection method and criterion
8. The exact number of training and evaluation runs
9. A clear definition of the specific measure or statistic used to report results
10. A description of results including central tendency and variation
11. The average runtime for each result, or estimated energy cost
12. A description of the computing infrastructure used

**Where to access:** https://www.cs.mcgill.ca/~jpineau/ReproducibilityChecklist.pdf

### Model Cards - Model Documentation

**Full name:** Model Cards for Model Reporting (Mitchell et al.)

**When to use:** Any released, trained model — especially models intended for reuse or deployment

**Purpose:** A short document accompanying a model that reports intended use, performance across conditions and subgroups, and known limitations

**Main sections:**
1. **Model details**: Owner, date, version, type, training algorithm, citation, license
2. **Intended use**: Primary intended uses, users, and out-of-scope uses
3. **Factors**: Relevant groups, instrumentation, and environments
4. **Metrics**: Performance measures, decision thresholds, and variation approaches
5. **Evaluation data**: Datasets, motivation, and preprocessing
6. **Training data**: Distribution and any known biases (may point to a Datasheet)
7. **Quantitative analyses**: Disaggregated results across factors
8. **Ethical considerations**: Risks, harms, and mitigations
9. **Caveats and recommendations**: Additional concerns and guidance

**Where to access:** https://arxiv.org/abs/1810.03993

### Datasheets for Datasets - Dataset Documentation

**Full name:** Datasheets for Datasets (Gebru et al.)

**When to use:** Any newly released dataset or benchmark; strongly recommended when introducing data as a paper contribution

**Purpose:** A structured questionnaire documenting a dataset's motivation, composition, collection, and recommended use to improve transparency and accountability

**Main sections (question groups):**
1. **Motivation**: Why the dataset was created and by whom
2. **Composition**: What the instances are, labels, relationships, sensitive content
3. **Collection process**: How data was acquired, sampling, consent, timeframe
4. **Preprocessing/cleaning/labeling**: What was done and whether raw data is kept
5. **Uses**: Tasks the dataset has been / could be used for, and inappropriate uses
6. **Distribution**: How it is shared, license, and access restrictions
7. **Maintenance**: Who maintains it, update and retention policy, contact

**Related templates:** Data Statements for NLP; Data Cards; Dataset Nutrition Labels

**Where to access:** https://arxiv.org/abs/1803.09010

### Experiment, Compute, and Hyperparameter Reporting

**Full name:** Reproducible experimental reporting (Dodge et al., "Show Your Work"; community compute-reporting norms)

**When to use:** Every empirical paper reporting model performance or comparisons

**Purpose:** Ensure that reported numbers are interpretable, comparable, and reproducible, and that comparisons are fair with respect to tuning budget and compute

**Key items:**
1. **Hyperparameter search**: Search space, search method (grid/random/Bayesian), and selection criterion
2. **Tuning budget**: Number of trials / configurations evaluated per model, including baselines
3. **Validation performance**: Report validation as well as test; report expected performance as a function of budget where feasible
4. **Runs and variance**: Number of seeds/runs; report mean and spread (std, CI, or min/max)
5. **Significance**: Statistical tests or bootstrap intervals for headline comparisons
6. **Compute**: Hardware (GPU/TPU type, count), memory, wall-clock time, and estimated energy/carbon where relevant
7. **Software**: Framework and versions, key library versions, and random-seed handling
8. **Data**: Exact splits, preprocessing, tokenization/featurization, and any leakage checks

**Where to access:** https://arxiv.org/abs/1909.03004 (see also the code-release guidance below)

### ACM Artifact Review and Badging - Reusable Artifacts

**Full name:** ACM Artifact Review and Badging

**When to use:** Papers submitting code/data artifacts for independent evaluation (common at SIGMOD, SOSP, PLDI, MLSys, and many ACM venues)

**Latest version:** Version 1.1

**Three badge families:**
1. **Artifacts Evaluated** — *Functional* and *Reusable*: the artifact is documented, consistent, complete, and exercisable (Reusable adds a higher bar for others to build on)
2. **Artifacts Available**: the artifact is placed in a permanent public archive with a DOI
3. **Results Reproduced / Replicated**: an independent team obtained the paper's results using (Reproduced) or without (Replicated) the authors' artifact

**What an artifact submission typically includes:**
- Source code with build instructions and pinned dependencies (container/environment file)
- Data or a script to obtain it, plus expected outputs
- A "getting started" guide and step-by-step instructions to reproduce key results
- Estimated resource and time requirements

**Where to access:** https://www.acm.org/publications/policies/artifact-review-and-badging-current

### Code Release Guidance - Releasing Research Code

**Full name:** ML Code Completeness Checklist (Papers with Code)

**When to use:** Any paper releasing an implementation; the basis for the code-completeness score shown on many repositories

**Key items:**
1. **Dependencies**: A specification of the environment (requirements file, container, or environment.yml)
2. **Training code**: Scripts to reproduce training of the reported models
3. **Evaluation code**: Scripts to reproduce reported evaluation numbers
4. **Pre-trained models**: Released checkpoints where feasible
5. **Results**: A table or script linking commands to reported results, with a README

**Where to access:** https://github.com/paperswithcode/releasing-research-code

### Pre-Registration - Confirmatory Experiments

**Full name:** Pre-registration for machine learning / empirical CS

**When to use:** Confirmatory studies, human-subjects HCI experiments, and any work distinguishing exploratory from confirmatory analyses

**Purpose:** Specify hypotheses, datasets, models, metrics, and the analysis plan *before* running experiments, reducing researcher degrees of freedom and selective reporting

**Main items:**
1. Hypotheses and predictions stated in advance
2. Datasets, splits, and any held-out benchmarks fixed before analysis
3. Models/baselines and hyperparameter protocol specified
4. Primary and secondary metrics defined, with the decision rule
5. Planned statistical analysis and stopping criteria
6. Distinction between confirmatory and exploratory analyses

**Where to access:** https://preregister.science/

### Search and Screening Flow Diagram - Systematic Reviews and Surveys

**Full name:** Search and screening flow diagram (generic systematic-review flow)

**When to use:** Systematic literature reviews and survey papers that follow a systematic search protocol (SLRs in software engineering and ML)

**Purpose:** Document how the final set of included papers was obtained, so the review is transparent and repeatable

**Main stages:**
1. **Identification**: Records retrieved from each source (arXiv, Semantic Scholar, ACL Anthology, DBLP, OpenReview) and count per source
2. **Deduplication**: Duplicate records removed
3. **Screening**: Records screened by title/abstract; records excluded with reasons
4. **Eligibility**: Full texts assessed; exclusions with reasons
5. **Included**: Studies included in the qualitative and/or quantitative synthesis

**Related guidance:** Kitchenham's guidelines for systematic literature reviews in software engineering

**Where to access:** https://www.semanticscholar.org/ (sources) and Kitchenham & Charters SLR guidelines

## How to Use Reporting Standards

### During Study Planning

1. **Identify the relevant standard(s)** based on your contribution type (method, dataset, system, survey)
2. **Review items that require planning** (splits, seeds, tuning budget, compute logging)
3. **Instrument your pipeline** so that all required elements are captured automatically (log seeds, configs, and run counts)
4. **Consider pre-registration** for confirmatory or human-subjects experiments

### During Manuscript Drafting

1. **Open the venue checklist** (e.g., the NeurIPS Paper Checklist)
2. **Work through each item** systematically
3. **Note where each item is addressed** (section or appendix number)
4. **Revise the paper/appendix** to include missing items
5. **Prepare flow diagrams** (search & screening for surveys; pipeline diagrams for systems)

### Before Submission

1. **Complete the venue checklist** with justifications and pointers
2. **Verify all items** are adequately addressed
3. **Include the code/data availability statement** and, where used, a Model Card / Datasheet
4. **State adherence** in the reproducibility statement (ICLR) or checklist (NeurIPS/ICML)

### Example Checklist Entry

```
Item: Information needed to reproduce the main experimental results
Section 4.1 / Appendix B: "All models were trained on the WMT14 En-De training split
(4.5M sentence pairs). We used AdamW (lr = 3e-4, warmup 4k steps, batch 32k tokens),
trained for 100k steps on 8x A100 (40GB) for ~14 hours per run. Each configuration was
run with 5 seeds {13, 21, 42, 87, 100}; we report mean +/- std. Preprocessing (BPE, 32k
merges) and the exact config files are in the released repository."
```

## Finding the Right Standard

### By Contribution Type

| If your contribution is a... | Use this standard |
|-----------------------------|-------------------|
| Empirical method / model paper | NeurIPS Paper Checklist + experiment/compute reporting |
| New dataset or benchmark | Datasheets for Datasets (+ intended-use statement) |
| Released, reusable model | Model Card |
| Systems paper with code/data artifact | ACM Artifact Review and Badging |
| Any paper releasing code | ML Code Completeness Checklist |
| Confirmatory / human-subjects study | Pre-registration |
| Systematic review or survey | Search & screening flow diagram + SLR guidelines |
| Theory paper | Checklist items on assumptions and complete proofs |

### Multiple Standards

**Some papers require several standards together:**

**Example 1:** A paper introducing a new benchmark *and* a strong baseline
- Datasheet for the dataset
- NeurIPS checklist + experiment/compute reporting for the baseline

**Example 2:** A systems paper with a released, reusable model
- ACM artifact badging for the code artifact
- Model Card for the released checkpoint

## Extensions and Adaptations

Many standards have community variants for specific contexts:

### Documentation-Template Variants

- **Data Statements for NLP**: dataset documentation tailored to language data
- **Data Cards / Dataset Nutrition Labels**: compact, structured dataset summaries
- **Model Cards for foundation models**: extended sections on capabilities, evaluations, and misuse

### Venue-Specific Checklist Variants

- **NeurIPS Datasets & Benchmarks track**: emphasizes documentation, hosting, and licensing
- **ICLR reproducibility statement**: a required paragraph pointing to reproducibility artifacts
- **ACL Responsible NLP Checklist**: data, systems, and ethics items for *ACL venues

## Creating Flow Diagrams

### Pipeline / Experiment Flow Diagram

For method and systems papers, a pipeline diagram shows how data flows through preprocessing, model, and evaluation, and where each experimental condition branches.

**Example (ablation branching):**
```
Raw corpus (N = 4.5M pairs)
    |
Preprocessing (BPE 32k, length filter)
    |
Train split (4.0M) -- Val split (0.3M) -- Test split (0.2M)
    |
    +-- Full model (baseline)
    +-- - attention variant   (ablation A)
    +-- - pretraining         (ablation B)
    +-- - data augmentation   (ablation C)
    |
Evaluation (BLEU, chrF; 5 seeds; mean +/- std)
```

### Search and Screening Flow Diagram

**Stages:**
1. **Identification**: Records retrieved from arXiv, Semantic Scholar, ACL Anthology, DBLP, and OpenReview (report count per source)
2. **Screening**: Records screened after de-duplication; excluded with reasons
3. **Included**: Studies included in the review and synthesis

**Example:**
```
Records identified from sources (n = 812)
  - arXiv (n = 421)
  - Semantic Scholar (n = 210)
  - ACL Anthology (n = 98)
  - DBLP (n = 83)
    |
Duplicates removed (n = 137)
    |
Records screened by title/abstract (n = 675)
    |
Excluded (n = 540)
  - Not about the target task (n = 380)
  - Not peer-reviewed / no method (n = 120)
  - Other reasons (n = 40)
    |
Full texts assessed for eligibility (n = 135)
    |
Excluded (n = 88)
  - No reproducible results (n = 50)
  - Out of scope (n = 38)
    |
Studies included in synthesis (n = 47)
```

## Common Mistakes and How to Avoid Them

### Mistake 1: Not Using Any Standard

**Impact:** Missing critical information; failing venue checklist requirements

**Solution:** Identify and adopt the relevant checklist from the study-planning stage

### Mistake 2: Completing the Checklist Only After the Paper Is Done

**Impact:** You may discover that seeds, splits, or compute were never logged

**Solution:** Instrument the pipeline to capture required elements as experiments run

### Mistake 3: Incomplete Checklist Completion

**Impact:** Missed items remain unreported; reviewers flag them

**Solution:** Systematically address every item with a section/appendix pointer

### Mistake 4: Using an Outdated Checklist

**Impact:** Missing newly added items (e.g., LLM-use disclosure, safeguards)

**Solution:** Always use the current year's checklist from the venue site

### Mistake 5: Unfair Comparisons

**Impact:** Baselines under-tuned relative to the proposed method

**Solution:** Report tuning budget and search space for *all* methods, including baselines

### Mistake 6: Not Reporting Variance or Compute

**Impact:** Single-run numbers are not reproducible or comparable

**Solution:** Report multiple seeds with spread, plus hardware and wall-clock time

### Mistake 7: Generic Reporting Without Specificity

**Impact:** Insufficient detail to reproduce or appraise

**Solution:** Provide exact configs, versions, and commands (in an appendix or repo)

## Venue Requirements

### Many Venues Now Require:

1. **A completed paper checklist** (NeurIPS/ICML) or reproducibility statement (ICLR)
2. **A code/data availability statement**, with links where possible
3. **Section/appendix pointers** showing where each checklist item is addressed
4. **Documentation** (Datasheet / Model Card) for new datasets and released models

### Example Reproducibility Statement (ICLR-style):

```
"To ensure reproducibility, we describe our full experimental setup in Section 4 and
Appendix B (splits, hyperparameters, and seeds), release code and pretrained checkpoints
at github.com/user/project, and provide a Datasheet for the introduced dataset in
Appendix D. All reported numbers are means over 5 seeds with standard deviation."
```

### Venues with Strong Requirements:

- NeurIPS / ICML / ICLR (mandatory paper checklist or reproducibility statement)
- ACM venues offering artifact evaluation (SIGMOD, SOSP, PLDI, MLSys)
- *ACL venues (Responsible NLP Checklist)
- JMLR and TPAMI (encourage code/data release and detailed experimental reporting)

## Resources

### Official Standard References

- **NeurIPS Paper Checklist**: https://neurips.cc/public/guides/PaperChecklist
- **ML Reproducibility Checklist**: https://www.cs.mcgill.ca/~jpineau/ReproducibilityChecklist.pdf
- **Model Cards**: https://arxiv.org/abs/1810.03993
- **Datasheets for Datasets**: https://arxiv.org/abs/1803.09010
- **ACM Artifact Review and Badging**: https://www.acm.org/publications/policies/artifact-review-and-badging-current
- **Releasing Research Code (Papers with Code)**: https://github.com/paperswithcode/releasing-research-code
- **Pre-registration for ML**: https://preregister.science/

### Training Materials

- The ML Reproducibility Challenge publishes reproduction reports and best practices
- Many venues provide author tutorials and checklist walkthroughs
- Papers with Code documents code-completeness scoring and release conventions

### Software Tools

- **Experiment tracking**: Weights & Biases, MLflow, TensorBoard, Sacred
- **Environment capture**: Docker, conda/`environment.yml`, `pip freeze`/`requirements.txt`
- **Config management**: Hydra, Gin, or versioned YAML config files
- **Data/version control**: DVC, Git LFS, Hugging Face Datasets

## Checklist: Using Reporting Standards

**Before starting your study:**
- [ ] Identified the appropriate standard(s) for your contribution type
- [ ] Reviewed items requiring prospective logging (seeds, splits, compute)
- [ ] Instrumented the pipeline to capture required elements
- [ ] Pre-registered the analysis plan if confirmatory

**During manuscript drafting:**
- [ ] Opened the current venue checklist
- [ ] Systematically addressed each item
- [ ] Created required flow/pipeline diagrams
- [ ] Noted where each item is addressed (section/appendix)

**Before submission:**
- [ ] Completed the venue checklist with justifications
- [ ] Verified all items adequately addressed
- [ ] Included a code/data availability statement
- [ ] Attached Datasheet / Model Card for new datasets or released models
- [ ] Checked venue-specific requirements

## Venue-Specific Reporting Requirements

### Reporting Standards by Venue Type

| Venue Type | Standard Use | Transparency Requirements |
|-----------|--------------|---------------------------|
| **ML conferences (NeurIPS/ICML/ICLR)** | Mandatory paper checklist / reproducibility statement | Reproducibility details required; code strongly expected |
| **CV/NLP conferences (CVPR/ACL)** | Recommended; Responsible NLP Checklist at *ACL | Code + data statements; qualitative + quantitative results |
| **ACM systems venues** | Artifact evaluation and badging | Archived artifact with DOI; reproduction instructions |
| **ML journals (JMLR/TPAMI)** | Recommended | Methods completeness; code/data release encouraged |

### ML Conference Reporting Standards

**NeurIPS/ICML/ICLR reproducibility requirements:**
- **Datasets**: Names, versions, access methods, preprocessing
- **Code**: Availability statement; public repository common
- **Hyperparameters**: All settings reported (learning rate, batch size, schedule)
- **Seeds**: Random seeds for reproducibility
- **Computational resources**: Accelerators used, training time, memory
- **Statistical significance**: Error bars, confidence intervals, multiple runs
- **Broader Impact** statement: Societal implications

**What to include (typically in the appendix):**
- Complete hyperparameter settings and search space
- Training details and convergence criteria
- Hardware specifications
- Software versions (e.g., PyTorch 2.3, CUDA 12.1)
- Dataset splits and any preprocessing
- Evaluation metrics and protocols

### Enforcement and Evaluation

**What gets checked:**
- **ML conferences**: Paper checklist completed; reproducibility details present; code availability increasingly expected
- **ACM systems venues**: Artifact functional/available/reusable; independent reproduction of key results
- **CV/NLP venues**: Data and ethics statements; fair baselines and ablations
- **Journals**: Methods sufficiency for reproduction; code/data on request or release

**Common issues leading to rejection:**
- Missing or incomplete paper checklist
- Insufficient experimental detail for reproduction
- Missing key information (splits, seeds, tuning budget, compute)
- No code/data availability statement when expected
- Unfair or under-tuned baselines

**Reproducibility statement examples:**

**ML conference (checklist):**
```
Code available at github.com/user/project. All hyperparameters in Appendix A.
Training used 4x A100 GPUs (~20 hours). Seeds: {42, 123, 456}; results are mean +/- std.
```

**Systems venue (artifact):**
```
Artifact archived at doi.org/10.xxxx/zenodo.xxxxxx with a container and step-by-step
instructions to reproduce Tables 2-4; estimated 6 GPU-hours to reproduce headline results.
```

### Pre-Submission Reporting Checklist

**For empirical ML papers (NeurIPS/ICML/ICLR):**
- [ ] Paper checklist complete with section/appendix pointers
- [ ] All datasets named with versions and splits
- [ ] Code availability stated (repository link if available)
- [ ] Hyperparameters and search space listed (appendix acceptable)
- [ ] Random seeds reported; results as mean +/- spread
- [ ] Compute resources specified (accelerators, time, memory)
- [ ] Error bars / significance for headline comparisons
- [ ] Broader Impact / limitations discussed

**For dataset/benchmark papers:**
- [ ] Datasheet completed (motivation, composition, collection, uses, maintenance)
- [ ] License and hosting/access documented
- [ ] Intended and inappropriate uses stated
- [ ] Preprocessing and labeling process described

**For systems/artifact papers:**
- [ ] Artifact archived with a DOI (Artifacts Available)
- [ ] Build/run instructions and pinned dependencies included
- [ ] Expected outputs and reproduction steps provided
- [ ] Resource/time estimates documented

**For systematic reviews / surveys:**
- [ ] Search sources listed (arXiv, Semantic Scholar, ACL Anthology, DBLP, OpenReview)
- [ ] Search & screening flow diagram included
- [ ] Inclusion/exclusion criteria documented
- [ ] Search strategy reproducible (queries and dates)
