---
name: app-store-changelog
description: Generate App Store release notes from git history.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# App Store Release Notes Generator

## Git Log Collection

```bash
# Collect commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# Collect commits with details
git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"%h %s%n%b" --no-merges

# Collect by author
git log $(git describe --tags --abbrev=0)..HEAD --author="developer" --oneline

# Collect merge commits (feature branch merges)
git log $(git describe --tags --abbrev=0)..HEAD --merges --pretty=format:"%h %s"

# Collect changed files
git diff --name-only $(git describe --tags --abbrev=0)..HEAD

# Collect diffstat summary
git diff --stat $(git describe --tags --abbrev=0)..HEAD
```

## Triage by User Impact

Classify each commit into user-facing categories:

| Category | Indicators | Label |
|----------|-----------|-------|
| New Feature | "Add", "Create", "Implement", "New" | ✨ New |
| Improvement | "Improve", "Enhance", "Update", "Better" | 🔄 Improved |
| Fix | "Fix", "Resolve", "Patch", "Correct" | 🐛 Fixed |
| Performance | "Optimize", "Faster", "Reduce", "Cache" | ⚡ Performance |
| UI | "Design", "Layout", "Animation", "Color" | 🎨 Design |
| Accessibility | "Accessibility", "a11y", "VoiceOver" | ♿ Accessibility |
| Security | "Security", "Vulnerability", "Auth" | 🔒 Security |

## Draft Notes

### Format

```markdown
What's New in Version {version}

{1-2 sentence summary of the release}

## ✨ New Features
- Feature description from user perspective

## 🔄 Improvements
- Improvement description

## 🐛 Bug Fixes
- Fix description

## ⚡ Performance
- Performance improvement
```

### Example Output

```
What's New in Version 2.5.0

This update brings dark mode improvements, faster recipe loading, 
and fixes an issue with photo uploads.

## ✨ New Features
- Share recipes directly to Messages and Mail
- Filter recipes by cooking time and difficulty

## 🔄 Improvements
- Smoother animations when switching between tabs
- Recipe search now shows results as you type
- Updated ingredient measurements for clarity

## 🐛 Bug Fixes
- Fixed a crash when opening recipes with missing images
- Resolved an issue where timers wouldn't sound in silent mode
- Fixed incorrect nutrition calculations for metric measurements

## ⚡ Performance
- Recipe list loads 40% faster
- Reduced memory usage when browsing large photo galleries
```

## Generation Script

```bash
#!/bin/bash
# generate_changelog.sh

PREV_TAG=$(git describe --tags --abbrev=0)
VERSION=${1:-"Next"}

echo "What's New in Version $VERSION"
echo ""
echo "Collecting changes since $PREV_TAG..."

# New features
FEATURES=$(git log $PREV_TAG..HEAD --oneline --no-merges | grep -iE "add|create|new feature|implement")
if [ -n "$FEATURES" ]; then
    echo ""
    echo "## ✨ New Features"
    echo "$FEATURES" | while read -r line; do
        echo "- $(echo $line | sed 's/^[a-f0-9]* //')"
    done
fi

# Bug fixes
FIXES=$(git log $PREV_TAG..HEAD --oneline --no-merges | grep -iE "fix|resolve|patch|correct")
if [ -n "$FIXES" ]; then
    echo ""
    echo "## 🐛 Bug Fixes"
    echo "$FIXES" | while read -r line; do
        echo "- $(echo $line | sed 's/^[a-f0-9]* //')"
    done
fi

# Improvements
IMPROVEMENTS=$(git log $PREV_TAG..HEAD --oneline --no-merges | grep -iE "improve|enhance|update|better")
if [ -n "$IMPROVEMENTS" ]; then
    echo ""
    echo "## 🔄 Improvements"
    echo "$IMPROVEMENTS" | while read -r line; do
        echo "- $(echo $line | sed 's/^[a-f0-9]* //')"
    done
fi
```

## Validation

- [ ] Notes are under 4,000 characters (App Store limit)
- [ ] Written from the user's perspective (not technical jargon)
- [ ] No internal commit hashes or developer names
- [ ] No mention of internal tools, CI, or infrastructure
- [ ] Grouped by category with emoji headers
- [ ] Most important changes listed first
- [ ] Proofread for clarity and grammar
