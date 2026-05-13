---
name: ios-debugger
description: iOS app build, simulator, debug support.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# iOS Debugger

## Simulator Management

```bash
# List available simulators
xcrun simctl list devices available

# List runtimes
xcrun simctl list runtimes

# Boot a specific simulator
xcrun simctl boot "iPhone 16"

# Boot by device type ID
xcrun simctl boot "com.apple.CoreSimulator.SimDeviceType.iPhone-16"

# Shutdown all simulators
xcrun simctl shutdown all

# Open Simulator.app
open -a Simulator
```

## Build Commands

```bash
# Find the project file
# Look for .xcworkspace (preferred) or .xcodeproj

# List available schemes
xcodebuild -list -workspace MyApp.xcworkspace
xcodebuild -list -project MyApp.xcodeproj

# Build for simulator
xcodebuild build \
    -workspace MyApp.xcworkspace \
    -scheme "MyApp" \
    -sdk iphonesimulator \
    -destination "platform=iOS Simulator,name=iPhone 16" \
    -configuration Debug \
    build

# Build with detailed output
xcodebuild build \
    -workspace MyApp.xcworkspace \
    -scheme "MyApp" \
    -destination "platform=iOS Simulator,name=iPhone 16" \
    2>&1 | xcpretty

# Clean build
xcodebuild clean \
    -workspace MyApp.xcworkspace \
    -scheme "MyApp" \
    -destination "platform=iOS Simulator,name=iPhone 16"
```

## Install & Launch

```bash
# Find the built .app
find ~/Library/Developer/Xcode/DerivedData -name "MyApp.app" -type d | head -1

# Install to simulator
xcrun simctl install "booted" /path/to/MyApp.app

# Launch app by bundle ID
xcrun simctl launch "booted" com.example.MyApp

# Terminate app
xcrun simctl terminate "booted" com.example.MyApp
```

## Log Capture

```bash
# Stream console logs for the app
xcrun simctl spawn "booted" log stream \
    --predicate 'subsystem == "com.example.MyApp"' \
    --level debug

# System log stream
xcrun simctl spawn "booted" log stream

# Capture to file
xcrun simctl spawn "booted" log stream \
    --predicate 'process == "MyApp"' \
    > app_logs.txt
```

## UI Operations via simctl

```bash
# Take a screenshot
xcrun simctl io "booted" screenshot screenshot.png

# Record a video
xcrun simctl io "booted" recordVideo recording.mov
# Press Ctrl+C to stop

# Set appearance
xcrun simctl ui "booted" appearance dark

# Add photos to simulator
xcrun simctl addmedia "booted" photo.jpg

# Open URL in simulator
xcrun simctl openurl "booted" "myapp://deep-link"

# Set location
xcrun simctl location "booted" set 37.7749,-122.4194

# Trigger push notification (requires apns file)
xcrun simctl push "booted" com.example.MyApp push.json
```

## Diagnostic Workflows

### Build Failure Diagnosis

1. Run `xcodebuild build` and capture output.
2. Identify the first error (not warnings).
3. Read the file and line number mentioned.
4. Check for common issues: missing imports, type mismatches, stale derived data.
5. If "no such module", run `xcodebuild resolvePackageDependencies`.

### Runtime Crash Diagnosis

1. Check console logs via `log stream`.
2. Look for `SIGABRT`, `EXC_BAD_ACCESS`, or Swift errors.
3. Read the crash location in the source code.
4. Check for force-unwraps, invalid index access, unhandled async errors.

### Stale Build Issues

```bash
# Nuclear option: clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/MyApp-*

# Clean build folder
xcodebuild clean -workspace MyApp.xcworkspace -scheme "MyApp"

# Reset simulator content
xcrun simctl erase all
```
