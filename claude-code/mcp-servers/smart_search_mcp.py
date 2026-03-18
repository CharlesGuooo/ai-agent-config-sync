#!/usr/bin/env python3
"""
Smart Search MCP Server - Unified Intelligent Web Search

This MCP server provides a single intelligent search interface that automatically
routes queries to the best backend (Parallel or OpenRouter/Perplexity) based on
query type and content.

Routing Logic:
- Academic/Scientific → OpenRouter (Perplexity sonar-pro-search)
- Quick facts/verification → OpenRouter (Perplexity sonar)
- Deep research → Parallel (core model)
- General search → Parallel (base model) - faster
- URL extraction → Parallel Extract API
"""

import os
import json
import re
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field, ConfigDict
from openai import OpenAI

# Initialize the MCP server
mcp = FastMCP("smart_search_mcp")

# API Keys
PARALLEL_API_KEY = os.getenv("PARALLEL_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# API Endpoints
PARALLEL_API_BASE = "https://api.parallel.ai"
OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"

# Search type enum
class SearchType(str, Enum):
    AUTO = "auto"              # Auto-detect best approach
    ACADEMIC = "academic"      # Scientific papers, research
    FACTS = "facts"            # Quick fact verification
    DEEP = "deep"              # Comprehensive research
    GENERAL = "general"        # General web search
    NEWS = "news"              # Current events
    TECHNICAL = "technical"    # Technical documentation


# Query patterns for auto-detection
ACADEMIC_PATTERNS = [
    r'\b(paper|research|study|publication|journal|arxiv|pubmed|doi|citation|peer.?review|scientific|academic|scholarly)\b',
    r'\b(molecular|cellular|biological|chemical|physical|quantum|neural|genetic|protein|gene)\b',
    r'\b(clinical trial|randomized controlled|meta.?analysis|systematic review)\b',
    r'\b(methodology|hypothesis|empirical|theoretical|findings)\b',
]

FACT_PATTERNS = [
    r'^(what|who|when|where|which|how many|how much)\s',
    r'\b(is it true|verify|fact.?check|confirm|debunk)\b',
    r'\b(true|false|correct|accurate|real|fake)\s*(\?|$)',
]

DEEP_RESEARCH_PATTERNS = [
    r'\b(comprehensive|thorough|detailed|in.?depth|extensive|complete)\b',
    r'\b(analysis|report|overview|survey|comparison|evaluate)\b',
    r'\b(market|industry|competitive|landscape)\b',
    r'\b(trends|future|outlook|forecast|projections)\b',
]

NEWS_PATTERNS = [
    r'\b(latest|recent|breaking|today|this week|this month|current)\b',
    r'\b(news|announcement|release|update|developing)\b',
]

TECHNICAL_PATTERNS = [
    r'\b(how to|tutorial|guide|documentation|api|sdk|install|setup|configure)\b',
    r'\b(github|npm|pip|docker|kubernetes|aws|azure|gcp)\b',
    r'\b(code|programming|developer|implementation|example)\b',
]


def detect_search_type(query: str) -> SearchType:
    """Auto-detect the best search type based on query content."""
    query_lower = query.lower()

    # Check patterns in order of specificity
    for pattern in ACADEMIC_PATTERNS:
        if re.search(pattern, query_lower):
            return SearchType.ACADEMIC

    for pattern in FACT_PATTERNS:
        if re.search(pattern, query_lower):
            return SearchType.FACTS

    for pattern in DEEP_RESEARCH_PATTERNS:
        if re.search(pattern, query_lower):
            return SearchType.DEEP

    for pattern in NEWS_PATTERNS:
        if re.search(pattern, query_lower):
            return SearchType.NEWS

    for pattern in TECHNICAL_PATTERNS:
        if re.search(pattern, query_lower):
            return SearchType.TECHNICAL

    return SearchType.GENERAL


def get_parallel_client() -> OpenAI:
    """Get OpenAI client for Parallel API."""
    if not PARALLEL_API_KEY:
        raise ValueError("PARALLEL_API_KEY not set")
    return OpenAI(api_key=PARALLEL_API_KEY, base_url=PARALLEL_API_BASE)


def get_openrouter_client() -> OpenAI:
    """Get OpenAI client for OpenRouter API."""
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not set")
    return OpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url=OPENROUTER_API_BASE,
        default_headers={
            "HTTP-Referer": "https://claude.ai",
            "X-Title": "Claude Code Smart Search"
        }
    )


