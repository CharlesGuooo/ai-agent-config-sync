---
name: meihua-divination
description: >-
  梅花易数 / 五行生克风格的中式玄学解读：当前运势、感情、事业选择、项目走势、个人倾向，
  侧重趋势诊断和可执行建议而非绝对预言。Use for 中式玄学 / 梅花易数 readings.
  Pointer skill：先按 Install 装进项目再用。
allowed-tools: Read, Bash
compatibility: "network — clones the upstream repo from GitHub once; the skill itself needs Python 3 and no network"
source: https://github.com/qiyan233/meihua-divination
---

# meihua-divination（指路版）

**来源：** https://github.com/qiyan233/meihua-divination

**为什么只是指路：** 上游没有声明许可证（README 写明尚未声明），作者保留所有权利，所以这个公开仓库
不收录它的文件。需要时装进用到它的项目里，仅供该项目自己使用。

## Install

装进项目自己的 skills 文件夹，不要装进 `~/.claude/skills` 或 `~/life-project/`：那些位置是指向本仓库的
链接，写进去的文件会落到仓库里。

```bash
git clone --depth 1 https://github.com/qiyan233/meihua-divination.git <project>/.claude/skills/meihua-divination
rm -rf <project>/.claude/skills/meihua-divination/.git
```

换成当前 agent 对应的项目文件夹（`.claude/skills`、`.cursor/skills`、`.opencode/skills`、`.agents/skills` 等），
然后在项目里开新会话，按装好的 `SKILL.md` 使用。
