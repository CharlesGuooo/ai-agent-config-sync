---
name: latex-compilation
description: >-
  Compile LaTeX to PDF and report errors clearly, using the self-contained
  Tectonic engine (auto-downloads packages, runs multi-pass + BibTeX, no
  MiKTeX/TeX Live needed). Use this whenever the user wants to build/compile
  the thesis or any .tex file into a PDF, regenerate the PDF after edits, or
  debug LaTeX compile errors. Triggers: "compile the thesis", "build PDF",
  "编译 latex", "生成 PDF", "thesis 编译报错", "为什么编译不出来", "rebuild the pdf".
---

# LaTeX Compilation (Tectonic)

把 LaTeX 编译成 PDF，并把报错解析成简明清单。底层用 **Tectonic**（本机已装），
自包含、自动拉宏包、自动多遍 + BibTeX，无需 MiKTeX/TeX Live。

## 何时用
- 用户要「编译 / build / 生成 PDF / 出 PDF / rebuild」论文或任意 `.tex`。
- 改完 `.tex` 后要重新生成 PDF。
- 编译报错要排查（命令会把错误定位到行号 + 关键原因）。

## 怎么用

默认编译你正在写作的论文主文件（`D:\Research\Thesis\thesis\Thesis_Main.tex`）。
（参考模板原件在 `thesis-materials\template\`；正文写作在 `thesis\`。）
```bash
python .cursor/skills/latex-compilation/scripts/compile.py
```

编译指定文件 / 常用选项：
```bash
python .cursor/skills/latex-compilation/scripts/compile.py path/to/Main.tex
python .cursor/skills/latex-compilation/scripts/compile.py --keep-logs     # 保留 .log 排错
python .cursor/skills/latex-compilation/scripts/compile.py --synctex       # 编辑器正反跳转
python .cursor/skills/latex-compilation/scripts/compile.py --outdir build  # 输出到 build/
```

脚本行为：
- 成功 → 打印 PDF 路径 + 大小 + 估算页数，并列出非致命警告（如未定义引用）。
- 失败 → 解析出关键错误（未定义命令 / 缺宏包文件 / 缺 `$` / 宏包报错）+ 出错行号，
  退出码 1。加 `--keep-logs` 看完整 `.log`。
- 默认编译后**清理散落的中间文件**（`.aux/.log/.blg/.toc/...`），只留 `.pdf`，保持源目录干净。

## 关于本项目模板（重要）
- 引擎：`report` 文档类 + `natbib`，书目样式 **`IEEEtranN`**（来自 IEEEtran 宏包，Tectonic 自带）。
  Tectonic 会**自动**跑 BibTeX，无需手动 `bibtex`。
- **单/双倍行距**：编辑 `Thesis_Main.tex` 顶部，注释 `gscale_thesis_doublespace`、
  启用 `gscale_thesis_singlespace` 即切单倍（终稿按官方指南，默认双倍）。
- 示例 `.bib` 是占位的，编译时 BibTeX 可能打印「errors ignored」警告——**模板骨架阶段正常**，
  等你填了真实 `bib/references.bib` 并 `\cite` 后即消失。
- 首次编译会联网下载 Tectonic bundle 与字体，属正常；之后可离线。

## 排错
常见 LaTeX/Tectonic 报错与修法见 `references/troubleshooting.md`。
拿不准时，用 `--keep-logs` 跑一遍，把 `<主文件>.log` 末尾贴出来分析。
