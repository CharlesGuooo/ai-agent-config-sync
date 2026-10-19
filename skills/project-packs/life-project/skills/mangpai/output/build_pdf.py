#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
mangpai · 盲派详批 PDF 构建器

职责分工（这是本脚本存在的理由）：
  · Claude 只写**节内容片段** sections/<id>.html —— 纯 body 片段，只用 report.css 登记的类。
  · 本脚本独占**外壳**：doctype / meta charset / title / CSS 注入 / 节次排序 / 分页。
  · 本脚本 **lint 片段**：出现 <style> / style=" / <html> / <body> 即报错退出。
    —— 把「LLM 自己发明排版」这条路堵死。

用法：
  python build_pdf.py --sections <目录> --out <输出.pdf> [--title ...] [--subtitle ...]
  python build_pdf.py --sections <目录> --lint-only        # 只查片段，不渲染
  python build_pdf.py --list-sections                      # 打印节次目录

依赖：pypdf（验收）、pypdfium2（可选，渲染抽样图）；渲染器用本机已有的
      Playwright headless shell / Chrome / Edge，三级回退，零安装。
规格正本：output/SPEC.md
"""
from __future__ import annotations
import argparse, glob, os, re, shutil, subprocess, sys, tempfile
from html.parser import HTMLParser
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

HERE = Path(__file__).resolve().parent
CSS = HERE / "report.css"

# ── 节次目录（顺序正本；SPEC.md 以此为准）────────────────────────────────
# (id, 节名, 是否骨架节)   骨架节＝每份必有，与选了几个专题无关
SECTION_ORDER: list[tuple[str, str, bool]] = [
    ("cover",            "封面",                 True),
    ("plain",            "一看就懂（大白话）",     True),
    ("basis",            "口径与假设声明",         True),
    ("chart",            "盘面速览",              True),
    ("rugu",             "入局与做功",            True),
    # —— 专题节：按第零步决策门选中才出，顺序固定 ——
    ("geju",             "格局与层次",            False),
    ("caifu",            "财富等级",              False),
    ("zoushi",           "人生分段走势总览",       False),
    ("hunyin",           "婚姻感情",              False),
    ("zinv",             "子女",                  False),
    ("zhiye",            "事业职业",              False),
    ("caiyun-nianbiao",  "来财与破财年份表",       False),
    ("liuqin",           "父母与六亲",            False),
    ("jiankang",         "健康提醒",              False),
    ("guanfei",          "官非是非提醒",           False),
    ("yingqi-zongbiao",  "应期总表",              False),
    # —— 收尾骨架节 ——
    ("calib",            "回溯校验记录",           True),
    ("appendix",         "附录",                  True),
    ("disclaimer",       "免责声明",              True),
]
ORDER_INDEX = {sid: i for i, (sid, _n, _s) in enumerate(SECTION_ORDER)}
NAMES = {sid: n for sid, n, _s in SECTION_ORDER}
REQUIRED = [sid for sid, _n, is_skel in SECTION_ORDER if is_skel]

# ── 片段 lint 规则 ──────────────────────────────────────────────────────
FORBIDDEN = [
    (re.compile(r"<style\b", re.I),        "片段内不得有 <style>——样式只能来自 output/report.css"),
    (re.compile(r"\sstyle\s*=", re.I),     "片段内不得有 inline style=——请改用 report.css 里登记的类"),
    (re.compile(r"<!doctype", re.I),       "片段是 body 内容，不要写 <!doctype>"),
    (re.compile(r"<html\b", re.I),         "片段是 body 内容，不要写 <html>"),
    (re.compile(r"<body\b", re.I),         "片段是 body 内容，不要写 <body>"),
    (re.compile(r"<head\b", re.I),         "片段是 body 内容，不要写 <head>"),
    (re.compile(r"<link\b", re.I),         "片段内不得外链资源"),
    (re.compile(r"<script\b", re.I),       "片段内不得有 <script>"),
]

# ── 大白话节禁入词（硬规格，命中即失败）────────────────────────────────
# 允许的例外：22 个干支字本身，以及「天干」「地支」（讲「好年坏年」自查规则时需要）
PLAIN_BANNED = [
    "做功", "体用", "宫星", "主宾", "取象", "类象", "金口诀", "成格之字", "败格之字",
    "判据", "反局", "限运", "大运", "流年", "十神", "比肩", "劫财", "食神", "伤官",
    "正财", "偏财", "正官", "七杀", "正印", "偏印", "羊刃", "阳刃", "阴刃",
    "墓库", "空亡", "驿马", "禄神", "官符", "亡神", "通关", "日主", "藏干",
    "纳音", "长生", "帝旺", "断语", "应期", "清纯", "党势", "意向", "元神",
]
PLAIN_BANNED_RE = re.compile("|".join(map(re.escape, PLAIN_BANNED)) + r"|ch\d+")

# ── 人称约定（全部节通用，不只管大白话节）────────────────────────────────
# 来问的人不一定是盘的主人——可能在给孩子／伴侣／父母看。所以：
#   命主（或用户给的称呼） = 盘的主人 → 第三人称，用于一切关于此人命运的陈述
#   你 / 您                = 读报告的人 → 只允许出现在下列白名单容器内
# 原文自己就分了这两个角色：ch5「命主本人」、ch22「表命主做功的方向」 vs ch39「客户不问不说」。
# 白名单三类：
#   .ask  待确认块  —— 本就是对读报告的人提要求
#   .nb   小字注    —— 阅读引导、口径说明，也是对读者说的
#   .q    原文引文  —— 引文里的「你」是《金口诀》作者在对他的学生说话，不是本报告在称呼读者；
#                     且 SKILL.md 输出纪律第 1 条规定「断语照原文措辞，不改写、不软化」，
#                     所以这一类必须豁免——lint 不能逼着去篡改原文。
SECOND_PERSON_OK = {"ask", "nb", "q"}
SECOND_PERSON_RE = re.compile(r"[你您]")


class _PersonScan(HTMLParser):
    """找出**白名单之外**出现的第二人称。

    用解析器而不是正则，是因为 .ask 块里会嵌 <ul>、<p class="nb">，
    正则切不干净这种嵌套。
    """
    VOID = {"br", "hr", "img", "meta", "link", "input", "col", "source", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack: list[bool] = []
        self.depth = 0                       # 当前处在几层白名单容器内
        self.hits: list[tuple[int, str]] = []

    def handle_starttag(self, tag, attrs):
        if tag in self.VOID:
            return
        cls = (dict(attrs).get("class") or "").split()
        allow = bool(SECOND_PERSON_OK & set(cls))
        self.stack.append(allow)
        if allow:
            self.depth += 1

    def handle_startendtag(self, tag, attrs):
        pass                                  # 自闭合标签不入栈

    def handle_endtag(self, tag):
        if tag in self.VOID or not self.stack:
            return
        if self.stack.pop():
            self.depth = max(0, self.depth - 1)   # 钳到 0：标签不配对时宁可多报也不漏报

    def handle_data(self, data):
        if self.depth > 0:
            return
        for m in SECOND_PERSON_RE.finditer(data):
            ctx = data[max(0, m.start() - 12): m.start() + 14]
            self.hits.append((self.getpos()[0], " ".join(ctx.split())))


def die(msg: str, code: int = 1):
    print(f"\n✘ {msg}", file=sys.stderr)
    sys.exit(code)


# ── 1. 收集与校验片段 ───────────────────────────────────────────────────
def collect(sections_dir: Path) -> list[tuple[str, str]]:
    files = sorted(glob.glob(str(sections_dir / "*.html")))
    if not files:
        die(f"{sections_dir} 下没有任何 .html 片段")

    found, unknown = {}, []
    for f in files:
        sid = Path(f).stem
        if sid not in ORDER_INDEX:
            unknown.append(sid)
        else:
            found[sid] = Path(f).read_text(encoding="utf-8")

    if unknown:
        die("未登记的节 id：" + "、".join(unknown) +
            "\n  合法 id 见 --list-sections 或 output/SPEC.md")

    missing = [s for s in REQUIRED if s not in found]
    if missing:
        die("缺少骨架节（每份必有）：" +
            "、".join(f"{s}（{NAMES[s]}）" for s in missing))

    return [(sid, found[sid]) for sid in sorted(found, key=lambda s: ORDER_INDEX[s])]


def lint(sections: list[tuple[str, str]]) -> None:
    problems = []
    for sid, html in sections:
        for pat, msg in FORBIDDEN:
            m = pat.search(html)
            if m:
                line = html[:m.start()].count("\n") + 1
                problems.append(f"  {sid}.html:{line}  {msg}")
    if problems:
        die("片段 lint 未通过：\n" + "\n".join(problems))

    # 大白话节术语扫描
    plain = dict(sections).get("plain", "")
    text = re.sub(r"<[^>]+>", "", plain)
    hits = sorted(set(PLAIN_BANNED_RE.findall(text)))
    if hits:
        die("大白话节（plain.html）出现术语，违反零术语规格：\n"
            + "  " + "、".join(hits)
            + "\n  改法：换成生活语言，或当场用一句话解释（例：不写「羊刃」，写「命里带的一把刀」）"
            + "\n  完整禁入词表见 output/SPEC.md")

    # 人称检查（全部节，不只大白话节）
    check_person(sections)

    n = len(re.sub(r"\s", "", text))
    if n < 500:
        print(f"  ⚠ 大白话节仅 {n} 字，规格下限为 800 字（单专题）——请补足")
    print(f"  ✓ lint 通过（{len(sections)} 节；大白话节 {n} 字，零术语；人称一致）")


def check_person(sections: list[tuple[str, str]]) -> None:
    """白名单（.ask / .nb）之外不得出现第二人称——来问的人不一定是盘的主人。"""
    problems: list[str] = []
    for sid, html in sections:
        p = _PersonScan()
        p.feed(html)
        p.close()
        for line, ctx in p.hits:
            problems.append(f"  {sid}.html:{line}  …{ctx}…")
    if not problems:
        return
    shown = problems[:20]
    more = f"\n  …另有 {len(problems) - 20} 处" if len(problems) > 20 else ""
    die("人称检查未通过——白名单外出现了第二人称「你／您」，共 "
        f"{len(problems)} 处：\n" + "\n".join(shown) + more +
        "\n\n  约定（详见 output/SPEC.md「称呼约定」）："
        "\n    来问的人不一定是盘的主人，可能在给孩子／伴侣／父母看。"
        "\n    · 说「这个人怎么样」        → 用**命主**（或用户给的称呼）"
        "\n    · 对「读报告的人」提要求    → 才可以用「你」，且只能放在 .ask / .nb 里"
        "\n  改法示例："
        "\n    你手里有两样…      →  命主手里有两样…"
        "\n    建议你主动求变      →  这一年宜主动求变（无主语的建议句更自然）"
        "\n    你爸／你老婆        →  命主的父亲／配偶")


# ── 2. 组装 HTML ────────────────────────────────────────────────────────
def assemble(sections: list[tuple[str, str]], title: str) -> str:
    css = CSS.read_text(encoding="utf-8")
    body = "\n".join(
        f'<div class="sec" data-id="{sid}"><!-- {NAMES[sid]} -->\n{html.strip()}\n</div>'
        for sid, html in sections
    )
    return (f'<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n'
            f'<title>{title}</title>\n<style>\n{css}\n</style>\n</head>\n<body>\n{body}\n</body>\n</html>\n')


# ── 3. 渲染（三级回退，零安装）──────────────────────────────────────────
def find_renderer() -> tuple[str, str]:
    la = os.environ.get("LOCALAPPDATA", "")
    cands: list[tuple[str, str]] = []
    if la:
        for p in sorted(glob.glob(os.path.join(
                la, "ms-playwright", "chromium_headless_shell-*",
                "chrome-headless-shell-win64", "chrome-headless-shell.exe")), reverse=True):
            cands.append(("playwright-headless-shell", p))
    cands += [
        ("chrome", r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        ("chrome", r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
        ("edge",   r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        ("edge",   r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
    ]
    for name, path in cands:
        if os.path.isfile(path):
            return name, path
    for exe in ("google-chrome", "chromium", "microsoft-edge"):
        p = shutil.which(exe)
        if p:
            return exe, p
    die("找不到可用渲染器（Playwright headless shell / Chrome / Edge 都不在）")
    raise AssertionError  # unreachable


def render(html: str, out_pdf: Path) -> str:
    name, exe = find_renderer()
    out_pdf.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        src = Path(td) / "report.html"
        src.write_text(html, encoding="utf-8")
        cmd = [exe, "--headless", "--disable-gpu", "--no-sandbox",
               f"--user-data-dir={Path(td) / 'prof'}",
               "--no-pdf-header-footer", "--virtual-time-budget=8000",
               f"--print-to-pdf={out_pdf}", src.as_uri()]
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if not out_pdf.is_file():
        die(f"渲染失败（{name}）\nstdout: {r.stdout[-800:]}\nstderr: {r.stderr[-800:]}")
    return name


# ── 4. 自动验收 ─────────────────────────────────────────────────────────
def verify(out_pdf: Path, sections: list[tuple[str, str]]) -> bool:
    try:
        import pypdf
    except ImportError:
        print("  ⚠ 未装 pypdf，跳过验收（建议 pip install pypdf）")
        return True

    r = pypdf.PdfReader(str(out_pdf))
    n = len(r.pages)
    pages = [(p.extract_text() or "") for p in r.pages]
    full = "".join(pages)
    box = r.pages[0].mediabox
    w, h = round(float(box.width)), round(float(box.height))
    cjk = sum(1 for c in full if "\u4e00" <= c <= "\u9fff")
    tofu = sum(1 for c in full if c in "\ufffd\u25a1\u25a0")
    thin = [(i + 1, len(t.strip())) for i, t in enumerate(pages) if len(t.strip()) < 200]

    ok = True
    print(f"\n── 验收 ──")
    print(f"  页数 {n} · 幅面 {w}×{h}pt（A4＝595×842）· 中文 {cjk} 字 · 体积 {out_pdf.stat().st_size/1024:.0f} KB")

    if tofu:
        ok = False; print(f"  ✘ 豆腐块／替换字符 {tofu} 个 —— 字体缺字形")
    else:
        print(f"  ✓ 豆腐块／替换字符 0")

    if abs(w - 595) > 3 or abs(h - 842) > 3:
        ok = False; print(f"  ✘ 幅面不是 A4")

    # 封面页字少属正常，从第 2 页起查。两级：<80 视为几乎空白（失败），80–200 偏薄（告警）
    blank = [t for t in thin if t[0] > 1 and t[1] < 80]
    sparse = [t for t in thin if t[0] > 1 and 80 <= t[1] < 200]
    if blank:
        ok = False
        print(f"  ✘ 近空页（<80 字符）：{blank}")
        print(f"     修法：在该节某个 h3/h4 上加 class=\"pb\" 主动断页，把内容切匀；或裁剪该节末尾")
    else:
        print(f"  ✓ 无近空页（<80 字符）")
    if sparse:
        print(f"  ⚠ 偏薄页（80–200 字符）：{sparse} —— 可接受，但加 class=\"pb\" 会更好看")

    if "免责声明" not in pages[-1] and "免责声明" not in "".join(pages[-2:]):
        ok = False; print(f"  ✘ 免责声明不在末页")
    else:
        print(f"  ✓ 免责声明在末页")

    # 大白话节应紧跟封面：其正文须出现在前 25% 的页里
    plain_txt = re.sub(r"<[^>]+>", "", dict(sections).get("plain", ""))
    probe = "".join(plain_txt.split())[:40]
    if probe:
        where = next((i + 1 for i, t in enumerate(pages) if probe[:20] in "".join(t.split())), None)
        if where is None:
            print(f"  ⚠ 大白话节正文未能在 PDF 文本中定位（不一定是错，可能被断词）")
        elif where > max(3, n * 0.25):
            ok = False; print(f"  ✘ 大白话节出现在第 {where} 页，应紧跟封面")
        else:
            print(f"  ✓ 大白话节在第 {where} 页（紧跟封面）")

    ids = [s for s, _ in sections]
    print(f"  节次 {len(ids)} 个：{' · '.join(NAMES[s] for s in ids)}")
    return ok


def main() -> int:
    ap = argparse.ArgumentParser(description="盲派详批 PDF 构建器")
    ap.add_argument("--sections", help="节片段目录（内含 <id>.html）")
    ap.add_argument("--out", help="输出 PDF 路径")
    ap.add_argument("--title", default="盲派四柱详批", help="PDF 标题（浏览器标签／元数据）")
    ap.add_argument("--lint-only", action="store_true", help="只查片段，不渲染")
    ap.add_argument("--keep-html", help="同时把组装好的 HTML 存到此路径（排错用）")
    ap.add_argument("--list-sections", action="store_true", help="打印节次目录后退出")
    a = ap.parse_args()

    if a.list_sections:
        print("节次目录（顺序即本表顺序）：\n")
        for sid, name, skel in SECTION_ORDER:
            print(f"  {'★' if skel else ' '} {sid:<18} {name}")
        print("\n  ★＝骨架节，每份必有；其余为专题节，按第零步决策门选中才出。")
        return 0

    if not a.sections:
        ap.error("--sections 必填（或用 --list-sections）")
    sections_dir = Path(a.sections).resolve()
    if not sections_dir.is_dir():
        die(f"目录不存在：{sections_dir}")

    print(f"── 组装 ──\n  片段目录 {sections_dir}")
    sections = collect(sections_dir)
    lint(sections)
    if a.lint_only:
        print("\n（--lint-only，未渲染）")
        return 0

    if not a.out:
        ap.error("--out 必填")
    out_pdf = Path(a.out).resolve()

    html = assemble(sections, a.title)
    if a.keep_html:
        Path(a.keep_html).write_text(html, encoding="utf-8")
        print(f"  HTML 已存 {a.keep_html}")

    print(f"\n── 渲染 ──")
    used = render(html, out_pdf)
    print(f"  渲染器 {used}\n  输出 {out_pdf}")

    ok = verify(out_pdf, sections)
    print("\n" + ("✓ 通过 —— 可交付" if ok else "✘ 验收未通过 —— 见上方 ✘ 项"))
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
