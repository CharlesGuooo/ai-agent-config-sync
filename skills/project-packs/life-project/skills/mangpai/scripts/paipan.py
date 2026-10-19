#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
盲派排盘 —— 四柱 / 大运 / 流年 + 全部盲派标记。

用法：
  python paipan.py --date 1893-12-26 --time 08:00 --gender male
  python paipan.py --date 1984-06-15 --time 14:30 --gender male --liunian 2024-2030
  python paipan.py --sizhu "癸巳 甲子 丁酉 甲辰" --gender male --birth-year 1893
  python paipan.py --date ... --json

口径说明（与工作区 bazi-ziwei 一致）：
  * 不做真太阳时经度校正，直接用钟表时间；时区默认 +8，可用 --tz 调整。
  * 子时默认「晚子时」：23:00 之后日柱进次日；--zishi early 可切为早子时。
  * 年柱以立春为界，月柱以十二节为界（节气用 pyswisseph 的 Moshier 星历实算）。
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

from tables import (  # noqa: E402
    TIANGAN, DIZHI, GAN_WUXING, GAN_YINYANG, ZHI_WUXING, ZHI_MANGPAI_YINYANG,
    SHENG, KE, CANGGAN, CANGGAN_LABEL, SHISHEN_DANG, shishen, changsheng,
    LU, BAN_LU, YANG_REN, YANG_REN_VARIANT, YIN_REN, MUKU, SANHE_KU, MUKU_RULES,
    YIMA_MANGPAI, kongwang, xunshou, nayin, jiazi_index, KONG_WUXING_JUE,
    LIUHE, LIUHE_HUA, LIUCHONG, CHUAN, PO_MANGPAI, PO_DUANYU, PO_EXTRA,
    SANHE, SANHE_ZHONGSHEN, SANHUI, SANXING, XING_PAIR, ZIXING,
    JUEHE, ANHE, GANZHI_HUTONG, ZIHE, ZIHE_DETAIL,
    TIANGAN_WUHE, TIANGAN_CHONG, GUANFU, WANGSHEN, JIESHA, POSUI,
    SANHE_GROUPS, SIZHENG_GROUP, SIMA_GROUP, SIKU_GROUP,
    GONGWEI, ZHUBIN, XIANYUN_ORDER,
)

# 定义月柱的十二节（太阳黄经）
JIE = [
    (315.0, "立春", "寅"), (345.0, "惊蛰", "卯"), (15.0, "清明", "辰"),
    (45.0, "立夏", "巳"), (75.0, "芒种", "午"), (105.0, "小暑", "未"),
    (135.0, "立秋", "申"), (165.0, "白露", "酉"), (195.0, "寒露", "戌"),
    (225.0, "立冬", "亥"), (255.0, "大雪", "子"), (285.0, "小寒", "丑"),
]
MEAN_RATE = 0.9856473598947  # 太阳平均每日行度


# ============================================================ 天文 / 历法
def _sun_lon(jd_ut):
    import swisseph as swe
    res = swe.calc_ut(jd_ut, swe.SUN, swe.FLG_MOSEPH)
    xx = res[0] if isinstance(res, tuple) and not isinstance(res[0], float) else res
    return xx[0] % 360.0


def solar_term_jd(year, target_deg, tz):
    """求某年太阳黄经到达 target_deg 的世界时 JD（牛顿迭代）。"""
    import swisseph as swe
    jd0 = swe.julday(year, 1, 1, 0.0)
    guess = jd0 + ((target_deg - _sun_lon(jd0)) % 360.0) / MEAN_RATE
    for _ in range(8):
        diff = ((_sun_lon(guess) - target_deg + 180.0) % 360.0) - 180.0
        guess -= diff / MEAN_RATE
        if abs(diff) < 1e-7:
            break
    return guess


def jie_list(year, tz):
    """返回该公历年的十二节：[(节名, 月支, 本地JD), ...]，按时间排序。"""
    out = []
    for deg, name, zhi in JIE:
        jd = solar_term_jd(year, deg, tz) + tz / 24.0   # 转本地
        out.append((name, zhi, jd))
    out.sort(key=lambda x: x[2])
    return out


# 格里历改历：1582-10-15 之前的日期按儒略历解释（--calendar 可强制）
GREG_START = (1582, 10, 15)


def use_julian(y, m, d, calendar="auto"):
    if calendar == "julian":
        return True
    if calendar == "gregorian":
        return False
    return (y, m, d) < GREG_START


def to_jdn(y, m, d, calendar="auto"):
    """公历日期 → 儒略日数。1582-10-15 之前按儒略历。"""
    a = (14 - m) // 12
    yy = y + 4800 - a
    mm = m + 12 * a - 3
    if use_julian(y, m, d, calendar):
        return d + (153 * mm + 2) // 5 + 365 * yy + yy // 4 - 32083
    return d + (153 * mm + 2) // 5 + 365 * yy + yy // 4 - yy // 100 + yy // 400 - 32045


def local_jd(y, m, d, hour, minute, calendar="auto"):
    return to_jdn(y, m, d, calendar) - 0.5 + (hour + minute / 60.0) / 24.0


def jd_to_ymdh(jd_local):
    import swisseph as swe
    y, m, d, h = swe.revjul(jd_local, swe.GREG_CAL)
    return int(y), int(m), int(d), float(h)


# ============================================================ 四柱
SHICHEN_BOUNDS = [(23, "子"), (1, "丑"), (3, "寅"), (5, "卯"), (7, "辰"), (9, "巳"),
                  (11, "午"), (13, "未"), (15, "申"), (17, "酉"), (19, "戌"), (21, "亥")]


