---
name: swiftui-view-refactor
description: SwiftUI view refactoring. Structural consistency, DI, Observation standardization.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
---

# SwiftUI View Refactoring

## View Ordering Standard

All SwiftUI views must follow this property order:

```swift
struct ExampleView: View {
    // 1. Environment
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    // 2. Dependencies (init parameters)
    let item: Item
    let onSelect: (Item) -> Void

    // 3. @State
    @State private var isExpanded = false
    @State private var opacity = 1.0

    // 4. Computed properties
    private var title: String {
        item.name.uppercased()
    }

    // 5. Body
    var body: some View {
        // Implementation
    }
}
```

## MV Pattern Priority

When refactoring, apply the MV pattern in this priority order:

1. **Model owns data and business logic** — `@Observable` class with computed properties and mutation methods.
2. **View owns presentation** — SwiftUI struct with `@State` for UI-only state, `@Environment` for shared state.
3. **Extract ViewModel only when necessary** — complex coordination across multiple data sources.

```swift
// GOOD: Model-View, no ViewModel needed
@Observable
final class PlaylistStore {
    private(set) var playlists: [Playlist] = []
    var filter: PlaylistFilter = .all

    var filteredPlaylists: [Playlist] {
        switch filter {
        case .all: playlists
        case .favorites: playlists.filter(\.isFavorite)
        }
    }

    func load() async throws { /* ... */ }
    func toggleFavorite(_ id: Playlist.ID) { /* ... */ }
}

struct PlaylistListView: View {
    @State private var store = PlaylistStore()

    var body: some View {
        List(store.filteredPlaylists) { playlist in
            PlaylistRow(playlist: playlist)
        }
        .task { try? await store.load() }
    }
}
```

## Large Body Decomposition

When `body` exceeds 40-50 lines, extract sub-views:

```swift
// BEFORE: Monolithic view (80+ lines)
struct ProfileView: View {
    @State private var user: User?
    @State private var posts: [Post] = []

    var body: some View {
        ScrollView {
            VStack {
                // 30 lines of avatar + stats
                // 20 lines of bio section
                // 30 lines of post list
            }
        }
    }
}

// AFTER: Decomposed
struct ProfileView: View {
    @State private var user: User?
    @State private var posts: [Post] = []

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                ProfileHeaderView(user: user)
                ProfileBioView(bio: user?.bio)
                PostListView(posts: posts)
            }
        }
    }
}
```

## ObservableObject → @Observable Migration

```swift
// BEFORE: Legacy ObservableObject
class PlaylistViewModel: ObservableObject {
    @Published var playlists: [Playlist] = []
    @Published var isLoading = false
}

struct PlaylistView: View {
    @StateObject private var viewModel = PlaylistViewModel()
}

// AFTER: Modern @Observable
@Observable
final class PlaylistStore {
    private(set) var playlists: [Playlist] = []
    var isLoading = false
}

struct PlaylistView: View {
    @State private var store = PlaylistStore()
}
```

## Existing ViewModel Handling

When a codebase already uses ViewModels:

1. **Don't rewrite working ViewModels** — only migrate when modifying the file for other reasons.
2. **New code uses MV pattern** — no new ViewModels unless justified by complexity.
3. **Gradual migration path**:
   - Rename `*ViewModel` → `*Store` when migrating
   - Remove `ObservableObject` conformance
   - Remove `@Published` wrappers
   - Add `@Observable` macro
   - Update views: `@StateObject` → `@State`, `@ObservedObject` → `@Bindable` or `@Environment`

## Dependency Injection Patterns

```swift
// Protocol-based DI for testability
protocol RecipeServicing {
    func fetch() async throws -> [Recipe]
}

@Observable
final class RecipeStore {
    private let service: RecipeServicing
    private(set) var recipes: [Recipe] = []

    init(service: RecipeServicing = RecipeService()) {
        self.service = service
    }

    func load() async throws {
        recipes = try await service.fetch()
    }
}

// In preview
#Preview {
    RecipeListView(store: RecipeStore(service: MockRecipeService()))
}
```

## Refactor Checklist

- [ ] Properties follow ordering standard
- [ ] No `ObservableObject` / `@Published` (migrate to `@Observable`)
- [ ] No `@StateObject` / `@ObservedObject` (use `@State` / `@Environment`)
- [ ] `body` under 50 lines (extract sub-views if needed)
- [ ] Uses `.task` instead of `onAppear { Task { } }`
- [ ] No `NavigationView` (use `NavigationStack`)
- [ ] Sub-views extracted for reusable pieces
- [ ] Each view has a single responsibility
- [ ] `#Preview` block present and functional
