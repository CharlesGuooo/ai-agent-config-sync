# Claude Code 全局配置

## 网页搜索规则 (重要)
**内置 WebSearch 工具不可用。** 当需要进行网页搜索时，你必须使用 MCP 工具：

- **通用搜索**: 使用 `mcp__web-search__web_search` - 自动选择最佳后端
- **学术搜索**: 使用 `mcp__web-search__web_academic_search` - 论文和学术文献
- **深度研究**: 使用 `mcp__web-search__web_deep_research` - 全面分析报告
- **事实核查**: 使用 `mcp__web-search__web_fact_check` - 快速验证真伪

**不要使用内置的 WebSearch 工具**，它会返回错误。始终使用 `mcp__web-search__*` 系列工具。

## Skills 使用规则
在处理任何任务之前，你必须先检查 ~/.claude/skills/ 目录下是否有相关的 skill。
如果找到匹配的 skill，你必须读取其 SKILL.md 并严格按照其中的指导执行。
不要跳过这一步。

## 工作流程规则
- 使用 Superpowers 工作流进行开发任务
- 使用 TDD（测试驱动开发）进行编码
- 在提交代码前进行 code review
