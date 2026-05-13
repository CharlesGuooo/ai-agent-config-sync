---
name: native-profiling
description: CLI Time Profiler via xctrace. CPU hotspot detection, performance optimization.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# CLI Time Profiler via xctrace

## Recording a Trace

```bash
# Basic Time Profiler recording (10 seconds)
xcrun xctrace record \
    --template "Time Profiler" \
    --device-name "iPhone 16" \
    --scheme "MyApp" \
    --output time-profile.trace \
    --time-limit 10s

# Record with specific launch arguments
xcrun xctrace record \
    --template "Time Profiler" \
    --device-name "iPhone 16" \
    --scheme "MyApp" \
    --output profile.trace \
    --launch-args "--debug-mode"

# Record with all CPU cores
xcrun xctrace record \
    --template "Time Profiler" \
    --device-name "iPhone 16" \
    --scheme "MyApp" \
    --output profile.trace \
    --all-cpus

# Record for a specific duration after app launch
xcrun xctrace record \
    --template "Time Profiler" \
    --device-name "iPhone 16" \
    --scheme "MyApp" \
    --output profile.trace \
    --time-limit 30s \
    --start-delay 2s
```

## Exporting and Symbolicating

```bash
# Export trace data to Instruments XML
xcrun xctrace export \
    --input profile.trace \
    --xpath '/trace-toc/run[@number="1"]/tracks/track[@name="Core Animation Frames"]' \
    --output frames.xml

# Export call tree as text summary
xcrun xctrace export \
    --input profile.trace \
    --output exported/

# Symbolicate crash reports
atos -arch arm64 \
    -o /path/to/MyApp.app.dSYM/Contents/Resources/DWARF/MyApp \
    -l 0x100000000 0x100003A40

# Get dSYM UUID for symbolication
dwarfdump --uuid /path/to/MyApp.app.dSYM/Contents/Resources/DWARF/MyApp
```

## Available Templates

```bash
# List all available templates
xcrun xctrace list templates

# Common templates for iOS:
# - "Time Profiler"         → CPU hotspots
# - "Allocations"           → Memory allocations
# - "Leaks"                 → Memory leaks
# - "SwiftUI"               → View body count, updates
# - "Core Data"             → Fetch/save performance
# - "Network"               → HTTP traffic
# - "Game Performance"      → GPU + CPU combined
# - "System Trace"          → Full system calls
# - "File Activity"         → Disk I/O
```

## iOS Profiling Workflow

### CPU Hotspot Detection

```bash
# Step 1: Record a Time Profiler trace
xcrun xctrace record \
    --template "Time Profiler" \
    --device-name "iPhone 16" \
    --scheme "MyApp" \
    --output cpu-hotspots.trace \
    --time-limit 15s

# Step 2: Open in Instruments for analysis
open cpu-hotspots.trace

# Step 3: In Instruments, look for:
# - Heaviest stack traces
# - Functions with highest self-time (not total time)
# - Recursive or repeated calls
# - System library calls taking unusual time
```

### Memory Profiling

```bash
# Record allocations trace
xcrun xctrace record \
    --template "Allocations" \
    --device-name "iPhone 16" \
    --scheme "MyApp" \
    --output memory.trace \
    --time-limit 20s

# Record leaks trace
xcrun xctrace record \
    --template "Leaks" \
    --device-name "iPhone 16" \
    --scheme "MyApp" \
    --output leaks.trace \
    --time-limit 30s
```

### SwiftUI Performance

```bash
# SwiftUI-specific profiling
xcrun xctrace record \
    --template "SwiftUI" \
    --device-name "iPhone 16" \
    --scheme "MyApp" \
    --output swiftui.trace \
    --time-limit 20s

# Look for:
# - View body call counts (high = unnecessary redraws)
# - Dependency change frequency
# - Time spent in body evaluation
```

## Quick Diagnosis Commands

```bash
# Check CPU usage while running
xcrun simctl spawn "booted" top -l 1 | grep -i "MyApp"

# Check memory footprint
xcrun simctl spawn "booted" ps aux | grep -i "MyApp"

# Monitor file I/O in real-time
xcrun xctrace record \
    --template "File Activity" \
    --device-name "iPhone 16" \
    --scheme "MyApp" \
    --output file-io.trace
```

## Profiling Checklist

- [ ] Profile on real device (simulator results are not representative)
- [ ] Use Release configuration for profiling
- [ ] Focus on self-time, not total time
- [ ] Symbolicate traces with matching dSYM
- [ ] Record multiple traces for consistent results
- [ ] Profile the specific scenario (startup, scrolling, search)
- [ ] Compare before/after when optimizing
