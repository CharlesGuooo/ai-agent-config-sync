---
name: swift-style
description: Swift code style check and formatting.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
---

# Swift Style Check & Formatting

## Tool Detection

```bash
# Check for SwiftFormat
which swiftformat
swiftformat --version

# Check for SwiftLint
which swiftlint
swiftlint version

# Check for Mint (tool manager)
which mint

# Check for project-local tools
ls -la .swiftformat .swiftlint.yml Mintfile 2>/dev/null
```

## Finding Changed Files

```bash
# Get changed Swift files vs main branch
git diff --name-only main..HEAD -- "*.swift"

# Get changed Swift files in working tree
git diff --name-only -- "*.swift"

# Get staged Swift files
git diff --cached --name-only -- "*.swift"

# Get all Swift files (for full project lint)
find . -name "*.swift" -not -path "*/.*" -not -path "*/Pods/*" -not -path "*/build/*"
```

## SwiftFormat

```bash
# Dry-run (check without modifying)
swiftformat --lint --dryrun .

# Format all Swift files
swiftformat .

# Format specific files
swiftformat path/to/File1.swift path/to/File2.swift

# Format with project config
swiftformat --config .swiftformat .

# Format changed files only
git diff --name-only main..HEAD -- "*.swift" | xargs swiftformat

# Common SwiftFormat rules (in .swiftformat):
# --swiftversion 5.10
# --indent 4
# --trimwhitespace always
# --voidtype void
# --commas always
# --decimalgrouping 3,6
# --exponentcase lowercase
# --header ignore
# --ifdef indent
# --importgrouping alpha
# --indentcase false
# --linebreaks lf
# --ranges spaced
# --semicolons never
# --stripunusedargs closure-only
# --trimwhitespace always
# --wraparguments before-first
# --wrapcollections before-first
```

## SwiftLint

```bash
# Lint entire project
swiftlint lint

# Lint specific files
swiftlint lint --path path/to/File.swift

# Lint changed files
git diff --name-only main..HEAD -- "*.swift" | xargs swiftlint lint --path

# Auto-correct issues
swiftlint --fix

# Auto-correct specific files
swiftlint --fix --path path/to/File.swift

# Get JSON output for processing
swiftlint lint --reporter json

# Common .swiftlint.yml configuration:
# included:
#   - Sources
#   - Tests
# excluded:
#   - Pods
#   - Generated
# opt_in_rules:
#   - closure_end_indentation
#   - closure_spacing
#   - collection_alignment
#   - contains_over_filter_count
#   - empty_count
#   - empty_string
#   - explicit_init
#   - fatal_error_message
#   - first_where
#   - force_unwrapping
#   - implicitly_unwrapped_optional
#   - last_where
#   - legacy_random
#   - literal_expression_end_indentation
#   - modifier_order
#   - operator_usage_whitespace
#   - overridden_super_call
#   - override_in_extension
#   - private_outlet
#   - prohibited_super_call
#   - redundant_nil_coalescing
#   - sorted_first_last
#   - toggle_bool
#   - trailing_closure
#   - unneeded_parentheses_in_closure_argument
#   - vertical_parameter_alignment_on_call
#   - yoda_condition
# disabled_rules:
#   - trailing_whitespace
```

## Fix Proposals

When SwiftLint or SwiftFormat reports issues, propose fixes:

### Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Force unwrap `value!` | Use `guard let` or `if let` |
| Trailing whitespace | `swiftformat --trimwhitespace always` |
| Line too long | Break into multiple lines |
| Opening brace on new line | `swiftformat --allman false` |
| Missing space after comma | `swiftformat` auto-fix |
| `self` not needed | Remove explicit `self` (unless required) |
| Unused import | Remove the import |
| Function body length | Extract into smaller functions |
| Type body length | Split into extensions or separate files |

### Apply Fixes

```bash
# Auto-fix what's safe to fix
swiftlint --fix --path path/to/File.swift
swiftformat path/to/File.swift

# Review the changes
git diff path/to/File.swift

# If satisfied, stage
git add path/to/File.swift
```

## Style Checklist

- [ ] SwiftFormat run on changed files
- [ ] SwiftLint passes with no errors
- [ ] Warnings reviewed and addressed or documented
- [ ] No force-unwraps introduced
- [ ] No `print()` statements in production code
- [ ] Imports sorted alphabetically
- [ ] Consistent indentation (4 spaces)
