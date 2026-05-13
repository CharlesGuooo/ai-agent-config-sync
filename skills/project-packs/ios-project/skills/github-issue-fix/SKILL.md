---
name: github-issue-fix
description: GitHub issue fix workflow. E2E from issue to commit.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
---

# GitHub Issue Fix Workflow

## Step 1: Fetch the Issue

```bash
# Fetch issue details
gh issue view {ISSUE_NUMBER}

# Fetch issue with comments
gh issue view {ISSUE_NUMBER} --comments

# Fetch issue labels and assignees
gh issue view {ISSUE_NUMBER} --json title,body,labels,assignees
```

Read the issue body carefully. Extract:
- **Problem description**: What is broken?
- **Expected behavior**: What should happen?
- **Reproduction steps**: How to trigger the issue?
- **Environment details**: iOS version, device, app version.

## Step 2: Locate the Code

```bash
# Search for related files by issue keywords
grep -rn "search_term" --include="*.swift" .

# Find files related to the feature
find . -name "*.swift" | xargs grep -l "FeatureName"

# Check recent changes to the area
git log --oneline --all -- "path/to/related/"
```

Map the issue to specific files and functions:
- Identify the primary file(s) to modify
- Identify any related test files
- Check for similar patterns elsewhere in the codebase

## Step 3: Implement the Fix

### Principles

1. **Minimal change** — fix only the reported issue, don't refactor surrounding code.
2. **Preserve existing behavior** — don't change unrelated functionality.
3. **Add regression test** — write a test that fails before the fix and passes after.
4. **Follow existing patterns** — match the code style of the surrounding code.

### Workflow

```bash
# Create a feature branch
git checkout -b fix/issue-{ISSUE_NUMBER}-short-description

# Make changes using Edit/Write tools
# ...

# Run tests to verify the fix
xcodebuild test \
    -workspace MyApp.xcworkspace \
    -scheme "MyApp" \
    -destination "platform=iOS Simulator,name=iPhone 16"
```

### Fix Patterns

```swift
// Null/optional safety fix
// BEFORE:
let name = user.name!

// AFTER:
guard let name = user.name else {
    logger.warning("User name is nil for user \(user.id)")
    return
}

// Array index safety fix
// BEFORE:
let first = items[0]

// AFTER:
guard let first = items.first else { return }

// Async error handling fix
// BEFORE:
Task {
    let data = try await service.fetch()
}

// AFTER:
Task {
    do {
        let data = try await service.fetch()
    } catch {
        logger.error("Fetch failed: \(error)")
        self.error = error
    }
}
```

## Step 4: Build & Test

```bash
# Build to verify compilation
xcodebuild build \
    -workspace MyApp.xcworkspace \
    -scheme "MyApp" \
    -destination "platform=iOS Simulator,name=iPhone 16"

# Run all tests
xcodebuild test \
    -workspace MyApp.xcworkspace \
    -scheme "MyApp" \
    -destination "platform=iOS Simulator,name=iPhone 16"

# Run specific test target
xcodebuild test \
    -workspace MyApp.xcworkspace \
    -scheme "MyApp" \
    -only-testing:"MyAppTests/FixTests" \
    -destination "platform=iOS Simulator,name=iPhone 16"
```

## Step 5: Commit & Push

```bash
# Stage changes
git add path/to/FixedFile.swift path/to/FixedFileTests.swift

# Commit with issue reference
git commit -m "Fix: short description of the fix

Fixes #{ISSUE_NUMBER}

- What was wrong
- How it was fixed
- Test coverage added"

# Push branch
git push -u origin fix/issue-{ISSUE_NUMBER}-short-description

# Create pull request
gh pr create \
    --title "Fix: short description" \
    --body "Fixes #{ISSUE_NUMBER}" \
    --base main
```

## Checklist

- [ ] Issue fully understood before coding
- [ ] Code located and root cause identified
- [ ] Fix is minimal and targeted
- [ ] Regression test added
- [ ] All existing tests pass
- [ ] Build succeeds with no warnings
- [ ] Commit message references the issue number
- [ ] PR created with description
