---
name: swiftui-components
description: SwiftUI component design and implementation. View creation, layout, animation, accessibility.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
---

# SwiftUI Component Design & Implementation

## Core Principles

1. Use `@Observable` (not `ObservableObject`/`@Published`) for all new code targeting iOS 17+.
2. Prefer `NavigationStack` over `NavigationView`.
3. Follow the MV (Model-View) pattern by default; only introduce a ViewModel when the view has significant logic.
4. Keep views small and focused — each view should do one thing well.
5. Use composition over inheritance.

## View Property Ordering Standard

Properties inside a SwiftUI view struct must appear in this order:

```swift
struct ProductListView: View {
    // 1. Environment
    @Environment(\.dismiss) private var dismiss
    @Environment(CartStore.self) private var cartStore

    // 2. Dependencies passed via init
    let productCategory: ProductCategory

    // 3. State
    @State private var products: [Product] = []
    @State private var isLoading = false
    @State private var searchText = ""

    // 4. Computed properties
    private var filteredProducts: [Product] {
        if searchText.isEmpty { return products }
        return products.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }

    // 5. Body
    var body: some View {
        // ...
    }
}
```

## State Management Reference

| Use Case | Property Wrapper | Notes |
|----------|-----------------|-------|
| UI-only state in this view | `@State` | Value types, simple toggles |
| Shared state across views | `@Observable` + `@Environment` | Inject via `.environment()` |
| State owned by parent, passed down | Bindable property | `@Binding` or `Bindable` |
| Async data loading | `@State` + `.task` | Never in init |
| Navigation destination | `@State` path | `NavigationLink(value:)` |
| Alert / sheet presentation | `@State` item | `.alert(item:)`, `.sheet(item:)` |

## MV Pattern Example

```swift
// Model
@Observable
final class RecipeStore {
    private(set) var recipes: [Recipe] = []
    var favorites: Set<Recipe.ID> = []

    func loadRecipes() async throws {
        recipes = try await recipeService.fetch()
    }

    func toggleFavorite(_ id: Recipe.ID) {
        if favorites.contains(id) {
            favorites.remove(id)
        } else {
            favorites.insert(id)
        }
    }
}

// View
struct RecipeListView: View {
    @State private var store = RecipeStore()
    @State private var isLoading = false

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading recipes...")
            } else {
                List(store.recipes) { recipe in
                    RecipeRow(recipe: recipe, isFavorite: store.favorites.contains(recipe.id)) {
                        store.toggleFavorite(recipe.id)
                    }
                }
            }
        }
        .task {
            isLoading = true
            try? await store.loadRecipes()
            isLoading = false
        }
    }
}
```

## Sheet Patterns

```swift
struct ParentView: View {
    @State private var selectedItem: Item?
    @State private var isPresentingSettings = false

    var body: some View {
        List(items) { item in
            ItemRow(item: item)
                .onTapGesture { selectedItem = item }
        }
        .sheet(item: $selectedItem) { item in
            ItemDetailView(item: item)
        }
        .sheet(isPresented: $isPresentingSettings) {
            SettingsView()
        }
    }
}
```

## Animation Guidelines

```swift
// Implicit animation for simple state changes
.withAnimation(.easeInOut(duration: 0.3)) {
    isExpanded.toggle()
}

// Explicit animation for coordinated changes
@State private var scale = 1.0

var body: some View {
    Circle()
        .scaleEffect(scale)
        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: scale)
        .onTapGesture {
            scale = scale == 1.0 ? 1.3 : 1.0
        }
}

// PhaseAnimator for multi-step sequences
PhaseAnimator([false, true]) { phase in
    RoundedRectangle(cornerRadius: phase ? 20 : 8)
        .fill(phase ? .blue : .red)
        .frame(width: phase ? 100 : 60, height: phase ? 100 : 60)
}
```

## Accessibility

Every interactive view must include accessibility support:

```swift
Button(action: { store.addToCart(product) }) {
    Image(systemName: "cart.badge.plus")
}
.accessibilityLabel("Add \(product.name) to cart")
.accessibilityHint("Adds this item to your shopping cart")
.accessibilityAddTraits(.isButton)

// Group related elements
VStack(alignment: .leading) {
    Text(product.name)
        .font(.headline)
    Text(product.price, format: .currency(code: "USD"))
        .foregroundStyle(.secondary)
}
.accessibilityElement(children: .combine)
.accessibilityLabel("\(product.name), \(product.price.formatted(.currency(code: "USD")))")
```

## Component Checklist

- [ ] Uses `@Observable`, not `ObservableObject`
- [ ] Properties follow ordering standard
- [ ] View is under 50 lines of body code (decompose if larger)
- [ ] Uses `.task` for async data loading
- [ ] Includes accessibility labels and hints
- [ ] Has `#Preview` block
- [ ] No force-unwraps or global state
- [ ] Uses `NavigationStack` (not `NavigationView`)
