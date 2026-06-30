#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
compile.py — 用 Tectonic 把 LaTeX 编译成 PDF，并把报错解析成简明清单。

为什么用 Tectonic：自包含单文件引擎，自动下载缺失宏包，自动跑多遍 + BibTeX，
无需 MiKTeX/TeX Live，离线（首跑联网拉 bundle 后即可离线）。

用法：
    python compile.py [main.tex]            # 默认 McMaster 论文主文件
    python compile.py path/to/Main.tex
    python compile.py --keep-logs           # 保留 .log/.blg/.synctex.gz 便于排错
    python compile.py --outdir build        # 指定输出目录

退出码：0 成功；1 编译失败（已打印解析后的错误）；2 环境/参数问题。
"""
import argparse
import os
import re
import shutil
import subprocess
import sys

# Windows 控制台默认 GBK，无法打印 ✅/中文 → 强制 UTF-8 输出
for _stream in ("stdout", "stderr"):
    try:
        getattr(sys, _stream).reconfigure(encoding="utf-8")
    except Exception:
        pass

# 默认编译目标：真正写作的论文主文件（thesis/ 目录）。
# 参考模板原件在 thesis-materials/template/；正文写作在 thesis/。
DEFAULT_MAIN = r"D:\Research\Thesis\thesis\Thesis_Main.tex"

# 编译失败时从 stderr / .log 里抓取的关键模式
ERROR_PATTERNS = [
    (r"^! Undefined control sequence", "未定义命令（可能拼错宏或缺宏包）"),
    (r"^! LaTeX Error: File `([^']+)' not found", "缺文件/宏包：{0}"),
    (r"^! Package (\w+) Error: (.+)", "宏包 {0} 报错：{1}"),
    (r"^! Missing \$ inserted", "数学模式缺 $（行内公式没包 $...$）"),
    (r"^! Missing (\{|\}) inserted", "缺花括号 {0}"),
    (r"^! Undefined .*\\begin\{", "环境未定义（缺宏包或拼错）"),
    (r"^! (.+)", "LaTeX 错误：{0}"),
    (r"^error: (.+)", "Tectonic 错误：{0}"),
]
# 仅警告（不致命，但值得提醒）
WARN_PATTERNS = [
    (r"Citation `([^']+)' (?:on page .*?)?undefined", "引用未定义：{0}（.bib 里没有或没跑到）"),
    (r"Reference `([^']+)' .*undefined", "交叉引用未定义：{0}（\\label/\\ref 不匹配）"),
    (r"Overfull \\hbox", "排版溢出 Overfull hbox（多见于长公式/URL，非致命）"),
]


def find_tectonic():
    exe = shutil.which("tectonic")
    if not exe:
        print("[ERR] 未找到 tectonic。请先安装：winget install TectonicProject.Tectonic "
              "或 https://tectonic-typesetting.github.io/", file=sys.stderr)
        sys.exit(2)
    return exe


def parse_log(text):
    """从 tectonic 输出 + .log 文本里抽取错误与警告，返回 (errors, warnings)。"""
    errors, warnings, seen = [], [], set()
    for raw in text.splitlines():
        line = raw.rstrip()
        for pat, tmpl in ERROR_PATTERNS:
            m = re.search(pat, line)
            if m:
                msg = tmpl.format(*m.groups()) if m.groups() else tmpl
                key = ("E", msg)
                if key not in seen:
                    seen.add(key)
                    # 顺带找下一处 l.NNN 行号
                    errors.append(msg)
                break
        for pat, tmpl in WARN_PATTERNS:
            m = re.search(pat, line)
            if m:
                msg = tmpl.format(*m.groups()) if m.groups() else tmpl
                key = ("W", msg)
                if key not in seen:
                    seen.add(key)
                    warnings.append(msg)
                break
    # 抓行号提示
    line_hints = re.findall(r"^l\.(\d+) (.*)$", text, flags=re.M)
    return errors, warnings, line_hints


def human_size(n):
    for unit in ("B", "KiB", "MiB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} GiB"


def count_pages(pdf):
    """无依赖地数 PDF 页数：统计 /Type /Page 对象。失败返回 None。"""
    try:
        with open(pdf, "rb") as f:
            data = f.read()
        n = len(re.findall(rb"/Type\s*/Page[^s]", data))
        return n or None
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser(description="用 Tectonic 编译 LaTeX 为 PDF。")
    ap.add_argument("main", nargs="?", default=DEFAULT_MAIN, help="主 .tex 文件路径")
    ap.add_argument("--keep-logs", action="store_true", help="保留 .log/.blg/.synctex.gz")
    ap.add_argument("--synctex", action="store_true", help="生成 SyncTeX（编辑器正反向跳转）")
    ap.add_argument("--outdir", default=None, help="输出目录（默认与 .tex 同目录）")
    args = ap.parse_args()

    main_tex = os.path.abspath(args.main)
    if not os.path.isfile(main_tex):
        print(f"[ERR] 找不到主文件：{main_tex}", file=sys.stderr)
        sys.exit(2)
    work = os.path.dirname(main_tex)
    tectonic = find_tectonic()

    cmd = [tectonic, "--keep-logs", "--chatter", "minimal"]
    if args.synctex:
        cmd.append("--synctex")
    if args.outdir:
        os.makedirs(args.outdir, exist_ok=True)
        cmd += ["--outdir", os.path.abspath(args.outdir)]
    cmd.append(main_tex)

    print(f"[compile] {os.path.basename(main_tex)}  (Tectonic)")
    proc = subprocess.run(cmd, cwd=work, capture_output=True, text=True,
                          encoding="utf-8", errors="replace")
    combined = (proc.stdout or "") + "\n" + (proc.stderr or "")

    # 读 .log 补充解析
    base = os.path.splitext(os.path.basename(main_tex))[0]
    log_dir = os.path.abspath(args.outdir) if args.outdir else work
    log_path = os.path.join(log_dir, base + ".log")
    log_text = ""
    if os.path.isfile(log_path):
        with open(log_path, encoding="utf-8", errors="replace") as f:
            log_text = f.read()

    errors, warnings, hints = parse_log(combined + "\n" + log_text)
    pdf_path = os.path.join(log_dir, base + ".pdf")
    ok = proc.returncode == 0 and os.path.isfile(pdf_path)

    if not args.keep_logs:
        # 清掉散落的中间文件，保持源目录干净（保留 PDF）
        junk_ext = (".log", ".blg", ".aux", ".out", ".toc", ".lof", ".lot",
                    ".bbl", ".bcf", ".synctex.gz", ".run.xml", ".fls", ".fdb_latexmk")
        for root, _dirs, files in os.walk(work):
            for fn in files:
                if any(fn.endswith(e) for e in junk_ext):
                    try:
                        os.remove(os.path.join(root, fn))
                    except OSError:
                        pass

    print("\n" + "=" * 56)
    if ok:
        sz = human_size(os.path.getsize(pdf_path))
        pages = count_pages(pdf_path)
        pg = f"，约 {pages} 页" if pages else ""
        print(f"✅ 编译成功 → {pdf_path}  ({sz}{pg})")
        if warnings:
            print("\n⚠️ 警告（不致命，但建议核对）：")
            for w in warnings[:12]:
                print("  - " + w)
        sys.exit(0)
    else:
        print("❌ 编译失败。")
        if errors:
            print("\n关键错误：")
            for e in errors[:15]:
                print("  - " + e)
        if hints:
            print("\n出错位置（行号 → 上下文）：")
            for ln, ctx in hints[:8]:
                print(f"  - 第 {ln} 行：{ctx.strip()[:80]}")
        if not errors and not hints:
            print("\n（未匹配到结构化错误，原始尾部输出：）")
            for line in combined.strip().splitlines()[-15:]:
                print("  " + line)
        print("\n提示：加 --keep-logs 看完整 .log；常见错误见本技能 references/troubleshooting.md")
        sys.exit(1)


if __name__ == "__main__":
    main()