# Pydantic Models
class SmartSearchInput(BaseModel):
    """Input model for smart search."""
    model_config = ConfigDict(str_strip_whitespace=True)

    query: str = Field(
        ...,
        description="The search query",
        min_length=2,
        max_length=2000  # Reduced to prevent token bloat
    )
    search_type: SearchType = Field(
        default=SearchType.AUTO,
        description="Type of search: auto (recommended), academic, facts, deep, general, news, technical"
    )
    prefer_backend: Optional[str] = Field(
        default=None,
        description="Preferred backend: 'parallel' or 'openrouter'. Leave empty for auto-selection."
    )
    max_length: Optional[int] = Field(
        default=2000,
        description="Maximum response length in characters (default: 2000, max: 5000)",
        ge=500,
        le=5000
    )


class DeepResearchInput(BaseModel):
    """Input model for deep research."""
    model_config = ConfigDict(str_strip_whitespace=True)

    topic: str = Field(
        ...,
        description="The research topic or question",
        min_length=10,
        max_length=5000
    )
    depth: str = Field(
        default="comprehensive",
        description="Research depth: 'quick', 'standard', or 'comprehensive'"
    )
    focus_areas: Optional[List[str]] = Field(
        default=None,
        description="Specific areas to focus on"
    )


class AcademicSearchInput(BaseModel):
    """Input model for academic search."""
    model_config = ConfigDict(str_strip_whitespace=True)

    query: str = Field(
        ...,
        description="Academic search query",
        min_length=5,
        max_length=3000
    )
    year_range: Optional[str] = Field(
        default=None,
        description="Year range, e.g., '2020-2025' or 'recent'"
    )
    paper_type: Optional[str] = Field(
        default=None,
        description="Type: 'peer-reviewed', 'preprint', 'review', 'clinical'"
    )


# Main Tool: Web Search (Primary search tool)
@mcp.tool(
    name="web_search",
    annotations={
        "title": "Web Search",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def web_search(params: SmartSearchInput) -> str:
    """Search the web for information. Use this tool whenever you need to search the internet.

    This is the PRIMARY web search tool. Use it for ALL web searches.
    It automatically selects the best backend (Parallel or Perplexity) based on query type.

    Handles all search types automatically:
    - General web search
    - Academic/scientific papers
    - Quick fact verification
    - Technical documentation
    - Current news and events
    - Deep research queries

    Args:
        params: Search parameters. The query field is required.
                search_type can be: auto (recommended), academic, facts, deep, general, news, technical

    Returns:
        Search results with answer, sources, and metadata
    """
    try:
        # Determine search type
        if params.search_type == SearchType.AUTO:
            search_type = detect_search_type(params.query)
        else:
            search_type = params.search_type

        # Route to appropriate backend
        backend = params.prefer_backend

        if backend is None:
            # Auto-select backend based on search type
            if search_type in [SearchType.ACADEMIC, SearchType.FACTS, SearchType.TECHNICAL]:
                backend = "openrouter"
            elif search_type == SearchType.DEEP:
                backend = "parallel"
            else:
                backend = "parallel"  # Default to parallel for general queries

        # Execute search
        if backend == "openrouter":
            result = await _search_openrouter(params.query, search_type)
        else:
            result = await _search_parallel(params.query, search_type)

        # Apply length limit if specified
        if params.max_length and len(result) > params.max_length:
            # Truncate JSON response while keeping it valid
            result_dict = json.loads(result)
            if "answer" in result_dict and len(result_dict["answer"]) > params.max_length - 500:
                result_dict["answer"] = result_dict["answer"][:params.max_length - 500] + "\n\n[Response truncated for brevity. Use max_length parameter to get more.]"
                result_dict["truncated"] = True
            result = json.dumps(result_dict, indent=2, ensure_ascii=False)

        return result

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e),
            "query": params.query
        }, indent=2)


