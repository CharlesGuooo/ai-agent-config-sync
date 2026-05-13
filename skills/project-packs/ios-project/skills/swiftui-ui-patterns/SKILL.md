---
name: swiftui-ui-patterns
description: SwiftUI best practices and patterns. Tab config, screen design, component design.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
---

# SwiftUI Best Practices & Patterns

## General Rules

1. Use modern SwiftUI state management (`@Observable`, `@Bindable`, `@Environment`).
2. Follow the MV pattern — avoid ViewModels unless the view has complex coordination logic.
3. Prefer composition over deep view hierarchies.
4. Use `.task` for all async work; never block the main thread.
5. Target iOS 17+ as the baseline for all new code.

## App-Level Setup

```swift
import SwiftUI

@main
struct MyApp: App {
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
        }
    }
}
```

## Tab-Based Navigation

```swift
struct ContentView: View {
    @State private var selectedTab: Tab = .home

    enum Tab: String, CaseIterable {
        case home, search, favorites, profile
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            Tab("Home", systemImage: "house", value: .home) {
                HomeView()
            }
            Tab("Search", systemImage: "magnifyingglass", value: .search) {
                SearchView()
            }
            Tab("Favorites", systemImage: "heart", value: .favorites) {
                FavoritesView()
            }
            Tab("Profile", systemImage: "person", value: .profile) {
                ProfileView()
            }
        }
    }
}
```

## Navigation Stack Pattern

```swift
struct RecipeListView: View {
    @State private var path = NavigationPath()
    @State private var store = RecipeStore()

    var body: some View {
        NavigationStack(path: $path) {
            List(store.recipes) { recipe in
                NavigationLink(value: recipe) {
                    RecipeRow(recipe: recipe)
                }
            }
            .navigationTitle("Recipes")
            .navigationDestination(for: Recipe.self) { recipe in
                RecipeDetailView(recipe: recipe)
            }
        }
    }
}
```

## Sheet Best Practices

```swift
struct ParentView: View {
    @State private var editItem: Item?
    @State private var isNewItemPresented = false

    var body: some View {
        List {
            // Content
        }
        .sheet(item: $editItem) { item in
            NavigationStack {
                EditItemView(item: item) {
                    editItem = nil
                }
            }
        }
        .sheet(isPresented: $isNewItemPresented) {
            NavigationStack {
                NewItemView(onSave: { newItem in
                    // Handle save
                    isNewItemPresented = false
                })
            }
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button("Add Item") {
                    isNewItemPresented = true
                }
            }
        }
    }
}
```

## Search Pattern

```swift
struct SearchableView: View {
    @State private var searchText = ""
    @State private var items: [Item] = []

    var filteredItems: [Item] {
        guard !searchText.isEmpty else { return items }
        return items.filter { $0.name.localizedStandardContains(searchText) }
    }

    var body: some View {
        List(filteredItems) { item in
            ItemRow(item: item)
        }
        .searchable(text: $searchText, prompt: "Search items...")
    }
}
```

## Error Handling Pattern

```swift
struct DataView: View {
    @State private var data: [Datum]?
    @State private var error: Error?
    @State private var isLoading = false

    var body: some View {
        Group {
            if let error {
                ErrorView(error: error) {
                    await loadData()
                }
            } else if let data {
                DataContentView(data: data)
            } else {
                ProgressView()
            }
        }
        .task {
            await loadData()
        }
    }

    private func loadData() async {
        isLoading = true
        do {
            data = try await dataService.fetch()
            error = nil
        } catch {
            self.error = error
        }
        isLoading = false
    }
}
```

## Why Not MVVM in SwiftUI

MVVM adds unnecessary indirection in most SwiftUI views because:

1. **SwiftUI already owns view state** — `@State`, `@Binding`, `@Observable` handle state natively.
2. **`@Observable` replaces the ViewModel** — a plain model class with `@Observable` provides the same reactivity without a separate ViewModel layer.
3. **Testing is straightforward** — test the `@Observable` model directly; no need for ViewModel mocks.
4. **Composition is simpler** — child views receive bindings or environment values; no ViewModel coordination needed.

Use a ViewModel **only** when:
- Multiple views share complex coordination logic
- The view needs to transform data from several sources
- You need a clear boundary between UI and business logic for testing

## Common Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| `ObservableObject` + `@Published` | Use `@Observable` |
| `NavigationView` | Use `NavigationStack` |
| `onAppear { Task { } }` | Use `.task { }` |
| Massive `body` property | Extract sub-views |
| Global `@AppStorage` for session data | Use `@Environment` + `@Observable` |
| `@StateObject` | Use `@State` with `@Observable` |
| Strong reference cycles in closures | Use `[weak store]` or `[weak self]` in non-struct contexts |

## View Modifier Ordering

```swift
SomeView()
    .padding()           // spacing first
    .background(.blue)   // background
    .clipShape(.rect(cornerRadius: 12))  // shape
    .shadow(color: .black.opacity(0.1), radius: 4, y: 2)  // shadow
    .accessibilityLabel("Description")  // accessibility last
```