def hour_to_zhi(hour):
    if hour >= 23 or hour < 1:
        return "子"
    return DIZHI[((hour + 1) // 2) % 12]


def build_sizhu(y, m, d, hour, minute, tz=8.0, zishi="late", calendar="auto"):
    """由公历生辰求四柱。返回 dict。"""
    julian = use_julian(y, m, d, calendar)
    born_jd = local_jd(y, m, d, hour, minute, calendar)

    # ---- 年柱：以立春为界
    jies = jie_list(y, tz)
    lichun = [j for j in jies if j[0] == "立春"][0][2]
    year_for_pillar = y if born_jd >= lichun else y - 1
    yidx = (year_for_pillar - 4) % 60
    year_gan, year_zhi = TIANGAN[yidx % 10], DIZHI[yidx % 12]

    # ---- 月柱：找生时所在的节
    cands = jie_list(y - 1, tz) + jies + jie_list(y + 1, tz)
    cands.sort(key=lambda x: x[2])
    prev = [c for c in cands if c[2] <= born_jd]
    later = [c for c in cands if c[2] > born_jd]
    if not prev or not later:
        raise RuntimeError("节气窗口不足，无法定月柱（日期超出可算范围？）")
    jie_name, month_zhi, jie_jd = prev[-1]
    nxt = later[0]
    yin_gan_idx = (TIANGAN.index(year_gan) % 5) * 2 + 2
    off = (DIZHI.index(month_zhi) - DIZHI.index("寅")) % 12
    month_gan = TIANGAN[(yin_gan_idx + off) % 10]

    # ---- 日柱（含子时口径）
    dj = to_jdn(y, m, d, calendar)
    if hour >= 23 and zishi == "late":
        dj += 1
    day_y, day_m, day_d = _jdn_to_ymd(dj, julian)
    didx = (dj + 49) % 60
    day_gan, day_zhi = TIANGAN[didx % 10], DIZHI[didx % 12]

    # ---- 时柱
    hour_zhi = hour_to_zhi(hour)
    zi_gan_idx = (TIANGAN.index(day_gan) % 5) * 2
    hour_gan = TIANGAN[(zi_gan_idx + DIZHI.index(hour_zhi)) % 10]

    return {
        "born_jd": born_jd,
        "年": (year_gan, year_zhi), "月": (month_gan, month_zhi),
        "日": (day_gan, day_zhi), "时": (hour_gan, hour_zhi),
        "节": jie_name, "节JD": jie_jd, "下一节": nxt[0], "下一节JD": nxt[2],
        "上一节JD": jie_jd, "立春JD": lichun, "年柱所属年": year_for_pillar,
        "子时口径": "晚子时（23:00 后日柱进次日）" if zishi == "late" else "早子时（23:00 后日柱不进次日）",
        "日期用于日柱": (day_y, day_m, day_d),
    }


def _jdn_to_ymd(jdn, julian=False):
    if julian:
        c = jdn + 32082
        dd = (4 * c + 3) // 1461
        e = c - 1461 * dd // 4
        mm = (5 * e + 2) // 153
        return dd - 4800 + mm // 10, mm + 3 - 12 * (mm // 10), e - (153 * mm + 2) // 5 + 1
    a = jdn + 32044
    b = (4 * a + 3) // 146097
    c = a - 146097 * b // 4
    dd = (4 * c + 3) // 1461
    e = c - 1461 * dd // 4
    mm = (5 * e + 2) // 153
    day = e - (153 * mm + 2) // 5 + 1
    month = mm + 3 - 12 * (mm // 10)
    year = 100 * b + dd - 4800 + mm // 10
    return year, month, day


# ============================================================ 大运 / 流年
def build_dayun(sz, gender, tz, steps=9):
    """排大运。阳年男/阴年女顺排，阴年男/阳年女逆排。"""
    year_gan = sz["年"][0]
    yang_year = GAN_YINYANG[year_gan]
    forward = (yang_year and gender == "male") or ((not yang_year) and gender == "female")

    born = sz["born_jd"]
    if forward:
        days = sz["下一节JD"] - born
        ref = f'顺排：从生时到下一节「{sz["下一节"]}」共 {days:.3f} 天'
    else:
        days = born - sz["上一节JD"]
        ref = f'逆排：从上一节「{sz["节"]}」到生时共 {days:.3f} 天'

    # 三天折一年、一天折四个月：总月数向下取整，再拆成年+月（不进位到整年）
    years_f = days / 3.0
    total_months = int(years_f * 12)
    qiyun_year_off, rem_months = divmod(total_months, 12)

    midx = jiazi_index(*sz["月"])
    out = []
    for i in range(1, steps + 1):
        n = (midx + i) % 60 if forward else (midx - i) % 60
        g, z = TIANGAN[n % 10], DIZHI[n % 12]
        start_off = qiyun_year_off + (i - 1) * 10
        out.append({
            "序": i, "干": g, "支": z,
            "起实岁": start_off, "止实岁": start_off + 9,
            "起虚岁": start_off + 1, "止虚岁": start_off + 10,
        })
    return {
        "顺逆": "顺排" if forward else "逆排",
        "依据": f'年干{year_gan}为{"阳" if yang_year else "阴"}年，命主{"男" if gender=="male" else "女"} → {ref}',
        "起运": f"{qiyun_year_off} 岁 {rem_months} 个月",
        "起运实岁": qiyun_year_off, "起运余月": rem_months,
        "大运": out,
    }


def liunian_ganzhi(year):
    n = (year - 4) % 60
    return TIANGAN[n % 10], DIZHI[n % 12]


# ============================================================ 中国夏令时（1986–1991）
# 钟表拨快一小时。命主给的时间若是「当年钟表时间」，须减 1 小时才是标准时；
# 但很多人已经自己减过了，再减一次就会把时柱推到错的时辰上——所以脚本只提示，不自动改。
# 起止日期（含首尾，均为当日 02:00 切换，此处按整日粗判，边界日一并提示）。
CN_DST = {
    1986: ((5, 4), (9, 14)),
    1987: ((4, 12), (9, 13)),
    1988: ((4, 10), (9, 11)),
    1989: ((4, 16), (9, 17)),
    1990: ((4, 15), (9, 16)),
    1991: ((4, 14), (9, 15)),
}


def cn_dst_hit(y, m, d):
    """生日是否落在中国夏令时区间（含边界日）。"""
    if y not in CN_DST:
        return False
    (sm, sd), (em, ed) = CN_DST[y]
    return (sm, sd) <= (m, d) <= (em, ed)


# ============================================================ 作用关系扫描
# ---- 争合／妒合：合之前先数个数 ----------------------------------------
# [ch14]「而且还有两个杀和辰土发生关系，如果有一个还好，两个就是争合，合不走的东
#   西……但是这里有两个杀，是合不走的，只能说合动了他」
# [ch39]「如果是争合争穿，都是属于穿不成的，例如酉辰酉，辰酉合，也叫妒合，也就是
#   说两个酉一个辰也是合不住的」
# [ch17]「酉金是合不去的，争合、所以辰是合动了酉金，还需要到一个辰年。两个辰合两
#   个酉，这样才能把酉合走」——所以两侧个数对等（一对一、二对二）不算争合，按正常合读
# [ch48]「卯戌合，是争合，争合只能是合像」
# [ch2] 「三个午合了一个巳，就是丁火一定会制掉官星的，因为原局是火大」——方向不对
#   称：被抢的那一个合不走多的那一方；多的一方凭党势仍能制少的一方，合中之克照读
#
# 只对本资料有明文的四类**二元**关系判定：天干五合／六合／暗合／穿。
# 三合、半合、拱合、三会是「局」不是二元配对，脚本不判——见 04-zuoyong.md §一。
CONTEND = {
    "天干五合": ("争合", "合不走、合不去，只作合动／合像；「合中之克」照读［ch2］"),
    "六合": ("争合", "合不住、不成合闭库，只作合动／合像"),
    "暗合": ("争合", "合不住、合不闭库［ch16］，只作合之像"),
    "穿": ("争穿", "穿不成"),
}
_NUM = "〇一两三四五六七八九"   # 计量用「两个」不用「二个」


def _mark_contend(rel, items, kind, pairs):
    """计数仲裁：同一个字被两个以上同类之字来合（穿）＝争合／妒合，是合不走的。

    追加一条聚合记录，并给参与的原记录尾部打「※争合」标。**原记录一条不删**——
    争合仍然出象（[ch46]「丁壬合，两个壬争合了丁……合了财，无形之财」），
    删掉会连取象一起丢。
    """
    tag_kind, verdict = CONTEND[kind]
    pos = {}
    for p, c in items:
        pos.setdefault(c, []).append(f"{p}{c}")
    extra = []
    for x, y in pairs:
        ax, ay = pos.get(x, []), pos.get(y, [])
        if not ax or not ay or len(ax) == len(ay):
            continue                       # 数量对等 → 不是争合，按正常合读[ch17]
        many, few = (ax, ay) if len(ax) > len(ay) else (ay, ax)
        mc, fc = many[0][-1], few[0][-1]
        head = f"{_NUM[len(many)]}个{mc}{tag_kind}{_NUM[len(few)]}个{fc} —— "
        if tag_kind == "争穿":
            body = f"{verdict}［ch39「争合争穿，都是属于穿不成的」］"
        else:
            body = (f"争合（妒合）：{verdict}；要等再来"
                    f"{_NUM[len(many) - len(few)]}个{fc}凑成对等数量，"
                    f"才谈得上把{mc}合走［ch14／ch17／ch39］")
        extra.append((tag_kind, "＋".join(many) + " × " + "＋".join(few), head + body))
        both = {mc, fc}
        for i, (k, tag, note) in enumerate(rel):
            if k != kind:
                continue
            sides = tag.split(" × ")
            if len(sides) == 2 and {sides[0][-1], sides[1][-1]} == both:
                rel[i] = (k, tag, f"{note}　※{tag_kind}，见[{tag_kind}]条")
    rel.extend(extra)


def scan_zhi(items):
    """items = [(位置名, 支), ...]，扫描地支两两与三三关系。"""
    rel = []
    n = len(items)
    for i in range(n):
        for j in range(i + 1, n):
            (pa, za), (pb, zb) = items[i], items[j]
            tag = f"{pa}{za} × {pb}{zb}"
            k = (za, zb)
            kr = (zb, za)
            if za == zb:
                rel.append(("伏吟", tag, f"{za}{zb}伏吟（同支重现，一字重现数为双）"))
            if k in LIUHE or kr in LIUHE:
                key = k if k in LIUHE else kr
                rel.append(("六合", tag, f"{key[0]}{key[1]}合{LIUHE_HUA[key]}（六合最紧密，唯六冲能解）"))
            if k in LIUCHONG or kr in LIUCHONG:
                rel.append(("六冲", tag, "相冲（冲能解合，冲主动、主意外）"))
            if k in CHUAN or kr in CHUAN:
                rel.append(("穿", tag, _chuan_detail(za, zb)))
            if k in PO_MANGPAI or kr in PO_MANGPAI:
                key = k if k in PO_MANGPAI else kr
                rel.append(("破（盲派四破）", tag, PO_DUANYU[key]))
            if k in PO_EXTRA or kr in PO_EXTRA:
                key = k if k in PO_EXTRA else kr
                rel.append(("破（原文张力）", tag, PO_EXTRA[key]))
            if k in JUEHE or kr in JUEHE:
                key = k if k in JUEHE else kr
                rel.append(("绝合", tag, JUEHE[key] + "　※绝合大于暗合"))
            if k in ANHE or kr in ANHE:
                key = k if k in ANHE else kr
                rel.append(("暗合", tag, ANHE[key]))
            if k in XING_PAIR or kr in XING_PAIR:
                key = k if k in XING_PAIR else kr
                rel.append(("刑", tag, XING_PAIR[key]))
            # 半合／拱合／半会都要求两个**不同**的支同属一局；
            # 同支重现（za == zb）只成立伏吟，不成立合或会。
            # ——[金口诀·ch21]「申子辰，没有子，是拱合」「半合基本上是一种合之象」，
            #   讲的都是局中不同位的两个字；[ch35]「一字重现数为双」才是同支重现的读法。
            if za != zb:
                for grp, (wx, zs) in SANHE.items():
                    if za in grp and zb in grp:
                        gname = "".join(grp)
                        if zs in (za, zb):
                            rel.append(("半合", tag, f"{gname}{wx}局之半合（含中神{zs}）—— 合之象，力量次于六合"))
                        else:
                            rel.append(("拱合", tag, f"{gname}{wx}局之拱合（拱中神{zs}）—— 只是合之象，不长久，逢冲即散"))
                for grp, (wx, fang) in SANHUI.items():
                    if za in grp and zb in grp:
                        rel.append(("半会", tag, f"{''.join(grp)}{fang}方{wx}之半会"))
    # 三字
    zs = [z for _, z in items]
    for grp, (wx, zhong) in SANHE.items():
        if all(g in zs for g in grp):
            rel.append(("三合局", "＋".join(f"{p}{z}" for p, z in items if z in grp),
                        f"{''.join(grp)}三合{wx}局，中神{zhong}（中神亦即官符星，代表他要做的事情）"))
    for grp, (wx, fang) in SANHUI.items():
        if all(g in zs for g in grp):
            rel.append(("三会局", "＋".join(f"{p}{z}" for p, z in items if z in grp),
                        f"{''.join(grp)}三会{fang}方{wx}（三会大于六合）"))
    for grp, nm in SANXING:
        if all(g in zs for g in grp):
            rel.append(("三刑", "＋".join(f"{p}{z}" for p, z in items if z in grp), f"{''.join(grp)}三刑（{nm}）"))
    for z in ZIXING:
        hit = [f"{p}{zz}" for p, zz in items if zz == z]
        if len(hit) >= 2:
            rel.append(("自刑", "＋".join(hit), f"{z}{z}自刑（自刑必星刑伤；辰辰自刑主开库）"))
    for kind, pairs in (("六合", LIUHE), ("暗合", ANHE), ("穿", CHUAN)):
        _mark_contend(rel, items, kind, pairs)
    return rel


def _chuan_detail(a, b):
    ca, cb = CANGGAN[a], CANGGAN[b]
    return (f"{a}({''.join(ca)}) 穿 {b}({''.join(cb)})　"
            "—— 穿是藏干互战、相互对抗，制不尽；有穿反／穿倒／穿坏之别；穿不能开墓库")


def scan_gan(items):
    rel = []
    n = len(items)
    for i in range(n):
        for j in range(i + 1, n):
            (pa, ga), (pb, gb) = items[i], items[j]
            tag = f"{pa}{ga} × {pb}{gb}"
            k, kr = (ga, gb), (gb, ga)
            if ga == gb:
                rel.append(("天干伏吟", tag, f"{ga}{gb}伏吟"))
            if k in TIANGAN_WUHE or kr in TIANGAN_WUHE:
                key = k if k in TIANGAN_WUHE else kr
                if KE[GAN_WUXING[ga]] == GAN_WUXING[gb]:
                    inner = f"　合中之克：{ga}克{gb}"
                elif KE[GAN_WUXING[gb]] == GAN_WUXING[ga]:
                    inner = f"　合中之克：{gb}克{ga}"
                else:
                    inner = ""
                rel.append(("天干五合", tag,
                            f"{key[0]}{key[1]}合{TIANGAN_WUHE[key]}（合是合制，合中看克是玄机）{inner}"))
                continue
            if k in TIANGAN_CHONG or kr in TIANGAN_CHONG:
                rel.append(("天干相冲", tag, "相冲"))
            elif KE[GAN_WUXING[ga]] == GAN_WUXING[gb]:
                rel.append(("天干相克", tag, f"{ga}克{gb}"))
            elif KE[GAN_WUXING[gb]] == GAN_WUXING[ga]:
                rel.append(("天干相克", tag, f"{gb}克{ga}"))
            elif SHENG[GAN_WUXING[ga]] == GAN_WUXING[gb]:
                rel.append(("天干相生", tag, f"{ga}生{gb}"))
            elif SHENG[GAN_WUXING[gb]] == GAN_WUXING[ga]:
                rel.append(("天干相生", tag, f"{gb}生{ga}"))
    _mark_contend(rel, items, "天干五合", TIANGAN_WUHE)
    return rel


def crosslayer_contend(pillars, dgz, g, z):
    """跨层争合补算：把**当步大运**并进来重算一次争合／争穿，报告与「四柱＋流年」相比的差异。

    脚本本体的流年扫描只比对「四柱＋流年」（见 README 已知缺口 #10），
    于是两类情况测不出来，而它们恰恰是判流年最要紧的两点：
      · 增 —— 并入大运后**才**构成争合（如 时戌＋大运戌 两个戌争一个卯 → 卯戌合不住、库不闭）
      · 解 —— 并入大运后凑成**对等数量**，争合解除、此合真正成立
               （[ch17]「还需要到一个辰年。两个辰合两个酉，这样才能把酉合走」）
    「解」这一类是**一条记录的消失**，光看流年扫描永远看不到，必须靠本函数比对。
    """
    if not dgz:
        return []
    dg, dz = dgz[0], dgz[1]
    base_g = [(p, gg) for p, gg, _ in pillars] + [("流年", g)]
    base_z = [(p, zz) for p, _, zz in pillars] + [("流年", z)]
    full_g = [(p, gg) for p, gg, _ in pillars] + [("大运", dg), ("流年", g)]
    full_z = [(p, zz) for p, _, zz in pillars] + [("大运", dz), ("流年", z)]

    def marks(ig, iz):
        out = {}
        for k, tag, note in scan_gan(ig) + scan_zhi(iz):
            if k in ("争合", "争穿") and "流年" in tag:
                out[(k, tag)] = note
        return out

    base, full = marks(base_g, base_z), marks(full_g, full_z)
    rel = []
    for key, note in full.items():
        if key not in base:
            rel.append((f"跨层·增·{key[0]}", key[1],
                        f"并入当步大运 {dg}{dz} 后**才**构成{key[0]}　—— {note}"))
    for key, note in base.items():
        if key not in full:
            k = key[0]
            rel.append((f"跨层·解·{k}", key[1],
                        f"并入当步大运 {dg}{dz} 后**数量对等，{k}解除**"
                        + ("：此合真正成立，可作合去／合走读" if k == "争合" else "：此穿真正成立")
                        + "［ch17「两个辰合两个酉，这样才能把酉合走」］"
                        + "　※ 只看流年扫描会误判为「仍是争合」"))
    return rel


def scan_zhu(pillars):
    """整柱级：天地鸳鸯合 / 天克地冲 / 柱伏吟 / 自合。"""
    rel = []
    for i in range(len(pillars)):
        pa, ga, za = pillars[i]
        if ga + za in ZIHE:
            rel.append(("自合柱", f"{pa}柱 {ga}{za}",
                        f"{ga}{za}自合 —— {ZIHE_DETAIL[ga+za]}；自合合力仅次于天地鸳鸯合，「合的死死的」"))
        for j in range(i + 1, len(pillars)):
            pb, gb, zb = pillars[j]
            gh = (ga, gb) in TIANGAN_WUHE or (gb, ga) in TIANGAN_WUHE
            zh = (za, zb) in LIUHE or (zb, za) in LIUHE
            gc = (ga, gb) in TIANGAN_CHONG or (gb, ga) in TIANGAN_CHONG
            zc = (za, zb) in LIUCHONG or (zb, za) in LIUCHONG
            zchuan = (za, zb) in CHUAN or (zb, za) in CHUAN
            zpo = (za, zb) in PO_MANGPAI or (zb, za) in PO_MANGPAI
            if gh and zh:
                rel.append(("天地鸳鸯合", f"{pa}{ga}{za} × {pb}{gb}{zb}", "天合地合，合力仅次于自合"))
            if gc and zc:
                rel.append(("天克地冲", f"{pa}{ga}{za} × {pb}{gb}{zb}", "天克地冲"))
            if gh and zchuan:
                rel.append(("天合地穿", f"{pa}{ga}{za} × {pb}{gb}{zb}",
                            "天干相合地支穿 —— 「不损寿元便天残」"))
            if gh and zpo:
                rel.append(("天合地破", f"{pa}{ga}{za} × {pb}{gb}{zb}",
                            "天干相合地支破 —— 「凶猛祸事躲不过」"))
            if ga == gb and za == zb:
                rel.append(("柱伏吟", f"{pa}{ga}{za} × {pb}{gb}{zb}", "整柱伏吟"))
    return rel


# ============================================================ 盲派标记
def mark_shensha(sz, gender):
    rg, rz = sz["日"]
    yz = sz["年"][1]
    zhis = {"年": sz["年"][1], "月": sz["月"][1], "日": sz["日"][1], "时": sz["时"][1]}
    gans = {"年": sz["年"][0], "月": sz["月"][0], "日": sz["日"][0], "时": sz["时"][0]}
    out = {}

    # --- 禄
    lu = LU[rg]
    out["禄神"] = {
        "位": lu,
        "落柱": [p for p, z in zhis.items() if z == lu],
        "天干见禄": [p for p, g in gans.items() if p != "日" and g == rg],
        "半禄（冠带）": BAN_LU[rg],
        "半禄落柱": [p for p, z in zhis.items() if z == BAN_LU[rg]],
        "释": "［引文·references/01-leixiang.md §四 神煞类象 / 取象·第四章］"
              "禄是日主的延伸，代表日主到地支行使权力；亲为、独立、主张、自我意识、尊贵、独占、主宰、享受。"
              "物象为权力、封地、财富、供养；于人体表身体、肢体、女人的肉体、寿命。"
              "禄不配印为辛苦，禄配印为享受。"
              "（禄的价值判定在本资料中有四说，分见 01 §四、07 ch41、08 ch43、09 ch46——取象前先读全四说）",
    }
    # --- 刃
    if rg in YANG_REN:
        ren, rtype = YANG_REN[rg], "阳刃"
    else:
        ren, rtype = YIN_REN[rg], "阴刃"
    ren_note = ""
    if rg in YANG_REN_VARIANT:
        ren_note = f"　※[取象] 另作「戊刃在{'/'.join(YANG_REN_VARIANT[rg])}」，[金口诀] 全书作午，本表主用午"
    out["羊刃"] = {
        "类型": rtype, "位": ren + ren_note,
        "落柱": [p for p, z in zhis.items() if z == ren],
        "释": "［引文·references/01-leixiang.md §四 神煞类象 / 取象·第四章］"
              "羊刃比劫财更凶悍：胆大、勇敢、凶恶、狠毒、不计后果、不顾面子、占有欲、侵害、不利父妻；"
              "物象为刀、枪、剑、手术、兵器、武装、政法、执法。羊刃喜制服，制之得用正（军警、外科、运动员）；"
              "无制服则用偏（匪徒、赌徒、斗殴）。女命最怕进阴刃。"
              "（占刃者另见 references/00-gangling.md §八 反局「占禄占刃怕见印」）",
    }
    # --- 驿马（盲派）
    yima = {}
    for base_name, base in (("年支", yz), ("日支", rz)):
        for grp, targets in YIMA_MANGPAI.items():
            if base in grp:
                hit = [(p, z) for p, z in zhis.items() if z in targets]
                yima[base_name] = {"所属组": grp, "马位": targets,
                                   "落柱": [f"{p}{z}" for p, z in hit]}
    out["驿马"] = {"查法": "以年柱和日柱为主（盲派取整组三合对冲，非只取一字）", "结果": yima,
                   "释": "［引文·references/01-leixiang.md §四 神煞类象 / 取象·第四章］"
                         "驿马表走动、外出、远行、游走、迁移、奔忙；物象为车、船、马。逢合则停留不动。"}
    # --- 空亡
    kw = {}
    for base_name, gz in (("年柱", sz["年"]), ("日柱", sz["日"])):
        k = kongwang(*gz)
        kw[base_name] = {"旬": xunshou(*gz) + "旬", "空亡二支": list(k),
                         "落柱": [f"{p}{z}" for p, z in zhis.items() if z in k]}
    both = set(kw["年柱"]["空亡二支"]) & set(kw["日柱"]["空亡二支"])
    out["空亡"] = {"查法": "以日主或年柱为主，观他支中见者为空亡", "结果": kw,
                   "年日互换空亡": ("是" if kw["年柱"]["空亡二支"] == kw["日柱"]["空亡二支"] else "否"),
                   "释": "［引文·references/01-leixiang.md §四 神煞类象 / 取象·第四章］"
                         "支逢空亡象征有其气而无其形，有其名而无其实。年支空亡祖业空；月支空亡兄弟无靠或有伤损；"
                         "日支空亡做事虎头蛇尾，少成多败，无归宿感，或夫妻之缘薄；时支空亡子女迟育或子女有损伤。"
                         "凶星空亡凶减半，吉神空亡福不全。命中所用之神旺相而空亡，主性格气度宽大，个性超凡脱俗，"
                         "能成就于务虚之事业，如佛道、玄学、五术、气功、艺术等领域。"
                         "空亡类象：务虚、玄学、空物、减半、损失、不全、挂名、名义、有名无实、形式、气、象、影子等。"
                         "天干也可以讲空亡，原局没有空亡，大运来了，也算空亡，但做功没有印象，一种象而已。流年不讲空亡。",
                   "五行空诀": KONG_WUXING_JUE, "_both": sorted(both)}
    # --- 墓库
    muku = []
    for p, z in zhis.items():
        if z in MUKU:
            cg = CANGGAN[z]
            labels = sorted({shishen(rg, g) for g in cg})
            muku.append({
                "柱": p, "支": z, "三合归属": SANHE_KU[z],
                "藏干": [f"{g}({shishen(rg, g)})" for g in cg],
                "十神库标签": "／".join(f"{s}库" for s in labels),
            })
    out["墓库"] = {"落库": muku, "规则": MUKU_RULES}

    # --- 附加神煞（按年支查）
    gf = GUANFU[yz]
    zhongshen = [SANHE_ZHONGSHEN[k] for k in SANHE_GROUPS if yz in SANHE_GROUPS[k]]
    out["官符星"] = {
        "年支前五辰": gf, "落柱": [f"{p}{z}" for p, z in zhis.items() if z == gf],
        "三合中神亦作官符": zhongshen,
        "中神落柱": [f"{p}{z}" for p, z in zhis.items() if z in zhongshen],
        "释": "［引文·references/08-laozai.md ch43］"
              "官符星多主事业主止；轻者口舌，重者官非、牢狱。「劫财伤官临官符，吃上牢饭不自由」"
              "（断语需劫财与伤官同时在场，缺一则条件未满足）",
    }
    for nm, table, note in (("亡神", WANGSHEN, "［引文·references/07-tiancan.md / 08-laozai.md］"
                                               "亡神就是财来财去一场空；亡神合禄犯阴婚；亡神合体、合财、合印皆凶"),
                            ("劫煞", JIESHA, "［引文·references/07-tiancan.md ch40］劫煞主凶灾"),):
        val = None
        for k, gs in SANHE_GROUPS.items():
            if yz in gs:
                val = table[k]
        out[nm] = {"位": val, "落柱": [f"{p}{z}" for p, z in zhis.items() if z == val], "释": note}
    ps = None
    for k, v in POSUI.items():
        if yz in k:
            ps = v
    out["破碎煞"] = {"位": ps, "落柱": [f"{p}{z}" for p, z in zhis.items() if z == ps],
                     "释": "［引文·references/07-tiancan.md ch40］破碎煞主财灾；劫煞与破碎煞相并，有横来死丧"}
    return out


def mark_ganzhi_hubiao(sz):
    rg = sz["日"][0]
    pillars = [(p, sz[p][0], sz[p][1]) for p in ("年", "月", "日", "时")]
    zhis = [z for _, _, z in pillars]
    out = {"实虚": [], "干支互通": [], "自合柱": []}
    for p, g, z in pillars:
        roots, seals = [], []
        for pp, _, zz in pillars:
            for cg in CANGGAN[zz]:
                if GAN_WUXING[cg] == GAN_WUXING[g]:
                    roots.append(f"{pp}{zz}藏{cg}")
                if SHENG[GAN_WUXING[cg]] == GAN_WUXING[g]:
                    seals.append(f"{pp}{zz}藏{cg}")
        verdict = "实干" if (roots or seals) else "虚干（无根无气）"
        out["实虚"].append({"柱": p, "干": g, "判定": verdict,
                            "根": roots or ["无"], "印（生）": seals or ["无"]})
        if GANZHI_HUTONG.get(g) == z:
            out["干支互通"].append(f"{p}柱 {g}{z} —— 干支一体，{g}代表{z}，{z}代表{g}")
        if g + z in ZIHE:
            out["自合柱"].append(f"{p}柱 {g}{z} —— {ZIHE_DETAIL[g+z]}")
    # 天干通禄到地支（借象原则）
    tonglu = []
    for p, g, _ in pillars:
        lz = LU[g]
        hit = [f"{pp}{zz}" for pp, _, zz in pillars if zz == lz]
        if hit:
            tonglu.append(f"{p}干{g} 通禄于 {'／'.join(hit)}（{g}与{lz}是一家，可互借其象）")
    out["通禄互借"] = tonglu or ["无"]
    out["提示"] = ["［引文·references/03-geju.md §五 干支虚实与互表 / 金口诀·ch12］",
                   "实干坏根即应凶；支神升天（藏干透到大运流年）；虚干怕五合、怕通禄，都是凶运。",
                   "「虚干通禄入地府，支神虚透生天堂」「有根怕去根，无根怕见根（特别是禄）」",
                   "换根：如原局壬子、大运壬申，这叫换根，会发生事业、工作上的变化。"
                   "（换根只定「变」，不定吉凶——方向另看大运天干带来的是体还是用）",
                   "原文另注：「虚实不是旺衰，而是一个概念」——虚实判定不落判据第 5 层。"]
    return out


def mark_liantiao(sz):
    """五行连片（连体/连根候选）。相邻两字五行相同或相生即连。"""
    seq = []
    for p in ("年", "月", "日", "时"):
        seq.append((f"{p}干", sz[p][0], GAN_WUXING[sz[p][0]]))
        seq.append((f"{p}支", sz[p][1], ZHI_WUXING[sz[p][1]]))
    runs, cur = [], [seq[0]]
    for prev, item in zip(seq, seq[1:]):
        a, b = prev[2], item[2]
        if a == b or SHENG[a] == b or SHENG[b] == a:
            cur.append(item)
        else:
            runs.append(cur)
            cur = [item]
    runs.append(cur)
    res = []
    for r in runs:
        if len(r) >= 3:
            has_ri = any(x[0] == "日干" for x in r)
            res.append({
                "字串": "".join(x[1] for x in r),
                "位置": "→".join(x[0] for x in r),
                "五行": "→".join(x[2] for x in r),
                "含日主": has_ri,
            })
    return {"连片": res or [], "说明":
            "［机械计算］以上为脚本按「相邻两字五行相同或相生」检出的候选，不是结论。"
            "［引文·references/07-tiancan.md ch40］「八字连体和连根是有区别的："
            "连体就代表伤的是自己；连根我们就要找他的原神。」"
            "原文用例：申庚辛庚＝连体金；丙丁丙午＝连体火；亥甲乙乙＝水木连体；辛酉丑戌＝土金一党。"
            "最终是连体还是连根，须由取象判定。"}


def xianyun(sz, current_age=None):
    rows = []
    for i, (p, kind) in enumerate(XIANYUN_ORDER):
        ch = sz[p][0] if kind == "干" else sz[p][1]
        lo, hi = i * 8 + 1, (i + 1) * 8
        row = {"序": i + 1, "字": f"{p}{kind}{ch}", "岁段": f"{lo}-{hi}"}
        if current_age is not None and lo <= current_age <= hi:
            row["当前"] = True
        rows.append(row)
    return {"一字八年": rows,
            "按柱": "年柱 1-16 岁　月柱 16-32 岁　日柱 32-48 岁　时柱 48 岁以后",
            "说明": "［引文·references/10-yingqi.md ch49］"
                    "限运是不看大运时对原局作用关系的时间区隔，是模糊、大概率的方式。"
                    "「当限运这个字到的时候，所有字都在坏这一个字的时候，就应凶了」"
                    "［机械计算·口径］本表以虚岁定位「当前」；「按柱」区间在 16/32/48 处两柱各占一次，"
                    "与一字八年表（9-16／17-24…）边界不完全对齐，跨界年份两说并取。"
                    "另注：[取象·第五章] 另有一套宫位年龄刻度（年 1-18／月 18-35／日 35-55／时 55+），"
                    "与本表并存，用途不同——本表定限运，取象那套定宫位时间象。"}


# ============================================================ 组装与渲染
def analyze(sz, gender, tz, current_year=None, liunian_range=None, dayun_steps=9):
    rg = sz["日"][0]
    pillars = [(p, sz[p][0], sz[p][1]) for p in ("年", "月", "日", "时")]

    zhu = []
    for p, g, z in pillars:
        cg = CANGGAN[z]
        labels = CANGGAN_LABEL[len(cg)]
        zhu.append({
            "柱": p, "主宾": ZHUBIN[p], "干": g, "支": z,
            "干十神": "日主" if p == "日" else shishen(rg, g),
            "藏干": [f"{c}({lb}){shishen(rg, c)}" for c, lb in zip(cg, labels)],
            "长生": changsheng(rg, z),
            "自坐": changsheng(g, z),
            "纳音": nayin(g, z),
            "支阴阳(盲派)": ZHI_MANGPAI_YINYANG[z],
        })

    dy = build_dayun(sz, gender, tz, steps=dayun_steps)
    cur_age = None
    if current_year and sz.get("_born_year"):
        cur_age = current_year - sz["_born_year"] + 1   # 虚岁

    res = {
        "四柱": zhu,
        "日主": {"干": rg, "五行": GAN_WUXING[rg], "阴阳": "阳" if GAN_YINYANG[rg] else "阴"},
        "宫位": GONGWEI,
        "限运": xianyun(sz, cur_age),
        "神煞": mark_shensha(sz, gender),
        "干支虚实互表": mark_ganzhi_hubiao(sz),
        "五行连片": mark_liantiao(sz),
        "天干作用": scan_gan([(p, g) for p, g, _ in pillars]),
        "地支作用": scan_zhi([(p, z) for p, _, z in pillars]),
        "整柱作用": scan_zhu(pillars),
        "大运": dy,
    }

    # 大运逐步扫描
    steps = []
    for d in dy["大运"]:
        g, z = d["干"], d["支"]
        items_z = [(p, zz) for p, _, zz in pillars] + [("大运", z)]
        items_g = [(p, gg) for p, gg, _ in pillars] + [("大运", g)]
        new_z = [r for r in scan_zhi(items_z) if "大运" in r[1]]
        new_g = [r for r in scan_gan(items_g) if "大运" in r[1]]
        new_zhu = [r for r in scan_zhu(pillars + [("大运", g, z)]) if "大运" in r[1]]
        steps.append({
            "序": d["序"], "干支": f"{g}{z}",
            "干十神": shishen(rg, g), "支本气十神": shishen(rg, CANGGAN[z][0]),
            "实岁": f'{d["起实岁"]}-{d["止实岁"]}', "虚岁": f'{d["起虚岁"]}-{d["止虚岁"]}',
            "与原局天干": new_g, "与原局地支": new_z, "整柱": new_zhu,
        })
    res["大运逐步"] = steps

    if liunian_range:
        # 流年 → 当步大运 的映射：第 i 步自「生年＋起运实岁＋10×(i-1)」那一年起（该年为交运年，跨两步）
        by = sz.get("_born_year")
        qi = dy.get("起运实岁")
        def dayun_of(yr):
            if by is None or qi is None:
                return None, False
            hit = None
            for d0 in dy["大运"]:
                sw = by + qi + (d0["序"] - 1) * 10
                if yr >= sw:
                    hit = (f'{d0["干"]}{d0["支"]}', yr == sw)
            return (hit if hit else (None, False))

        ln = []
        for yr in range(liunian_range[0], liunian_range[1] + 1):
            g, z = liunian_ganzhi(yr)
            dgz, is_switch = dayun_of(yr)
            items_z = [(p, zz) for p, _, zz in pillars] + [("流年", z)]
            items_g = [(p, gg) for p, gg, _ in pillars] + [("流年", g)]
            ln.append({
                "年": yr, "干支": f"{g}{z}", "干十神": shishen(rg, g),
                "支本气十神": shishen(rg, CANGGAN[z][0]),
                "当步大运": (f"{dgz}（本年交运，跨两步，两步都要看）" if is_switch else dgz) if dgz else "（未起运／无生年）",
                "与原局天干": [r for r in scan_gan(items_g) if "流年" in r[1]],
                "与原局地支": [r for r in scan_zhi(items_z) if "流年" in r[1]],
                "跨层争合": crosslayer_contend(pillars, dgz, g, z),
                "整柱": [r for r in scan_zhu(pillars + [("流年", g, z)]) if "流年" in r[1]],
            })
        res["流年"] = ln
    return res


# ------------------------------------------------------------ 文本渲染
def render(res, sz, meta):
    L = []
    A = L.append
    A("=" * 74)
    A("　　　　　　　　盲　派　四　柱　排　盘")
    A("=" * 74)
    for k, v in meta.items():
        A(f"{k}：{v}")
    A("")

    A("─" * 74)
    A("【一】四柱")
    A("─" * 74)
    hdr = ["", "年柱(宾)", "月柱(宾)", "日柱(主)", "时柱(主)"]
    z = res["四柱"]
    A("{:<10}{:<14}{:<14}{:<14}{:<14}".format(*hdr))
    A("{:<10}{:<14}{:<14}{:<14}{:<14}".format("天干", *[x["干"] for x in z]))
    A("{:<10}{:<14}{:<14}{:<14}{:<14}".format("十神", *[x["干十神"] for x in z]))
    A("{:<10}{:<14}{:<14}{:<14}{:<14}".format("地支", *[x["支"] for x in z]))
    A("{:<10}{:<14}{:<14}{:<14}{:<14}".format("长生", *[x["长生"] for x in z]))
    A("{:<10}{:<14}{:<14}{:<14}{:<14}".format("自坐", *[x["自坐"] for x in z]))
    A("{:<10}{:<14}{:<14}{:<14}{:<14}".format("纳音", *[x["纳音"] for x in z]))
    A("")
    for x in z:
        A(f"  {x['柱']}支 {x['支']}　藏干：{'　'.join(x['藏干'])}　［支阴阳(盲派)：{x['支阴阳(盲派)']}］")
    d = res["日主"]
    A(f"\n  日主：{d['干']}（{d['阴阳']}{d['五行']}）")
    A("")

    A("─" * 74)
    A("【二】限运（一字管八年）")
    A("─" * 74)
    xy = res["限运"]
    A("  " + xy["按柱"])
    for r in xy["一字八年"]:
        mark = "  ← 当前" if r.get("当前") else ""
        A(f"  第{r['序']}字 {r['字']}　{r['岁段']} 岁{mark}")
    A("  " + xy["说明"])
    A("")

    A("─" * 74)
    A("【三】盲派五神煞（禄神・羊刃・墓库・驿马・空亡）")
    A("─" * 74)
    ss = res["神煞"]
    lu = ss["禄神"]
    A(f"  ▸ 禄神：{lu['位']}　落柱：{'／'.join(lu['落柱']) or '不见'}　"
      f"半禄(冠带)：{lu['半禄（冠带）']}　落柱：{'／'.join(lu['半禄落柱']) or '不见'}")
    if lu["天干见禄"]:
        A(f"    天干见同类（羊刃/禄也可以看天干）：{'／'.join(lu['天干见禄'])}")
    A(f"    {lu['释']}")
    rn = ss["羊刃"]
    A(f"  ▸ 羊刃（{rn['类型']}）：{rn['位']}　落柱：{'／'.join(rn['落柱']) or '不见'}")
    A(f"    {rn['释']}")
    ym = ss["驿马"]
    A(f"  ▸ 驿马（{ym['查法']}）：")
    for base, info in ym["结果"].items():
        A(f"    {base}属「{info['所属组']}」→ 马在 {'、'.join(info['马位'])}　"
          f"落柱：{'／'.join(info['落柱']) or '不见'}")
    A(f"    {ym['释']}")
    kw = ss["空亡"]
    A(f"  ▸ 空亡（{kw['查法']}）：")
    for base, info in kw["结果"].items():
        A(f"    {base}属{info['旬']} → 空 {'、'.join(info['空亡二支'])}　"
          f"落柱：{'／'.join(info['落柱']) or '不见'}")
    A(f"    年日互换空亡：{kw['年日互换空亡']}")
    A(f"    {kw['释']}")
    A("  ▸ 墓库：")
    if ss["墓库"]["落库"]:
        for m in ss["墓库"]["落库"]:
            A(f"    {m['柱']}支{m['支']}　三合归属：{m['三合归属']}　藏干：{'、'.join(m['藏干'])}")
            A(f"      → 十神库标签：{m['十神库标签']}")
    else:
        A("    原局不见辰戌丑未")
    for r in ss["墓库"]["规则"]:
        A(f"    · {r}")
    A("")

    A("─" * 74)
    A("【四】附加神煞（官符・亡神・劫煞・破碎，按年支查）")
    A("─" * 74)
    gf = ss["官符星"]
    A(f"  ▸ 官符星：{gf['年支前五辰']}　落柱：{'／'.join(gf['落柱']) or '不见'}")
    A(f"    三合中神亦作官符：{'、'.join(gf['三合中神亦作官符'])}　落柱：{'／'.join(gf['中神落柱']) or '不见'}")
    A(f"    {gf['释']}")
    for nm in ("亡神", "劫煞", "破碎煞"):
        v = ss[nm]
        A(f"  ▸ {nm}：{v['位']}　落柱：{'／'.join(v['落柱']) or '不见'}　—— {v['释']}")
    A("")

    A("─" * 74)
    A("【五】干支虚实与互表")
    A("─" * 74)
    hb = res["干支虚实互表"]
    for r in hb["实虚"]:
        A(f"  {r['柱']}干 {r['干']} → {r['判定']}")
        A(f"    根：{'、'.join(r['根'])}")
        A(f"    印：{'、'.join(r['印（生）'])}")
    if hb["干支互通"]:
        A("  ▸ 干支互通（一体，可互相代表）：")
        for x in hb["干支互通"]:
            A(f"    {x}")
    if hb["自合柱"]:
        A("  ▸ 自合柱：")
        for x in hb["自合柱"]:
            A(f"    {x}")
    A("  ▸ 通禄互借（借象原则）：")
    for x in hb["通禄互借"]:
        A(f"    {x}")
    for x in hb["提示"]:
        A(f"    · {x}")
    A("")

    A("─" * 74)
    A("【六】五行连片（连体／连根候选）")
    A("─" * 74)
    lt = res["五行连片"]
    if lt["连片"]:
        for r in lt["连片"]:
            A(f"  {r['字串']}　（{r['位置']}）　五行：{r['五行']}"
              + ("　★含日主 → 连体候选" if r["含日主"] else ""))
    else:
        A("  未检出长度≥3 的连片")
    A(f"  {lt['说明']}")
    A("")

    A("─" * 74)
    A("【七】原局作用关系")
    A("─" * 74)
    A("  ▸ 天干：")
    _dump_rel(A, res["天干作用"])
    A("  ▸ 地支：")
    _dump_rel(A, res["地支作用"])
    A("  ▸ 整柱：")
    _dump_rel(A, res["整柱作用"])
    A("")

    A("─" * 74)
    A("【八】大运")
    A("─" * 74)
    dy = res["大运"]
    A(f"  {dy['顺逆']}　{dy['依据']}")
    A(f"  起运：{dy['起运']}")
    for s in res["大运逐步"]:
        A("")
        A(f"  ── 第{s['序']}步 {s['干支']}（{s['干十神']}／{s['支本气十神']}）"
          f"　实岁 {s['实岁']}　虚岁 {s['虚岁']}")
        if not (s["与原局天干"] or s["与原局地支"] or s["整柱"]):
            A("      与原局无显著作用关系")
        _dump_rel(A, s["与原局天干"], indent=6)
        _dump_rel(A, s["与原局地支"], indent=6)
        _dump_rel(A, s["整柱"], indent=6)

    if "流年" in res:
        A("")
        A("─" * 74)
        A("【九】流年")
        A("─" * 74)
        for y in res["流年"]:
            A("")
            dgz = y.get("当步大运")
            A(f"  ── {y['年']} 年 {y['干支']}（{y['干十神']}／{y['支本气十神']}）"
              + (f"　当步大运 {dgz}" if dgz else ""))
            if not (y["与原局天干"] or y["与原局地支"] or y["整柱"]):
                A("      与原局无显著作用关系")
            _dump_rel(A, y["与原局天干"], indent=6)
            _dump_rel(A, y["与原局地支"], indent=6)
            _dump_rel(A, y["整柱"], indent=6)
            if y.get("跨层争合"):
                A("      ── 跨层补算（把当步大运并进来重数；上面几行只含四柱＋流年，测不出这些）")
                _dump_rel(A, y["跨层争合"], indent=6)

    A("")
    A("=" * 74)
    A("排盘完毕。以上为机械计算结果，取象、做功、断语由 references/ 参考库判定。")
    A("=" * 74)
    return "\n".join(L)


def _dump_rel(A, rels, indent=4):
    pad = " " * indent
    if not rels:
        A(pad + "（无）")
        return
    for kind, tag, note in rels:
        A(f"{pad}[{kind}] {tag}　{note}")


# ============================================================ CLI
def main():
    ap = argparse.ArgumentParser(description="盲派四柱排盘 + 盲派标记")
    ap.add_argument("--date", help="公历生日 YYYY-MM-DD")
    ap.add_argument("--time", default="12:00", help="出生时间 HH:MM（24 小时制），默认 12:00")
    ap.add_argument("--sizhu", help='直接给四柱，如 "癸巳 甲子 丁酉 甲辰"（此时不算节气）')
    ap.add_argument("--birth-year", type=int, help="配合 --sizhu 使用，用于限运/流年")
    ap.add_argument("--gender", required=True, choices=["male", "female", "男", "女"])
    ap.add_argument("--tz", type=float, default=8.0, help="时区，默认 +8")
    ap.add_argument("--zishi", choices=["late", "early"], default="late",
                    help="子时口径：late=晚子时(默认，23:00后日柱进次日)，early=早子时")
    ap.add_argument("--calendar", choices=["auto", "gregorian", "julian"], default="auto",
                    help="输入日期的历法：auto(默认，1582-10-15 前按儒略历)／gregorian／julian")
    ap.add_argument("--liunian", help="流年区间 YYYY-YYYY")
    ap.add_argument("--dayun-steps", type=int, default=9, help="排几步大运，默认 9")
    ap.add_argument("--current-year", type=int, help="当前年份（用于标注限运位置）")
    ap.add_argument("--json", action="store_true", help="输出 JSON")
    a = ap.parse_args()

    gender = "male" if a.gender in ("male", "男") else "female"

    if a.sizhu:
        parts = a.sizhu.split()
        if len(parts) != 4:
            ap.error('--sizhu 需要四个干支，例如 "癸巳 甲子 丁酉 甲辰"')
        sz = {}
        for p, gz in zip(("年", "月", "日", "时"), parts):
            if len(gz) != 2 or gz[0] not in TIANGAN or gz[1] not in DIZHI:
                ap.error(f"非法干支：{gz}")
            sz[p] = (gz[0], gz[1])
        sz["子时口径"] = "（由 --sizhu 直接给定，未做节气与子时判定）"
        meta = {"输入方式": "直接给定四柱", "四柱": a.sizhu,
                "性别": "男" if gender == "male" else "女",
                "出生年": a.birth_year or "未提供（大运起运岁无法计算）"}
        dayun_steps = a.dayun_steps
        if a.birth_year:
            sz["_born_year"] = a.birth_year
        # 无生辰无法算起运，只给干支序列
        res = _analyze_sizhu_only(sz, gender, dayun_steps, a)
        out = render(res, sz, meta)
    else:
        if not a.date:
            ap.error("需要 --date 或 --sizhu")
        y, m, d = [int(x) for x in a.date.split("-")]
        hh, mm = [int(x) for x in a.time.split(":")]
        sz = build_sizhu(y, m, d, hh, mm, tz=a.tz, zishi=a.zishi, calendar=a.calendar)
        sz["_born_year"] = y
        ln = None
        if a.liunian:
            lo, hi = [int(x) for x in a.liunian.split("-")]
            ln = (lo, hi)
        res = analyze(sz, gender, a.tz, current_year=a.current_year,
                      liunian_range=ln, dayun_steps=a.dayun_steps)
        dy, dm, dd = sz["日期用于日柱"]
        cal = "儒略历" if use_julian(y, m, d, a.calendar) else "格里历（公历）"
        meta = {
            "生辰": f"{y}-{m:02d}-{d:02d} {hh:02d}:{mm:02d}（按{cal}解释）",
            **({"⚠ 夏令时": (
                f"该生日落在中国夏令时区间（{y} 年 "
                f"{CN_DST[y][0][0]}/{CN_DST[y][0][1]}–{CN_DST[y][1][0]}/{CN_DST[y][1][1]}，钟表拨快 1 小时）。"
                f"本脚本按输入值 {hh:02d}:{mm:02d} 直接排，未做任何加减。"
                "　→ 必须向命主确认：这是当年钟表上的时间，还是已经自己减过一小时的？"
                "　※ 已修正过的再减一次会重复扣减，把时柱推到错的时辰上。"
            )} if cn_dst_hit(y, m, d) else {}),
            "性别": "男" if gender == "male" else "女",
            "时区": f"UTC{a.tz:+g}（不做真太阳时经度校正）",
            "子时口径": sz["子时口径"],
            "日柱所用日期": f"{dy}-{dm:02d}-{dd:02d}",
            "年柱所属年（立春为界）": sz["年柱所属年"],
            "生时所在节": f'{sz["节"]}（{"%.4f" % sz["节JD"]}）→ 下一节 {sz["下一节"]}',
        }
        out = render(res, sz, meta)

    if a.json:
        payload = {"meta": meta, "四柱原文": {k: list(v) for k, v in sz.items()
                                             if k in ("年", "月", "日", "时")}, "结果": res}
        print(json.dumps(payload, ensure_ascii=False, indent=2, default=str))
    else:
        print(out)


def _analyze_sizhu_only(sz, gender, steps, a):
    """只有四柱、没有生辰时的分析（大运只给干支序列，无起运岁）。"""
    rg = sz["日"][0]
    pillars = [(p, sz[p][0], sz[p][1]) for p in ("年", "月", "日", "时")]
    yang_year = GAN_YINYANG[sz["年"][0]]
    forward = (yang_year and gender == "male") or ((not yang_year) and gender == "female")
    midx = jiazi_index(*sz["月"])
    dl = []
    for i in range(1, steps + 1):
        n = (midx + i) % 60 if forward else (midx - i) % 60
        dl.append({"序": i, "干": TIANGAN[n % 10], "支": DIZHI[n % 12],
                   "起实岁": "?", "止实岁": "?", "起虚岁": "?", "止虚岁": "?"})
    zhu = []
    for p, g, z in pillars:
        cg = CANGGAN[z]
        labels = CANGGAN_LABEL[len(cg)]
        zhu.append({"柱": p, "主宾": ZHUBIN[p], "干": g, "支": z,
                    "干十神": "日主" if p == "日" else shishen(rg, g),
                    "藏干": [f"{c}({lb}){shishen(rg, c)}" for c, lb in zip(cg, labels)],
                    "长生": changsheng(rg, z), "自坐": changsheng(g, z),
                    "纳音": nayin(g, z), "支阴阳(盲派)": ZHI_MANGPAI_YINYANG[z]})
    res = {
        "四柱": zhu,
        "日主": {"干": rg, "五行": GAN_WUXING[rg], "阴阳": "阳" if GAN_YINYANG[rg] else "阴"},
        "限运": xianyun(sz, None),
        "神煞": mark_shensha(sz, gender),
        "干支虚实互表": mark_ganzhi_hubiao(sz),
        "五行连片": mark_liantiao(sz),
        "天干作用": scan_gan([(p, g) for p, g, _ in pillars]),
        "地支作用": scan_zhi([(p, z) for p, _, z in pillars]),
        "整柱作用": scan_zhu(pillars),
        "大运": {"顺逆": "顺排" if forward else "逆排",
                 "依据": f'年干{sz["年"][0]}为{"阳" if yang_year else "阴"}年，'
                         f'命主{"男" if gender=="male" else "女"}',
                 "起运": "未知（未提供生辰，无法计算起运天数）", "大运": dl},
    }
    steps_out = []
    for d in dl:
        g, z = d["干"], d["支"]
        steps_out.append({
            "序": d["序"], "干支": f"{g}{z}",
            "干十神": shishen(rg, g), "支本气十神": shishen(rg, CANGGAN[z][0]),
            "实岁": "?", "虚岁": "?",
            "与原局天干": [r for r in scan_gan([(p, gg) for p, gg, _ in pillars] + [("大运", g)]) if "大运" in r[1]],
            "与原局地支": [r for r in scan_zhi([(p, zz) for p, _, zz in pillars] + [("大运", z)]) if "大运" in r[1]],
            "整柱": [r for r in scan_zhu(pillars + [("大运", g, z)]) if "大运" in r[1]],
        })
    res["大运逐步"] = steps_out
    if a.liunian:
        lo, hi = [int(x) for x in a.liunian.split("-")]
        ln = []
        for yr in range(lo, hi + 1):
            g, z = liunian_ganzhi(yr)
            ln.append({"年": yr, "干支": f"{g}{z}", "干十神": shishen(rg, g),
                       "支本气十神": shishen(rg, CANGGAN[z][0]),
                       "与原局天干": [r for r in scan_gan([(p, gg) for p, gg, _ in pillars] + [("流年", g)]) if "流年" in r[1]],
                       "与原局地支": [r for r in scan_zhi([(p, zz) for p, _, zz in pillars] + [("流年", z)]) if "流年" in r[1]],
                       "整柱": [r for r in scan_zhu(pillars + [("流年", g, z)]) if "流年" in r[1]]})
        res["流年"] = ln
    return res


if __name__ == "__main__":
    main()
