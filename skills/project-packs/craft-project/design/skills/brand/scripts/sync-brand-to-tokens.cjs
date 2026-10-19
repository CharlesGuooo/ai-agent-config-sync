#!/usr/bin/env node
/**
 * sync-brand-to-tokens.cjs
 *
 * Syncs brand-guidelines.md colors → design-tokens.json → design-tokens.css
 *
 * Usage:
 *   node sync-brand-to-tokens.cjs
 *   node sync-brand-to-tokens.cjs --dry-run
 *   node sync-brand-to-tokens.cjs --force
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const BRAND_GUIDELINES = 'docs/brand-guidelines.md';
const DESIGN_TOKENS_JSON = 'assets/design-tokens.json';
const DESIGN_TOKENS_CSS = 'assets/design-tokens.css';
const CSS_TOKEN_SOURCES = [
  'src/index.css',
  'src/main.css',
  'src/app.css',
  'src/global.css',
  'src/globals.css',
  'src/styles/global.css',
  'src/styles/globals.css',
  'src/styles/index.css',
  'src/styles/main.css',
  'src/styles/tokens.css',
  'src/app/global.css',
  'src/app/globals.css',
  'app/global.css',
  'app/globals.css',
  'styles/global.css',
  'styles/globals.css',
  'styles/tokens.css'
];
// Directories shallow-scanned for any *.css that already declares tokens.
// A hardcoded filename list alone misses real projects by a single letter
// (e.g. styles/global.css vs styles/globals.css), which silently defeats the
// overwrite guard.
const CSS_SCAN_DIRS = [
  'src',
  'src/styles',
  'src/css',
  'src/assets/styles',
  'app',
  'app/styles',
  'styles',
  'css'
];
const TAILWIND_CONFIGS = [
  'tailwind.config.js',
  'tailwind.config.cjs',
  'tailwind.config.mjs',
  'tailwind.config.ts'
];
// Sibling sub-skill, resolved from this file's location so it works in every
// install context (plugin cache, project or --global CLI install), not only
// when the process runs from a project root that contains .claude/skills/.
const GENERATE_TOKENS_SCRIPT = path.resolve(__dirname, '..', '..', 'design-system', 'scripts', 'generate-tokens.cjs');

/**
 * Find project files that already act as design-token sources.
 */
