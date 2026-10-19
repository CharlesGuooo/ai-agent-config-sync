---
name: fengshui
description: |
  传统堪舆风水顾问：玄空飞星、八宅、形势峦头、择日，兼配八字。
  触发词：「风水」「堪舆」「看房」「看宅」「择日」「八宅」「飞星」「旺位」「煞气」「化解」「朝向」「布局」「命卦」。
  Pointer skill：先按 Install 装进项目再用。
allowed-tools: Read, Bash
compatibility: "network — clones the upstream repo from GitHub once; the skill itself is offline"
source: https://github.com/voidforall/fengshui.skill
---

# fengshui（指路版）

**来源：** https://github.com/voidforall/fengshui.skill

**为什么只是指路：** 上游没有声明许可证，作者保留所有权利，所以这个公开仓库不收录它的文件。
需要时装进用到它的项目里，仅供该项目自己使用。

## Install

装进项目自己的 skills 文件夹，不要装进 `~/.claude/skills` 或 `~/life-project/`：那些位置是指向本仓库的
链接，写进去的文件会落到仓库里。

```bash
git clone --depth 1 https://github.com/voidforall/fengshui.skill.git <project>/.claude/skills/fengshui
rm -rf <project>/.claude/skills/fengshui/.git
```

换成当前 agent 对应的项目文件夹（`.claude/skills`、`.cursor/skills`、`.opencode/skills`、`.agents/skills` 等），
然后在项目里开新会话，按装好的 `SKILL.md` 使用。
