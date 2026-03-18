---
name: context-hub
description: >
  Intelligent documentation retrieval skill. TRIGGER when you need to use any third-party
  library, framework, or API — search and fetch accurate, up-to-date docs before writing code.
  Examples: "use OpenAI API", "implement Stripe payments", "FastAPI authentication", "pandas dataframe",
  any import statement for external packages. DO NOT trigger for built-in modules or standard library.
---

# Context Hub - Intelligent Documentation Retrieval

Automatically fetch accurate, up-to-date API documentation before writing code against external libraries.

## Setup (One-time)

The CLI is located at `C:/Users/Lenovo/Repos/context-hub/cli`. Use the full path:

```bash
cd C:/Users/Lenovo/Repos/context-hub/cli && node bin/chub <command>
```

Or install globally for convenience:
```bash
cd C:/Users/Lenovo/Repos/context-hub/cli && npm link
# Now you can use: chub <command>
```

## When to Use This Skill

**TRIGGER when:**
- User mentions using a third-party library, framework, or API
- You're about to write `import` statements for external packages
- User asks "how to use X" or "implement X with Y library"
- You're unsure about exact API signatures, parameters, or return types
- Working with rapidly evolving libraries (AI/ML, cloud services, etc.)

**DO NOT trigger for:**
- Python/JavaScript built-in modules (os, sys, json, fs, path, etc.)
- Standard library operations
- General programming concepts

## How It Works

### Step 1: Detect What You Need

Before writing any code using an external library, identify:
- The library/package name
- The language you're working in (Python: `py`, JavaScript: `js`, TypeScript: `ts`)
- The specific feature/module if applicable

### Step 2: Search for Documentation

```bash
cd C:/Users/Lenovo/Repos/context-hub/cli && node bin/chub search "<library or feature>" --json
```

Search tips:
- Use library name alone for broad results: `search "stripe"`
- Combine library + feature for specific results: `search "openai chat"`
- Check `id` field in results for exact entry ID

### Step 3: Fetch the Docs

```bash
node bin/chub get <id> --lang <py|js|ts>
```

Examples:
```bash
node bin/chub get openai/chat --lang py      # OpenAI Chat API for Python
node bin/chub get stripe/api --lang js       # Stripe API for JavaScript
node bin/chub get fastapi/package --lang py  # FastAPI framework docs
node bin/chub get anthropic/claude-api --lang py # Claude API for Python
```

### Step 4: Use the Documentation

- Read the fetched content carefully
- Use exact API signatures and parameters shown
- Follow code examples and patterns
- Note any version-specific information

### Step 5: Save Learnings (Optional)

If you discover something useful not in the docs (gotchas, workarounds, project-specific notes):

```bash
node bin/chub annotate <id> "Your note here"
```

Annotations persist across sessions and appear automatically on future fetches.

## Common Library Mappings

| Library | Search Query | Typical ID |
|---------|-------------|------------|
| OpenAI | `openai chat` | `openai/chat` |
| Anthropic/Claude | `anthropic claude` | `anthropic/claude-api` |
| Stripe | `stripe` | `stripe/api` |
| FastAPI | `fastapi` | `fastapi/package` |
| React | `react` | `react/core` |
| Next.js | `next` | `next/app` |
| Pandas | `pandas` | `pandas/package` |
| PyTorch | `torch` | `torch/package` |
| LangChain | `langchain` | `langchain/openai` |
| Supabase | `supabase` | `supabase/client` |

## Quick Reference

| Goal | Command |
|------|---------|
| Search docs | `node bin/chub search "query" --json` |
| Get Python docs | `node bin/chub get <id> --lang py` |
| Get JS docs | `node bin/chub get <id> --lang js` |
| Get all files | `node bin/chub get <id> --lang py --full` |
| Get specific file | `node bin/chub get <id> --file references/advanced.md` |
| Save a note | `node bin/chub annotate <id> "note"` |
| List all notes | `node bin/chub annotate --list` |

## Workflow Example

```
User: "Help me implement Stripe webhook handling in Python"

1. Search: node bin/chub search "stripe" --json
2. Fetch: node bin/chub get stripe/api --lang py
3. Read docs, find webhook section
4. Write correct code using documented patterns:
   - Proper signature verification
   - Correct event types
   - Error handling as documented
5. Annotate if discovered something useful
```

## Available Content

Context Hub contains 1500+ curated documentation entries including:

**AI/ML:** anthropic, openai, langchain, chromadb, weaviate, torch, tensorflow, transformers, crewai, vllm, mistral, groq, together

**Web:** react, vue, angular, next, fastapi, django, flask, express, axios, svelte

**Data:** pandas, polars, numpy, sqlalchemy, redis, mongodb, dask

**Cloud:** aws, azure, vercel, cloudflare, supabase

**Services:** stripe, twilio, sendgrid, auth0, clerk

**And many more...**

Search to discover what's available:
```bash
node bin/chub search --json | head -100
```

## Notes

- Always search first to find the correct entry ID
- Specify `--lang` when docs have multiple language variants
- Use `--full` for comprehensive docs with all reference files
- Annotations are local and private - they help you in future sessions
- If docs are outdated or wrong, use `chub feedback <id> down --label outdated`
