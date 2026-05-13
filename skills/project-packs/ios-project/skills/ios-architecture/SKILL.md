---
name: ios-architecture
description: iOS app architecture design and review. MVVM, MV, Clean Architecture, module splitting.
allowed-tools:
  - Read
  - Grep
  - Glob
---

# iOS Architecture Design & Review

## Architecture Patterns

### MV (Model-View) — Recommended Default

```swift
// Model: @Observable class with data + logic
@Observable
final class RecipeStore {
    private(set) var recipes: [Recipe] = []
    var searchText = ""

    var filteredRecipes: [Recipe] {
        guard !searchText.isEmpty else { return recipes }
        return recipes.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }

    func load() async throws {
        recipes = try await service.fetch()
    }
}

// View: SwiftUI view using the model
struct RecipeListView: View {
    @State private var store = RecipeStore()

    var body: some View {
        List(store.filteredRecipes) { recipe in
            RecipeRow(recipe: recipe)
        }
        .searchable(text: $store.searchText)
        .task { try? await store.load() }
    }
}
```

**When to use:** Most screens, simple data flows, CRUD operations.

### MVVM (Model-View-ViewModel) — For Complex Screens

```swift
@Observable
final class OrderViewModel {
    let orderService: OrderServicing
    let paymentService: PaymentServicing
    let analytics: AnalyticsTracking

    private(set) var cart: [CartItem] = []
    private(set) var subtotal: Decimal = 0
    private(set) var tax: Decimal = 0
    private(set) var total: Decimal = 0
    private(set) var isProcessing = false
    private(set) var error: OrderError?

    init(orderService: OrderServicing, paymentService: PaymentServicing, analytics: AnalyticsTracking) {
        self.orderService = orderService
        self.paymentService = paymentService
        self.analytics = analytics
    }

    func addToCart(_ item: MenuItem) {
        cart.append(CartItem(item: item))
        recalculate()
    }

    func checkout() async {
        isProcessing = true
        defer { isProcessing = false }

        do {
            let token = try await paymentService.createToken()
            let order = try await orderService.submit(cart: cart, paymentToken: token)
            analytics.track(.orderPlaced(order.id))
        } catch {
            self.error = .checkoutFailed(error)
        }
    }

    private func recalculate() {
        subtotal = cart.reduce(0) { $0 + $1.price }
        tax = subtotal * 0.08
        total = subtotal + tax
    }
}
```

**When to use:** Multiple service coordination, complex business logic, checkout flows.

### Clean Architecture — For Large Modular Apps

```
App/
├── Domain/
│   ├── Entities/
│   │   └── Recipe.swift
│   ├── UseCases/
│   │   └── FetchRecipesUseCase.swift
│   └── Repositories/
│       └── RecipeRepository.swift
├── Data/
│   ├── Repositories/
│   │   └── DefaultRecipeRepository.swift
│   ├── Network/
│   │   └── RecipeAPI.swift
│   └── Persistence/
│       └── RecipeCache.swift
└── Presentation/
    ├── Views/
    │   └── RecipeListView.swift
    └── Stores/
        └── RecipeStore.swift
```

**When to use:** Teams of 5+, shared domain logic, multiple presentation layers.

## Module Design

### Feature-Based Modules (Recommended)

```
MyApp/
├── App/
│   ├── MyAppApp.swift
│   └── ContentView.swift
├── Features/
│   ├── Recipes/
│   │   ├── RecipeListView.swift
│   │   ├── RecipeDetailView.swift
│   │   ├── RecipeStore.swift
│   │   └── RecipeRow.swift
│   ├── Profile/
│   │   ├── ProfileView.swift
│   │   └── ProfileStore.swift
│   └── Search/
│       ├── SearchView.swift
│       └── SearchStore.swift
├── Shared/
│   ├── Components/
│   │   ├── LoadingView.swift
│   │   └── ErrorView.swift
│   ├── Extensions/
│   └── Utilities/
└── Services/
    ├── NetworkService.swift
    └── PersistenceService.swift
```

### SPM Module Split

```swift
// Package.swift structure for modular app
.target(name: "AppCore", dependencies: []),
.target(name: "RecipeFeature", dependencies: ["AppCore"]),
.target(name: "ProfileFeature", dependencies: ["AppCore"]),
.target(name: "SharedUI", dependencies: ["AppCore"]),
.target(name: "MyApp", dependencies: ["RecipeFeature", "ProfileFeature", "SharedUI"])
```

## Dependency Injection

### Environment-Based (Recommended for SwiftUI)

```swift
// Register in App
@main
struct MyApp: App {
    @State private var recipeStore = RecipeStore()
    @State private var authStore = AuthStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(recipeStore)
                .environment(authStore)
        }
    }
}

// Consume in views
struct RecipeListView: View {
    @Environment(RecipeStore.self) private var store

    var body: some View {
        List(store.recipes) { recipe in
            RecipeRow(recipe: recipe)
        }
    }
}
```

### Protocol-Based (For Testability)

```swift
protocol RecipeServicing: Sendable {
    func fetch() async throws -> [Recipe]
    func save(_ recipe: Recipe) async throws
}

@Observable
final class RecipeStore {
    let service: RecipeServicing
    private(set) var recipes: [Recipe] = []

    init(service: RecipeServicing = LiveRecipeService()) {
        self.service = service
    }
}
```

## Data Layer

### SwiftData (iOS 17+)

```swift
import SwiftData

@Model
final class Recipe {
    var name: String
    var cookTime: Int
    var ingredients: [Ingredient]
    var createdAt: Date

    init(name: String, cookTime: Int, ingredients: [Ingredient] = []) {
        self.name = name
        self.cookTime = cookTime
        self.ingredients = ingredients
        self.createdAt = .now
    }
}
```

### Core Data (Legacy)

```swift
// Use only if SwiftData is not viable
// Required for: CloudKit sync with existing stack, complex migrations
```

## Navigation Architecture

```swift
// App-level coordinator
@Observable
final class NavigationCoordinator {
    var path = NavigationPath()

    func navigate(to destination: Destination) {
        path.append(destination)
    }

    func goBack() {
        path.removeLast()
    }

    func goToRoot() {
        path.removeLast(path.count)
    }

    enum Destination: Hashable {
        case recipe(Recipe)
        case settings
        case profile
    }
}
```

## Review Checklist

- [ ] Architecture pattern matches project complexity
- [ ] Feature-based module structure (not layer-based)
- [ ] DI via `@Environment` for stores
- [ ] Protocols for services (testability)
- [ ] SwiftData for new projects (Core Data only if required)
- [ ] Navigation uses `NavigationStack` with typed destinations
- [ ] No circular dependencies between modules
- [ ] Clear separation between data, domain, and presentation
