# LaTeX / Tectonic 排错速查

> 用 `compile.py --keep-logs` 重跑，再看 `<主文件>.log` 末尾。下面按报错关键字归类。

## 首次/网络
- **首跑很慢 / 卡在 downloading**：Tectonic 首次会拉 bundle（宏包 + 字体），需联网，正常。
  之后命中缓存即可离线。缓存在 `%LOCALAPPDATA%\TectonicProject\Tectonic`。
- **`connection / network error`**：检查网络/代理；联网成功一次后离线可用。

## 书目 / 引用（本模板用 natbib + IEEEtranN）
- **`errors were issued by BibTeX, but were ignored`**：占位 `.bib` 或某章无 `\cite` 时常见，
  **非致命**。填好 `bib/references.bib` 并实际 `\cite{key}` 后消失。
- **`Citation 'xxx' undefined`**：`bib/references.bib` 里没有该 key，或 key 拼错。
- **书目不显示 / 引用变 `[?]`**：Tectonic 已自动多遍；确认 `\bibliography{bib/references,...}`
  路径正确、`\bibliographystyle{IEEEtranN}` 在。改完直接重编（无需手动 bibtex）。

## 常见硬错误
- **`! Undefined control sequence`**：用了未定义命令——拼错宏名，或缺 `\usepackage{...}`。
  日志里 `l.NNN` 指出行号。
- **`! LaTeX Error: File 'xxx.sty' not found`**：缺宏包。Tectonic 通常自动下载；若仍报，
  确认包名拼写；自定义 `.sty` 要在 `settings/` 下且 `\usepackage` 路径正确。
- **`! Missing $ inserted`**：正文里出现了数学符号（如 `_`、`^`、`\alpha`）却没包进 `$...$`。
- **`! Missing } inserted` / `Runaway argument`**：花括号没配对，常见于 `\command{...}` 漏右括号。
- **`! Package inputenc/fontenc Error`**：少见于 Tectonic（默认 UTF-8 + XeTeX）；
  若从 pdflatex 模板迁移，去掉 `\usepackage[utf8]{inputenc}` 即可。
- **`Undefined reference 'fig:xxx'`**：`\ref`/`\label` 不匹配；改完重编一次即更新。

## 图片
- **找不到图**：`\includegraphics` 路径相对主文件；图放 `figures/`，扩展名建议 PDF/PNG。
- **`Overfull \hbox`**：排版溢出（长 URL/公式/表格），非致命；可用 `\sloppy`、换行、缩图宽。

## 本模板特有
- **lay abstract / academic achievement declaration**：McMaster 必需页，已在
  `sections/0_preamble/`，由 `Thesis_Main.tex` include；勿删。
- **单/双倍行距**：切换 `Thesis_Main.tex` 顶部的 `gscale_thesis_singlespace` /
  `gscale_thesis_doublespace`。
- **页码/页眉异常**：来自 `fancyheadings.sty` + `gscale` 样式，一般勿改；终稿以
  `thesis-materials/references/` 官方指南为准。

## 兜底
- 清理重编：删 `.aux/.bbl/.toc` 等中间文件后重跑（`compile.py` 默认已清理）。
- 仍无法定位：`compile.py --keep-logs`，把 `.log` 最后 ~30 行贴出来分析。
