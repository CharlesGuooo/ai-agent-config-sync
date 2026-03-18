# 专业领域 Skills 索引

> 调用方式: `/skill-name` 或描述需求让 Claude 匹配
>
> 触发关键词用于语义匹配，直接在需求中提及即可激活对应 skill

## 安全

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `senior-security` | 安全工程 | 安全, security, 威胁建模, threat modeling, 渗透测试, pentest, 漏洞, vulnerability |

## 技能开发

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `skill-creator` | 创建技能 | 创建技能, create skill, 新技能, new skill, skill开发 |
| `skill-developer` | 技能开发 | 技能开发, skill development, 最佳实践, best practices, 规范 |
| `writing-skills` | 编写技能 | 编写技能, writing skills, 技能文档, skill documentation |

## 全栈

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `senior-fullstack` | 全栈开发 | 全栈, fullstack, 前后端, frontend backend, 完整应用, full application |
| `subagent-driven-development` | 子代理开发 | 子代理, subagent, 多代理, multi-agent, 并行开发, parallel development |

## LangChain & LangGraph

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `langchain-fundamentals` | LangChain 基础 | LangChain, langchain, agent, chain, LLM应用 |
| `langchain-dependencies` | LangChain 依赖 | LangChain依赖, langchain dependencies, 项目设置 |
| `langchain-middleware` | LangChain 中间件 | LangChain中间件, middleware, 人工介入, human-in-the-loop |
| `langchain-rag` | LangChain RAG | RAG, retrieval, 检索增强, 向量数据库, vector store |
| `langgraph-fundamentals` | LangGraph 基础 | LangGraph, langgraph, 状态图, state graph, 工作流 |
| `langgraph-human-in-the-loop` | LangGraph 人机交互 | LangGraph人机交互, human-in-the-loop, 人工审批 |
| `langgraph-persistence` | LangGraph 持久化 | LangGraph持久化, persistence, 检查点, checkpoint |
| `framework-selection` | LangChain 框架选择 | 框架选择, framework selection, LangChain选型 |

## 认知分析

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `dhdna-profiler` | 认知模式分析 | 认知模式, cognitive pattern, 思维指纹, thinking fingerprint, AI风格 |

## MATLAB

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `matlab` | MATLAB 计算 | MATLAB, matlab, 数值计算, numerical computing, Octave, 矩阵计算 |

## 主题样式

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `theme-factory` | 主题样式 | 主题, theme, 样式, style, 样式工厂, theming |

## 键绑定

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `keybindings-help` | 键绑定帮助 | 键绑定, keybinding, 快捷键, shortcut, 热键, hotkey |

## 代码简化

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `simplify` | 代码简化 | 简化, simplify, 重构, refactor, 优化, optimize, 代码清理 |

## Deep Agents

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `deep-agents-core` | Deep Agents 核心 | Deep Agent, deep agent, AI代理核心, agent core |
| `deep-agents-memory` | Deep Agents 记忆 | agent memory, 代理记忆, 记忆系统, memory system |
| `deep-agents-orchestration` | Deep Agents 编排 | agent orchestration, 代理编排, 任务分发, task dispatch |

## OpenSpec (Spec 驱动开发)

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| `openspec-propose` | 创建变更提案 | spec, 提案, proposal, 变更, change, propose, 功能规划 |
| `openspec-explore` | 探索想法 | explore, 探索, 调研, 调查, investigate, 想法梳理 |
| `openspec-apply-change` | 实现变更任务 | apply, 实现, implement, 执行任务, implement tasks |
| `openspec-archive-change` | 归档完成变更 | archive, 归档, 完成, complete, 变更完成 |

**OpenSpec vs writing-plans 选择指南**：
- **大型功能/重构** → OpenSpec (结构化管理、依赖追踪、归档历史)
- **快速 bug 修复** → writing-plans (更轻量)
- **需要 spec 持久化** → OpenSpec (Delta specs 机制)
- **多变更并行开发** → OpenSpec (change 列表管理)
- **临时探索性任务** → writing-plans 或 brainstorming