function findExistingTokenSources(projectRoot) {
  const sources = new Set();
  const addIfPresent = (relativePath) => {
    if (fs.existsSync(path.resolve(projectRoot, relativePath))) {
      sources.add(relativePath);
    }
  };

  const scanCssSource = (absolutePath, visited = new Set()) => {
    const normalizedPath = path.resolve(absolutePath);
    const relativePath = path.relative(projectRoot, normalizedPath);
    if (
      visited.has(normalizedPath) ||
      relativePath.startsWith('..') ||
      path.isAbsolute(relativePath) ||
      !fs.existsSync(normalizedPath)
    ) {
      return;
    }

    visited.add(normalizedPath);
    const content = fs.readFileSync(normalizedPath, 'utf-8');
    const uncommented = content.replace(/\/\*[\s\S]*?\*\//g, '');
    const hasRootTokens = /:root\b[^{}]*\{[^}]*--[A-Za-z0-9_-]+\s*:/.test(uncommented);
    const hasTailwindTheme = /@theme(?:\s+[A-Za-z-]+)?\s*\{[^}]*--[A-Za-z0-9_-]+\s*:/.test(uncommented);
    if (hasRootTokens || hasTailwindTheme) {
      sources.add(relativePath.split(path.sep).join('/'));
    }

    const importPattern = /@import\s+(?:url\(\s*)?(['"])([^'"]+)\1\s*\)?[^;]*;/g;
    for (const match of uncommented.matchAll(importPattern)) {
      const importTarget = match[2].split(/[?#]/, 1)[0];
      let importedPath;
      if (importTarget.startsWith('.')) {
        importedPath = path.resolve(path.dirname(normalizedPath), importTarget);
      } else if (importTarget.startsWith('/')) {
        importedPath = path.resolve(projectRoot, `.${importTarget}`);
      } else {
        continue;
      }
      scanCssSource(importedPath, visited);
    }
  };

  addIfPresent(DESIGN_TOKENS_JSON);
  addIfPresent(DESIGN_TOKENS_CSS);

  const candidates = new Set(CSS_TOKEN_SOURCES);
  for (const dir of CSS_SCAN_DIRS) {
    const absoluteDir = path.resolve(projectRoot, dir);
    let entries;
    try {
      entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.css')) {
        candidates.add(`${dir}/${entry.name}`);
      }
    }
  }

  for (const relativePath of candidates) {
    const absolutePath = path.resolve(projectRoot, relativePath);
    scanCssSource(absolutePath);
  }

  for (const relativePath of TAILWIND_CONFIGS) {
    const absolutePath = path.resolve(projectRoot, relativePath);
    if (!fs.existsSync(absolutePath)) continue;
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const hasInlineColors = /\btheme\s*:\s*\{[\s\S]*?\bcolors\s*:/.test(content);
    const hasPreset = /\bpresets\s*:/.test(content);
    const hasThemeSpread = /\btheme\s*:\s*\{[\s\S]*?\.\.\.[A-Za-z_$]/.test(content);
    if (hasInlineColors || hasPreset || hasThemeSpread) {
      sources.add(relativePath);
    }
  }

  return [...sources];
}

/**
 * Extract color info from brand guidelines markdown
 */
function extractColorsFromMarkdown(content) {
  const colors = {
    primary: { name: 'primary', shades: {} },
    secondary: { name: 'secondary', shades: {} },
    accent: { name: 'accent', shades: {} }
  };

  // Extract primary color name and hex from Quick Reference table
  const quickRefMatch = content.match(/Primary Color\s*\|\s*#([A-Fa-f0-9]{6})\s*\(([^)]+)\)/);
  if (quickRefMatch) {
    colors.primary.name = quickRefMatch[2].toLowerCase().replace(/\s+/g, '-');
    colors.primary.base = `#${quickRefMatch[1]}`;
  }

  const secondaryMatch = content.match(/Secondary Color\s*\|\s*#([A-Fa-f0-9]{6})\s*\(([^)]+)\)/);
  if (secondaryMatch) {
    colors.secondary.name = secondaryMatch[2].toLowerCase().replace(/\s+/g, '-');
    colors.secondary.base = `#${secondaryMatch[1]}`;
  }

  const accentMatch = content.match(/Accent Color\s*\|\s*#([A-Fa-f0-9]{6})\s*\(([^)]+)\)/);
  if (accentMatch) {
    colors.accent.name = accentMatch[2].toLowerCase().replace(/\s+/g, '-');
    colors.accent.base = `#${accentMatch[1]}`;
  }

  // Extract all shades from Primary Colors table
  const primarySection = content.match(/### Primary Colors[\s\S]*?\|[\s\S]*?(?=###|$)/i);
  if (primarySection) {
    const hexMatches = primarySection[0].matchAll(/\*\*([^*]+)\*\*\s*\|\s*#([A-Fa-f0-9]{6})/g);
    for (const match of hexMatches) {
      const name = match[1].trim().toLowerCase();
      const hex = `#${match[2]}`;
      if (name.includes('dark')) colors.primary.dark = hex;
      else if (name.includes('light')) colors.primary.light = hex;
      else colors.primary.base = hex;
    }
  }

  // Extract secondary shades
  const secondarySection = content.match(/### Secondary Colors[\s\S]*?\|[\s\S]*?(?=###|$)/i);
  if (secondarySection) {
    const hexMatches = secondarySection[0].matchAll(/\*\*([^*]+)\*\*\s*\|\s*#([A-Fa-f0-9]{6})/g);
    for (const match of hexMatches) {
      const name = match[1].trim().toLowerCase();
      const hex = `#${match[2]}`;
      if (name.includes('dark')) colors.secondary.dark = hex;
      else if (name.includes('light')) colors.secondary.light = hex;
      else colors.secondary.base = hex;
    }
  }

  // Extract accent shades
  const accentSection = content.match(/### Accent Colors[\s\S]*?\|[\s\S]*?(?=###|$)/i);
  if (accentSection) {
    const hexMatches = accentSection[0].matchAll(/\*\*([^*]+)\*\*\s*\|\s*#([A-Fa-f0-9]{6})/g);
    for (const match of hexMatches) {
      const name = match[1].trim().toLowerCase();
      const hex = `#${match[2]}`;
      if (name.includes('dark')) colors.accent.dark = hex;
      else if (name.includes('light')) colors.accent.light = hex;
      else colors.accent.base = hex;
    }
  }

  return colors;
}

/**
 * Generate color scale from base color (simple approach)
 */
function generateColorScale(baseHex, darkHex, lightHex) {
  // Use provided shades or generate approximations
  return {
    "50": { "$value": lightHex || adjustBrightness(baseHex, 0.9), "$type": "color" },
    "100": { "$value": lightHex || adjustBrightness(baseHex, 0.8), "$type": "color" },
    "200": { "$value": adjustBrightness(baseHex, 0.6), "$type": "color" },
    "300": { "$value": adjustBrightness(baseHex, 0.4), "$type": "color" },
    "400": { "$value": adjustBrightness(baseHex, 0.2), "$type": "color" },
    "500": { "$value": baseHex, "$type": "color" },
    "600": { "$value": darkHex || adjustBrightness(baseHex, -0.15), "$type": "color" },
    "700": { "$value": adjustBrightness(baseHex, -0.3), "$type": "color" },
    "800": { "$value": adjustBrightness(baseHex, -0.45), "$type": "color" },
    "900": { "$value": adjustBrightness(baseHex, -0.6), "$type": "color" }
  };
}

/**
 * Adjust hex color brightness.
 *
 * Blends each channel proportionally toward white (percent > 0) or toward
 * black (percent < 0) instead of adding/subtracting a flat 255*percent to
 * every channel. The flat-shift approach clamped all three channels to 0
 * (or 255) whenever the base color's channels were already low (or high)
 * relative to the shift — e.g. darkening a dark brand color like #4A3228
 * by -0.3/-0.45/-0.6 produced #000000 for all three, collapsing shades
 * 700/800/900 into an identical, useless black.
 */
function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xFF;
  const g = (num >> 8) & 0xFF;
  const b = num & 0xFF;

  const adjustChannel = (channel) => {
    const adjusted = percent >= 0
      ? channel + (255 - channel) * percent
      : channel * (1 + percent);
    return Math.min(255, Math.max(0, Math.round(adjusted)));
  };

  const newR = adjustChannel(r);
  const newG = adjustChannel(g);
  const newB = adjustChannel(b);
  return `#${((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0').toUpperCase()}`;
}

/**
 * Update design tokens JSON
 */
function updateDesignTokens(tokens, colors) {
  // Update brand name
  const brandName = `ClaudeKit Marketing - ${colors.primary.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
  tokens.brand = brandName;

  // Update primitive colors with new names
  const primitiveColors = tokens.primitive?.color || {};

  // Remove old color keys, add new ones
  delete primitiveColors.coral;
  delete primitiveColors.purple;
  delete primitiveColors.mint;

  // Add new named colors
  primitiveColors[colors.primary.name] = generateColorScale(
    colors.primary.base,
    colors.primary.dark,
    colors.primary.light
  );
  primitiveColors[colors.secondary.name] = generateColorScale(
    colors.secondary.base,
    colors.secondary.dark,
    colors.secondary.light
  );
  primitiveColors[colors.accent.name] = generateColorScale(
    colors.accent.base,
    colors.accent.dark,
    colors.accent.light
  );

  tokens.primitive.color = primitiveColors;

  // Update ALL semantic color references
  if (tokens.semantic?.color) {
    const sem = tokens.semantic.color;
    const p = colors.primary.name;
    const s = colors.secondary.name;
    const a = colors.accent.name;

    // Primary variants
    sem.primary = { "$value": `{primitive.color.${p}.500}`, "$type": "color" };
    sem['primary-hover'] = { "$value": `{primitive.color.${p}.600}`, "$type": "color" };
    sem['primary-active'] = { "$value": `{primitive.color.${p}.700}`, "$type": "color" };
    sem['primary-light'] = { "$value": `{primitive.color.${p}.400}`, "$type": "color" };
    sem['primary-lighter'] = { "$value": `{primitive.color.${p}.100}`, "$type": "color" };
    sem['primary-dark'] = { "$value": `{primitive.color.${p}.600}`, "$type": "color" };

    // Secondary variants
    sem.secondary = { "$value": `{primitive.color.${s}.500}`, "$type": "color" };
    sem['secondary-hover'] = { "$value": `{primitive.color.${s}.600}`, "$type": "color" };
    sem['secondary-light'] = { "$value": `{primitive.color.${s}.300}`, "$type": "color" };
    sem['secondary-dark'] = { "$value": `{primitive.color.${s}.600}`, "$type": "color" };

    // Accent variants
    sem.accent = { "$value": `{primitive.color.${a}.500}`, "$type": "color" };
    sem['accent-hover'] = { "$value": `{primitive.color.${a}.600}`, "$type": "color" };
    sem['accent-light'] = { "$value": `{primitive.color.${a}.300}`, "$type": "color" };

    // Status colors (use accent for success, primary for error/info)
    sem.success = { "$value": `{primitive.color.${a}.500}`, "$type": "color" };
    sem['success-light'] = { "$value": `{primitive.color.${a}.300}`, "$type": "color" };
    sem.error = { "$value": `{primitive.color.${p}.500}`, "$type": "color" };
    sem['error-light'] = { "$value": `{primitive.color.${p}.300}`, "$type": "color" };
    sem.info = { "$value": `{primitive.color.${s}.500}`, "$type": "color" };
    sem['info-light'] = { "$value": `{primitive.color.${s}.300}`, "$type": "color" };
  }

  // Update component references (button uses primary color with opacity)
  if (tokens.component?.button?.secondary) {
    const primaryBase = colors.primary.base;
    tokens.component.button.secondary['bg-hover'] = {
      "$value": `${primaryBase}1A`,
      "$type": "color"
    };
  }

  return tokens;
}

/**
 * Main
 */
function main() {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const projectRoot = process.cwd();

  console.log('🔄 Syncing brand guidelines → design tokens\n');

  // Read brand guidelines
  const guidelinesPath = path.resolve(projectRoot, BRAND_GUIDELINES);
  if (!fs.existsSync(guidelinesPath)) {
    console.error(`❌ Brand guidelines not found: ${guidelinesPath}`);
    process.exit(1);
  }
  const guidelinesContent = fs.readFileSync(guidelinesPath, 'utf-8');

  const existingSources = findExistingTokenSources(projectRoot);
  if (existingSources.length > 0 && !force) {
    const details = existingSources.map(source => `   - ${source}`).join('\n');
    const message =
      `Existing design-token source${existingSources.length === 1 ? '' : 's'} detected:\n${details}\n` +
      'Refusing to create or replace token files. Review the detected source and re-run with --force only if replacement is intentional.';
    if (dryRun) {
      console.warn(`⚠️  ${message}\n`);
    } else {
      console.error(`❌ ${message}`);
      process.exit(1);
    }
  }

  // Extract colors
  const colors = extractColorsFromMarkdown(guidelinesContent);
  console.log('📊 Extracted colors:');
  console.log(`   Primary: ${colors.primary.name} (${colors.primary.base})`);
  console.log(`   Secondary: ${colors.secondary.name} (${colors.secondary.base})`);
  console.log(`   Accent: ${colors.accent.name} (${colors.accent.base})\n`);

  // Read existing tokens
  const tokensPath = path.resolve(projectRoot, DESIGN_TOKENS_JSON);
  let tokens = {};
  if (fs.existsSync(tokensPath)) {
    tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
  }

  // Update tokens
  tokens = updateDesignTokens(tokens, colors);

  if (dryRun) {
    console.log('📋 Would update design-tokens.json:');
    console.log(JSON.stringify(tokens.primitive.color, null, 2).slice(0, 500) + '...');
    console.log('\n⏭️  Dry run - no files changed');
    return;
  }

  // Write updated tokens
  fs.mkdirSync(path.dirname(tokensPath), { recursive: true });
  fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
  console.log(`✅ Updated: ${DESIGN_TOKENS_JSON}`);

  // Regenerate CSS
  const generateScript = GENERATE_TOKENS_SCRIPT;
  if (fs.existsSync(generateScript)) {
    try {
      execSync(`node ${generateScript} --config ${DESIGN_TOKENS_JSON} -o ${DESIGN_TOKENS_CSS}`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      console.log(`✅ Regenerated: ${DESIGN_TOKENS_CSS}`);
    } catch (e) {
      console.error('⚠️  Failed to regenerate CSS:', e.message);
    }
  } else {
    console.warn(`⚠️  design-system sub-skill not found at ${generateScript}; ${DESIGN_TOKENS_CSS} not regenerated`);
  }

  console.log('\n✨ Brand sync complete!');
}

main();
