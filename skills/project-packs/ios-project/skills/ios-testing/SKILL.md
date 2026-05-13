---
name: ios-testing
description: iOS testing expert. Unit, UI tests, Swift Testing, TDD.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
model: opus
disable-model-invocation: true
---

# iOS Testing Expert

## Swift Testing (Preferred)

Use Swift Testing framework for all new tests. It is the modern replacement for XCTest.

```swift
import Testing
@testable import MyApp

@Suite("RecipeStore Tests")
struct RecipeStoreTests {

    @Test("Load recipes populates the list")
    func loadRecipes() async throws {
        let store = RecipeStore(service: MockRecipeService())
        #expect(store.recipes.isEmpty)

        try await store.load()

        #expect(store.recipes.count == 3)
    }

    @Test("Toggle favorite adds and removes",
          arguments: [
            (initial: false, expected: true),
            (initial: true, expected: false),
          ])
    func toggleFavorite(initial: Bool, expected: Bool) {
        let store = RecipeStore()
        let id = Recipe.ID()

        if initial {
            store.favorites.insert(id)
        }

        store.toggleFavorite(id)

        #expect(store.favorites.contains(id) == expected)
    }

    @Test("Loading failure throws")
    func loadFailure() async {
        let store = RecipeStore(service: FailingRecipeService())

        await #expect {
            try await store.load()
        } throws: { error in
            guard let serviceError = error as? RecipeServiceError else { return false }
            return serviceError == .networkUnavailable
        }
    }
}
```

## XCTest (Legacy)

Use only for tests requiring `XCTestCase` features (UI tests, performance tests, `XCTestExpectation`).

```swift
import XCTest
@testable import MyApp

final class RecipeStoreXCTests: XCTestCase {

    var store: RecipeStore!

    override func setUp() {
        store = RecipeStore(service: MockRecipeService())
    }

    override func tearDown() {
        store = nil
    }

    func testLoadRecipes() async throws {
        try await store.load()
        XCTAssertEqual(store.recipes.count, 3)
    }

    func testPerformanceExample() throws {
        measure {
            _ = store.filteredRecipes(filter: .all)
        }
    }
}
```

## Test Patterns

### Protocol-Based Mocks

```swift
// Protocol in production code
protocol RecipeServicing: Sendable {
    func fetch() async throws -> [Recipe]
}

// Mock in test target
struct MockRecipeService: RecipeServicing {
    var result: Result<[Recipe], Error>

    func fetch() async throws -> [Recipe] {
        try result.get()
    }
}

struct FailingRecipeService: RecipeServicing {
    func fetch() async throws -> [Recipe] {
        throw RecipeServiceError.networkUnavailable
    }
}
```

### Testing @Observable Models

```swift
@Suite("CartStore")
struct CartStoreTests {
    @Test("Adding item updates total")
    func addItemUpdatesTotal() {
        let store = CartStore()
        let item = CartItem(name: "Coffee", price: 4.99)

        store.add(item)

        #expect(store.total == 4.99)
        #expect(store.items.count == 1)
    }

    @Test("Removing item restores total")
    func removeItemRestoresTotal() {
        let store = CartStore()
        let item = CartItem(name: "Coffee", price: 4.99)
        store.add(item)

        store.remove(item.id)

        #expect(store.total == 0)
        #expect(store.items.isEmpty)
    }
}
```

### Testing Async Code

```swift
@Suite("DataService")
struct DataServiceTests {
    @Test("Concurrent fetch returns merged results")
    func concurrentFetch() async throws {
        let service = DataService()

        let results = try await withThrowingTaskGroup(of: [Item].self) { group in
            for page in 1...3 {
                group.addTask { try await service.fetch(page: page) }
            }
            var all: [Item] = []
            for try await batch in group {
                all.append(contentsOf: batch)
            }
            return all
        }

        #expect(results.count == 30)
    }
}
```

## UI Tests

```swift
import XCTest

final class RecipeUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        app = XCUIApplication()
        app.launchArguments = ["--uitesting"]
        app.launch()
    }

    func testRecipeListLoads() {
        let recipeList = app.collectionViews.firstMatch
        XCTAssertTrue(recipeList.waitForExistence(timeout: 5))

        let firstRecipe = recipeList.cells.firstMatch
        XCTAssertTrue(firstRecipe.exists)
    }

    func testNavigateToRecipeDetail() {
        let recipeList = app.collectionViews.firstMatch
        recipeList.cells.firstMatch.tap()

        let detailTitle = app.staticTexts["Recipe Detail"]
        XCTAssertTrue(detailTitle.waitForExistence(timeout: 3))
    }

    func testAddToFavorites() {
        app.collectionViews.cells.firstMatch.tap()
        app.buttons["Favorite"].tap()

        app.navigationBars.buttons.firstMatch.tap()
        app.tabBars.buttons["Favorites"].tap()

        let favoritesList = app.collectionViews.firstMatch
        XCTAssertTrue(favoritesList.cells.firstMatch.waitForExistence(timeout: 3))
    }
}
```

## Test Execution

```bash
# Run all tests
xcodebuild test \
    -workspace MyApp.xcworkspace \
    -scheme "MyApp" \
    -destination "platform=iOS Simulator,name=iPhone 16"

# Run specific test suite
xcodebuild test \
    -workspace MyApp.xcworkspace \
    -scheme "MyApp" \
    -only-testing:"MyAppTests/RecipeStoreTests" \
    -destination "platform=iOS Simulator,name=iPhone 16"

# Run with verbose output
xcodebuild test \
    -workspace MyApp.xcworkspace \
    -scheme "MyApp" \
    -destination "platform=iOS Simulator,name=iPhone 16" \
    -resultBundlePath test-results \
    2>&1 | xcpretty --report junit
```

## Checklist

- [ ] New tests use Swift Testing (`@Test`, `#expect`)
- [ ] Mocks are protocol-based, not class-based
- [ ] Async tests use `async throws` properly
- [ ] No force-unwraps in test code
- [ ] UI tests use launch arguments for test mode
- [ ] Tests are independent — no shared mutable state between tests
- [ ] Edge cases covered: empty data, errors, boundary values
- [ ] Test names describe the expected behavior