async def _search_parallel(query: str, search_type: SearchType) -> str:
    """Execute search using Parallel API."""
    client = get_parallel_client()

    # Select model based on search type
    if search_type == SearchType.DEEP:
        model = "core"
        system_prompt = """You are a deep research analyst. Provide a CONCISE research report (max 1500 words).

Structure:
## Summary (2-3 sentences)
## Key Findings (3-5 bullet points)
## Details (organized by theme)
## Sources

Be factual and cite sources. NO repetition or filler content."""
    else:
        model = "base"
        system_prompt = """You are a web research assistant. Provide CONCISE answers (max 500 words).

Include:
- Key facts (bullet points preferred)
- Specific numbers/dates when relevant
- Source citations

Be direct. No filler or repetition."""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ],
        stream=False
    )

    content = response.choices[0].message.content if response.choices else ""

    # Extract sources
    sources = []
    basis = getattr(response, "basis", None)
    if basis:
        seen_urls = set()
        for item in basis:
            citations = (
                item.get("citations", []) if isinstance(item, dict)
                else getattr(item, "citations", None) or []
            )
            for cit in citations:
                url = cit.get("url", "") if isinstance(cit, dict) else getattr(cit, "url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    title = cit.get("title", "Untitled") if isinstance(cit, dict) else getattr(cit, "title", "Untitled")
                    sources.append({"url": url, "title": title})

    return json.dumps({
        "success": True,
        "query": query,
        "search_type": search_type.value,
        "backend": "parallel",
        "model": model,
        "answer": content,
        "sources": sources,
        "timestamp": datetime.now().isoformat()
    }, indent=2, ensure_ascii=False)


async def _search_openrouter(query: str, search_type: SearchType) -> str:
    """Execute search using OpenRouter/Perplexity API."""
    client = get_openrouter_client()

    # Select model based on search type
    if search_type == SearchType.ACADEMIC:
        model = "perplexity/sonar-pro-search"
        system_prompt = """You are an academic research assistant. Be CONCISE (max 800 words).

Provide:
- Key papers with DOIs
- Main findings (bullet points)
- Methodology notes if relevant

Focus on PubMed, arXiv, Google Scholar. No filler."""
    elif search_type == SearchType.FACTS:
        model = "perplexity/sonar"
        system_prompt = """You are a fact-checker. Be EXTREMELY concise.

Format:
## VERDICT
[TRUE/FALSE/PARTIAL/UNVERIFIABLE]

## Explanation
[1-2 sentences]

## Sources
[URLs only]

Max 200 words."""
    elif search_type == SearchType.TECHNICAL:
        model = "perplexity/sonar-pro"
        system_prompt = """You are a technical documentation assistant. Be CONCISE (max 600 words).

Provide:
- Key steps/commands
- Code snippets if helpful
- Source links

No filler. Direct and practical."""
    else:
        model = "perplexity/sonar-pro"
        system_prompt = """You are a web research assistant. Be CONCISE (max 500 words).

Provide:
- Key facts (bullet points)
- Specific numbers/dates
- Source citations

No repetition. No filler. Direct answers only."""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ],
        stream=False
    )

    content = response.choices[0].message.content if response.choices else ""

    # Extract citations
    citations = []
    if hasattr(response, 'citations') and response.citations:
        citations = response.citations

    return json.dumps({
        "success": True,
        "query": query,
        "search_type": search_type.value,
        "backend": "openrouter",
        "model": model,
        "answer": content,
        "citations": citations,
        "timestamp": datetime.now().isoformat()
    }, indent=2, ensure_ascii=False)


# Tool: Deep Research
@mcp.tool(
    name="web_deep_research",
    annotations={
        "title": "Deep Web Research",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def deep_research(params: DeepResearchInput) -> str:
    """Conduct comprehensive deep research on a topic. Use for thorough multi-source analysis.

    Use this when you need:
    - Market research and analysis
    - Technology surveys
    - Comprehensive topic exploration
    - Comparative analysis
    - In-depth reports with citations

    Args:
        params: Research parameters including topic and depth level

    Returns:
        Comprehensive research report with citations
    """
    try:
        client = get_parallel_client()

        # Build enhanced query
        query = params.topic
        if params.focus_areas:
            query += f"\n\nFocus especially on: {', '.join(params.focus_areas)}"

        # Select model based on depth
        if params.depth == "quick":
            model = "base"
        else:
            model = "core"

        system_prompt = """You are a senior research analyst. Produce a comprehensive research report with:

# Executive Summary
[2-3 paragraph overview of key findings]

# Key Findings
- Finding 1 with evidence
- Finding 2 with evidence
- Finding 3 with evidence

# Detailed Analysis
[Organized by themes, include data and statistics]

# Comparative Analysis
[Compare different perspectives/approaches if applicable]

# Future Outlook
[Trends, predictions, implications]

# Sources
[List all sources with URLs]

Cite all sources inline throughout the report. Use markdown formatting."""

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            stream=False
        )

        content = response.choices[0].message.content if response.choices else ""

        # Extract sources
        sources = []
        basis = getattr(response, "basis", None)
        if basis:
            seen_urls = set()
            for item in basis:
                citations = (
                    item.get("citations", []) if isinstance(item, dict)
                    else getattr(item, "citations", None) or []
                )
                for cit in citations:
                    url = cit.get("url", "") if isinstance(cit, dict) else getattr(cit, "url", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        title = cit.get("title", "Untitled") if isinstance(cit, dict) else getattr(cit, "title", "Untitled")
                        sources.append({"url": url, "title": title})

        return json.dumps({
            "success": True,
            "topic": params.topic,
            "depth": params.depth,
            "focus_areas": params.focus_areas,
            "report": content,
            "sources": sources,
            "source_count": len(sources),
            "timestamp": datetime.now().isoformat()
        }, indent=2, ensure_ascii=False)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e),
            "topic": params.topic
        }, indent=2)


