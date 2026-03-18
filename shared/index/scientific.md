# 科学计算 Skills 索引

> 调用方式: `/skill-name` 或描述需求让 Claude 匹配
>
> 触发关键词用于语义匹配，直接在需求中提及即可激活对应 skill

## 机器学习

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `scikit-learn` | 机器学习 | sklearn, scikit-learn, 机器学习, ML, 分类, classification, 回归, regression, 聚类, clustering |
| `pytorch-lightning` | 深度学习 | PyTorch, Lightning, 深度学习, deep learning, 神经网络, neural network, 训练, training |
| `transformers` | 预训练模型 | HuggingFace, Transformer, BERT, GPT, LLM, 预训练, pretrained, NLP, 文本模型 |
| `torch-geometric` | 图神经网络 | GNN, PyG, 图神经网络, graph neural network, 节点分类, node classification |
| `torchdrug` | 药物发现 ML | 分子图, molecular graph, 药物发现, drug discovery, AI制药 |
| `shap` | 模型解释 | SHAP, 可解释性, interpretability, explainability, 特征重要性, feature importance |
| `stable-baselines3` | 强化学习 | RL, reinforcement learning, PPO, DQN, A2C, 智能体, agent, 奖励, reward |
| `pufferlib` | 高性能 RL | RL, 并行环境, parallel environment, 高性能强化学习 |

## 生物信息学

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `biopython` | 分子生物学 | BioPython, 序列, sequence, BLAST, FASTA, 基因, gene, 蛋白质, protein |
| `scanpy` | 单细胞 RNA-seq | scanpy, 单细胞, single-cell, scRNA-seq, 单细胞分析, cell clustering |
| `scvelo` | RNA 速度 | velocity, RNA velocity, 细胞命运, cell fate, 轨迹, trajectory |
| `scvi-tools` | 单细胞深度学习 | scVI, VAE, 单细胞, single-cell, 深度学习, 降维, dimensionality reduction |
| `pydeseq2` | 差异表达 | DESeq2, 差异表达, differential expression, RNA-seq, 基因表达 |
| `anndata` | 注释矩阵 | AnnData, 单细胞数据, single-cell data, h5ad, 矩阵, matrix |
| `pysam` | 基因组文件 | SAM, BAM, CRAM, 基因组, genome, 测序, sequencing, reads |
| `deeptools` | NGS 分析 | NGS, BAM, bigWig,Coverage, 测序分析, ChIP-seq, ATAC-seq |
| `flowio` | 流式细胞术 | FCS, Flow Cytometry, 流式, 细胞分选, fluorescence |
| `pyhealth` | 医疗 AI | EHR, 电子病历, 诊断, diagnosis, 医疗AI, healthcare AI |

## 蛋白质 & 结构

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `esm` | 蛋白质语言模型 | ESM, Meta ESM, 蛋白质序列, protein sequence, 蛋白质 embedding |
| `diffdock` | 分子对接 | Docking, 分子对接, binding, 结合位点, pocket, 蛋白配体 |
| `glycoengineering` | 糖基化工程 | 糖基化, glycosylation, 抗体, antibody, N-glycan, 糖型 |
| `pathml` | 病理图像 | WSI, 全切片, 病理, pathology, digital pathology, 组织图像 |

## 化学信息学

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `rdkit` | 化学信息学 | RDKit, 分子, molecule, SMILES, SMARTS, 化学结构, cheminformatics |
| `datamol` | RDKit 简化 | datamol, 分子操作, molecular manipulation, 简化 RDKit |
| `medchem` | 药物化学 | Lipinski, 药物性, drug-likeness, ADMET, 先导优化, lead optimization |
| `deepchem` | 分子 ML | DeepChem, 分子特征, molecular features, 分子机器学习 |
| `molfeat` | 分子特征化 | Fingerprint, Embedding, 分子特征, molecular embedding, ECFP |
| `matchms` | 质谱分析 | MS, mass spectrometry, 光谱匹配, spectrum matching, 代谢组学 |
| `pyopenms` | 质谱平台 | OpenMS, 质谱, mass spec, 蛋白质组学, proteomics |
| `pytdc` | 治疗数据 | TDC, Therapeutics Data Commons, 药物发现, drug discovery benchmark |

## 材料科学

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `pymatgen` | 材料科学 | Materials Project, 晶体结构, crystal structure, 相图, phase diagram |
| `molecular-dynamics` | 分子动力学 | MD, molecular dynamics, 模拟, simulation, GROMACS, LAMMPS |

## 神经科学

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `neurokit2` | 生物信号 | EEG, ECG, EMG, 脑电, 心电, 肌电, biosignal, 生理信号 |
| `neuropixels-analysis` | 神经像素 | Neuropixels, Spike sorting, 神经记录, neural recording, 电生理 |

## 生态系统 & 进化

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `phylogenetics` | 系统发育树 | MAFFT, IQ-TREE, 系统发育, phylogeny, 进化树, evolutionary tree |
| `etetoolkit` | 树操作 | ETE, 进化树, phylogenetic tree, 树可视化, tree visualization |
| `scikit-bio` | 生物数据 | 序列分析, 多样性, diversity, 微生物组, microbiome |
| `arboreto` | 基因调控网络 | GRN, gene regulatory network, 网络推断, network inference |

## 天文学

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `astropy` | 天文学 | astro, 天文数据, astronomy, FITS, 天体物理, astrophysics |

## 科学工作流

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `lamindb` | 数据管理 | 版本控制, 科学数据, data versioning, 实验数据, experimental data |
| `modal` | 云计算 | Serverless, GPU, 云计算, cloud computing, 远程执行 |
| `denario` | 研究助手 | 多代理, multi-agent, 科学研究, scientific research, AI scientist |
