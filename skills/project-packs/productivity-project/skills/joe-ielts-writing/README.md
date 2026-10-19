# joe-ielts-writing — Joe 老师的雅思写作教学分身

> 用 Joe 老师的教学体系和方法陪你练，不是 Joe 本人。

## 这是什么

一个 AI 教学 Skill（Claude Code / 腾讯 WorkBuddy / 千问办公 / 豆包 均可安装）：复刻了一位雅思写作老师的完整教学体系——

- **Task 2 大作文**：审题四陷阱、"为什么"转述法、具象化/情景化 Brainstorming、中心句构造、因果论证（含否定后件/对比/假设）、冲 7 语言三件套
- **Task 1 小作文**：决策流程（动/静态 → 元素比 → 分段）、模板句库、切线思维、Grouping 高阶写法、流程图与地图题
- **教学引导方式**：先诊断后讲解、苏格拉底式选项、先破后立、举一反三、按评分标准四维度批改

**核心理念**（也是它和"AI 批改工具"的区别）：大作文教的是"想清楚再写"——观点和语言都是次要的，论证才是核心；小作文全是模板——掌握套路就能至少 7 分。

## 学生怎么安装

把本文件夹（`joe-ielts-writing`）放进你常用 AI 软件的 skills 目录，重启软件即可：

| 软件 | 目录 |
|------|------|
| Claude Code | `~/.claude/skills/` |
| 腾讯 WorkBuddy | `~/.workbuddy/skills/` |
| 千问办公 | `~/.qwenworkcn/skills/`（或 App 内「扩展 → 技能 → 安装技能」上传 SKILL.md） |
| 豆包桌面端（专业版） | `~/.agents/skills/` |

Windows 把 `~` 换成 `%USERPROFILE%`。详细图文说明见随包发的《安装说明-学生版》。

然后直接开聊："老师，大作文跑题怎么办？"

## 怎么用

直接问，就像问老师：

- "这道 Discuss both views 该用什么结构？"（会带你走决策流程，而不是直接给答案）
- "帮我批改这篇作文"（按 TR→CC→LR→GRA 四维度逐个点评）
- "我看到犯罪类题目就没想法"（会按话题从 527 道真题库检索，给你"观点+论据+具象化"三件套的中文素材）
- "给我一篇范文"（会给，但会逐段拆解为什么这样写）

## 文件地图

```
SKILL.md                  ← 入口：硬规则 + 路由表 + 交互流程
references/
├── question-types.md     题型识别决策树 + 三种结构 + 开头结尾模板
├── shenti.md             审题四陷阱 + "为什么"转述法
├── brainstorming.md      具象化/情景化 + 话题清单 + 素材书陷阱
├── outline-matrix.md     提纲矩阵：论据的触发器
├── body-paragraph.md     中心句 + 具象化 + 因果论证（含进阶三法）
├── special-questions.md  绝对词类 + 不可比较类 + Report 开头模板
├── checklist.md          四维度批改诊断清单
├── grammar-foundations.md 语法地基：主干法与三类从句
├── language-upgrade.md   冲 7 三件套：名词化 + Hedging + 引用动词
├── model-essays.md       30 篇剑桥官方范文（C4-C14）
├── question-bank.md      527 道真题机经（2013-2024，按话题分类）
├── task1-structure.md    小作文决策流程 + Intro/Overview 模板
├── task1-templates.md    模板句库（主语构造/高级模板/Grouping）
├── task1-chart-types.md  各图型专篇 + 常见错误清单
└── task1-diagrams.md     流程图与地图题
assets/
├── task1/                22 张数据图教学例题原图
└── task1-diagrams/       流程图/地图题例题原图 + Band 9 范文页
```

## 注意事项

- 本 skill 提供的范文（model-essays）为剑桥雅思真题官方范文，仅供教学拆解使用
- 真题机经（question-bank）为公开整理的历年考题，雅思考试常从题库抽取原题或稍作改动
- 批改建议基于一位老师的教学体系，不替代官方评分

---

*本 skill 由 Joe 老师的教学语料蒸馏而成（2026-09）。*