# Tool: Academic Search
@mcp.tool(
    name="web_academic_search",
    annotations={
        "title": "Academic Paper Search",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def academic_search(params: AcademicSearchInput) -> str:
    """Search for academic papers and scientific literature. Use for scholarly research.

    Specialized for academic content:
    - Peer-reviewed papers and journals
    - Preprints (arXiv, bioRxiv)
    - Clinical trials
    - Citations and related work

    Args:
        params: Academic search parameters including query and optional filters

    Returns:
        Academic search results with proper citations and DOIs
    """
    try:
        client = get_openrouter_client()

        # Build enhanced query
        query = params.query
        if params.year_range:
            if params.year_range == "recent":
                query = f"Recent (2023-2025): {query}"
            else:
                query = f"[{params.year_range}] {query}"
        if params.paper_type:
            type_hints = {
                "peer-reviewed": "Focus on peer-reviewed journal articles.",
                "preprint": "Focus on preprints from arXiv, bioRxiv, medRxiv.",
                "review": "Focus on review articles and meta-analyses.",
                "clinical": "Focus on clinical trials and clinical studies."
            }
            query = f"{type_hints.get(params.paper_type, '')}\n{query}"

        system_prompt = """You are an academic research assistant specializing in scientific literature. Provide:

# Relevant Papers/Studies
[List key papers with proper citations including authors, journal, year, DOI]

# Key Findings
[Summarize main findings from the literature]

# Methodology Notes
[Important methodological considerations if relevant]

# Related Work
[Connected research areas and citations]

# Sources
[Full citations with URLs/DOIs]

Focus on:
- High-impact peer-reviewed sources
- Recent publications (unless historical context needed)
- Proper academic citation format
- DOI links when available"""

        response = client.chat.completions.create(
            model="perplexity/sonar-pro-search",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            stream=False
        )

        content = response.choices[0].message.content if response.choices else ""

        return json.dumps({
            "success": True,
            "query": params.query,
            "year_range": params.year_range,
            "paper_type": params.paper_type,
            "results": content,
            "timestamp": datetime.now().isoformat()
        }, indent=2, ensure_ascii=False)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e),
            "query": params.query
        }, indent=2)


# Tool: Fact Check
@mcp.tool(
    name="web_fact_check",
    annotations={
        "title": "Fact Check",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def fact_check(claim: str) -> str:
    """Verify a claim or fact. Use to check if something is true or false.

    Quick verification of specific claims, rumors, or statements.

    Args:
        claim: The claim or statement to verify

    Returns:
        Verification result with verdict (True/False/Partial) and sources
    """
    try:
        client = get_openrouter_client()

        system_prompt = """You are a professional fact-checker. Analyze the claim and respond in this exact format:

## VERDICT
[TRUE / FALSE / PARTIALLY TRUE / UNVERIFIABLE / OUTDATED]

## EXPLANATION
[1-2 sentence explanation]

## EVIDENCE
- Evidence point 1
- Evidence point 2

## SOURCES
- Source 1: [URL]
- Source 2: [URL]

Be objective and cite reliable sources."""

        response = client.chat.completions.create(
            model="perplexity/sonar",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Fact-check this claim: {claim}"}
            ],
            stream=False
        )

        content = response.choices[0].message.content if response.choices else ""

        return json.dumps({
            "success": True,
            "claim": claim,
            "verification": content,
            "timestamp": datetime.now().isoformat()
        }, indent=2, ensure_ascii=False)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e),
            "claim": claim
        }, indent=2)


if __name__ == "__main__":
    mcp.run()
