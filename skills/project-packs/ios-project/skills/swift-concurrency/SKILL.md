---
name: swift-concurrency
description: Swift Concurrency review and fixes. Swift 6.2+ compliance, actor isolation, Sendable.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
model: opus
---

# Swift Concurrency Review & Fixes

## Triage Process

1. **Identify the issue category** from the table below.
2. **Read surrounding context** — understand the isolation domain.
3. **Apply the minimal fix** that satisfies the compiler and preserves intent.
4. **Verify** the fix doesn't introduce new warnings.

## Fix Table

| Issue | Fix | Example |
|-------|-----|---------|
| `@MainActor` isolation on struct View | Remove — SwiftUI views are already `@MainActor` | `struct MyView: View { }` (no annotation needed) |
| `Sendable` conformance missing on value type | Add `Sendable` to structs/enums with value properties | `struct Config: Sendable { let url: URL }` |
| `nonisolated` needed on computed property | Add `nonisolated` when accessing only `Sendable` data | `nonisolated var description: String { name }` |
| `async` in synchronous context | Use `Task { }` or `.task { }` | `.task { await store.load() }` |
| Data race on shared mutable state | Isolate with actor or `@MainActor` | `actor DataCache { var items: [String: Data] = [:] }` |
| `@escaping` closure not `@Sendable` | Add `@Sendable` to closure parameter | `func load(onComplete: @Sendable @escaping (Result) -> Void)` |
| `any` vs `some` Sendable | Prefer `some Sendable` for concrete types | `func process(_ item: some Sendable)` |
| `Task { }` inheriting actor context | Use `Task.detached { }` for non-isolated work | `Task.detached { await heavyWork() }` |

## Swift 6.2 Patterns

### Strict Concurrency

```swift
// Enable strict concurrency in build settings
// SWIFT_STRICT_CONCURRENCY = complete

// Conforming types to Sendable
struct UserPreferences: Sendable {
    let theme: String
    let notificationsEnabled: Bool
}

// Actor for shared mutable state
actor ImageCache {
    private var cache: [URL: Image] = [:]

    func get(_ url: URL) -> Image? {
        cache[url]
    }

    func set(_ image: Image, for url: URL) {
        cache[url] = image
    }
}
```

### Sending Parameter Attribute (Swift 6.1+)

```swift
// Use `sending` for parameters transferred across isolation boundaries
func process(_ data: sending Data) async -> Result {
    // data ownership is transferred; no copy needed
    return await backgroundProcessor.analyze(data)
}
```

### Region-Based Isolation

```swift
// Swift 6.2 allows mutable access within a region
// No need for full actor isolation when the compiler can prove safety
func processItems(_ items: inout [Item]) async {
    for i in indices {
        // Compiler validates no concurrent access within this region
        items[i].processed = true
    }
}
```

## Common Patterns

### View + Async Data Loading

```swift
struct DataView: View {
    @State private var items: [Item] = []
    @State private var error: Error?

    var body: some View {
        List(items) { item in
            Text(item.name)
        }
        .task {
            do {
                items = try await dataService.fetch()
            } catch {
                self.error = error
            }
        }
    }
}
```

### Actor-Based Service

```swift
actor AuthenticationService {
    private var currentUser: User?
    private var token: String?

    func login(email: String, password: String) async throws -> User {
        let response = try await api.login(email: email, password: password)
        self.token = response.token
        self.currentUser = response.user
        return response.user
    }

    func logout() {
        token = nil
        currentUser = nil
    }

    nonisolated var isAuthenticated: Bool {
        get async { await token != nil }
    }
}
```

### Async Stream

```swift
// Creating an AsyncStream from a delegate callback
func locationStream() -> AsyncStream<CLLocation> {
    AsyncStream { continuation in
        let delegate = LocationDelegate { location in
            continuation.yield(location)
        }
        continuation.onTermination = { _ in
            delegate.stopUpdating()
        }
        delegate.startUpdating()
    }
}
```

### TaskGroup for Parallel Work

```swift
func loadAllSections() async throws -> [Section] {
    try await withThrowingTaskGroup(of: Section.self) { group in
        for sectionID in sectionIDs {
            group.addTask {
                try await fetchSection(sectionID)
            }
        }

        var sections: [Section] = []
        for try await section in group {
            sections.append(section)
        }
        return sections
    }
}
```

## Migration Checklist

- [ ] `SWIFT_STRICT_CONCURRENCY = complete` in build settings
- [ ] All shared mutable state isolated with actors or `@MainActor`
- [ ] Structs/enums that cross boundaries conform to `Sendable`
- [ ] Closures passed across boundaries are `@Sendable`
- [ ] No `!` force-unwraps in async code
- [ ] Proper error propagation (not silent `try?`)
- [ ] `Task.detached` only when needed (prefer structured concurrency)
- [ ] No blocking calls on `@MainActor` (disk I/O, networking)
- [ ] `nonisolated` used for computed properties accessing only `Sendable` data
