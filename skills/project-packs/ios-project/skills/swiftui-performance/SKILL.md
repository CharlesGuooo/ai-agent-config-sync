---
name: swiftui-performance
description: SwiftUI performance diagnosis and optimization. View redraw, rendering, memory.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
model: opus
---

# SwiftUI Performance Diagnosis & Optimization

## Code-First Review Approach

Always start by reading the code before reaching for Instruments. Most performance issues are visible in the source.

## Common Performance Smells

| Smell | Impact | Fix |
|-------|--------|-----|
| Large `@Observable` class with many properties | Excessive redraws | Split into focused stores |
| `@State` used for derived data | Unnecessary state | Use computed properties |
| `List` inside `ScrollView` | Conflicting scroll | Use `List` alone or `LazyVStack` in `ScrollView` |
| `ScrollView` + `VStack` with many items | All items loaded | Use `LazyVStack` / `LazyVGrid` |
| `.onChange(of: optional)` with frequent changes | Redraw storms | Debounce or filter meaningful changes |
| Heavy computation in `body` or computed properties | Main thread blocks | Move to `.task` or background |
| Image loading without caching | Memory spikes | Use `AsyncImage` with cache or `CachedAsyncImage` |
| `.id()` forcing full rebuild | Unnecessary rebuilds | Remove `.id()` or use stable identifiers |
| Nested `@Observable` objects with deep key paths | Propagation overhead | Flatten key paths or use `@ObservationIgnored` |

## Remediation Examples

### Split Large Observable Stores

```swift
// BAD: One giant store triggers redraws everywhere
@Observable
final class AppStore {
    var user: User?
    var feed: [Post] = []
    var notifications: [Notification] = []
    var settings = Settings()
}

// GOOD: Focused stores, only relevant views redraw
@Observable
final class FeedStore {
    private(set) var posts: [Post] = []
    func load() async { /* ... */ }
}

@Observable
final class SettingsStore {
    var appearance: Appearance = .system
    var notificationsEnabled = true
}
```

### Lazy Containers

```swift
// BAD: All 1000 items rendered immediately
ScrollView {
    VStack {
        ForEach(items) { item in
            HeavyItemView(item: item)
        }
    }
}

// GOOD: Lazy rendering
ScrollView {
    LazyVStack(spacing: 12) {
        ForEach(items) { item in
            HeavyItemView(item: item)
        }
    }
}
```

### Avoid Rebuilding from .id()

```swift
// BAD: Changes timestamp every second, full rebuild
List(messages) { msg in
    MessageRow(msg: msg)
}
.id(refreshCounter)

// GOOD: Use identifiable, stable IDs
List(messages) { msg in
    MessageRow(msg: msg)
}
```

### Image Optimization

```swift
// BAD: Full-resolution images loaded into memory
AsyncImage(url: URL(string: imageURL))

// GOOD: Downsampled with caching
struct CachedImageView: View {
    let url: URL
    @State private var image: Image?

    var body: some View {
        Group {
            if let image {
                image
                    .resizable()
                    .aspectRatio(contentMode: .fit)
            } else {
                ProgressView()
            }
        }
        .task {
            self.image = await ImageCache.shared.load(url: url, downsampleTo: CGSize(width: 300, height: 300))
        }
    }
}
```

## Profiling with Instruments

When code review isn't sufficient, use Instruments:

```bash
# Record a Time Profiler trace
xcrun xctrace record \
    --template "Time Profiler" \
    --device-name "iPhone 16" \
    --scheme "MyApp" \
    --output recording.trace

# View the trace
open recording.trace
```

### SwiftUI View Body Count

In Xcode:
1. Run app with the **SwiftUI** Instruments template
2. Enable **View Body Count** instrument
3. Navigate through the app
4. Look for views with high body call counts relative to interaction

### Memory Graph

1. Run app in Xcode debugger
2. Navigate to the problematic screen
3. Debug → Memory Graph
4. Look for retain cycles, especially:
   - Closures capturing `self` in `@Observable` classes
   - Timer objects not invalidated
   - Delegates with strong references

## Performance Checklist

- [ ] No large `@Observable` stores doing double-duty
- [ ] Lazy containers for long lists
- [ ] Images downsampled and cached
- [ ] No heavy computation in view `body`
- [ ] No `.id()` forcing full rebuilds
- [ ] `@ObservationIgnored` on non-UI properties
- [ ] Computed properties for derived data (not `@State`)
- [ ] `.task` for async work, not `.onAppear`
- [ ] View decomposition for complex screens
- [ ] Tested on real device (not just simulator)
