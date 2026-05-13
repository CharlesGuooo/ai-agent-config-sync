---
name: ios-foundation-models
description: iOS 26 Foundation Models, Apple Intelligence, HealthKit State of Mind, Swift Charts, StoreKit 2.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
---

# iOS 26 Foundation Models & Modern APIs

## Foundation Models

### @Generable Macro

Use `@Generable` to define types the on-device model can produce:

```swift
import FoundationModels

@Generable
struct RecipeSuggestion: Sendable {
    var title: String
    var ingredients: [String]
    var cookTime: Int
    var difficulty: Difficulty

    @GenerableEnum
    enum Difficulty: String, CaseIterable {
        case easy, medium, hard
    }
}
```

### LanguageModelSession

```swift
import FoundationModels

@Observable
final class RecipeAssistant {
    var suggestion: RecipeSuggestion?
    var isGenerating = false
    var error: Error?

    private var session: LanguageModelSession?

    func generateSuggestion(availableIngredients: [String]) async {
        guard FoundationModelAvailability.isAvailable else {
            error = FoundationError.unavailable
            return
        }

        isGenerating = true
        defer { isGenerating = false }

        let session = LanguageModelSession()
        self.session = session

        let prompt = """
        Suggest a recipe using these ingredients: \(availableIngredients.joined(separator: ", ")).
        """

        do {
            let result = try await session.generate(
                RecipeSuggestion.self,
                from: prompt
            )
            suggestion = result
        } catch {
            self.error = error
        }
    }
}
```

### Streaming Generation

```swift
func streamRecipe() async {
    let session = LanguageModelSession()

    do {
        let stream = session.stream(RecipeSuggestion.self, from: "Quick dinner idea")
        for try await partial in stream {
            suggestion = partial
        }
    } catch {
        self.error = error
    }
}
```

### Availability Check

```swift
import FoundationModels

func checkAvailability() -> Bool {
    FoundationModelAvailability.isAvailable
}

// In view
struct AIView: View {
    @State private var isAvailable = false

    var body: some View {
        Group {
            if isAvailable {
                AIContentView()
            } else {
                Text("Apple Intelligence is not available on this device.")
                    .foregroundStyle(.secondary)
            }
        }
        .task {
            isAvailable = FoundationModelAvailability.isAvailable
        }
    }
}
```

## HealthKit State of Mind (iOS 18+)

```swift
import HealthKit

@Observable
final class MoodTracker {
    private let healthStore = HKHealthStore()

    var isAuthorized = false
    var recentMoods: [HKCategorySample] = []

    func requestAuthorization() async throws {
        let types: Set<HKSampleType> = [
            HKObjectType.categoryType(forIdentifier: .stateOfMind)!
        ]

        try await healthStore.requestAuthorization(toShare: types, read: types)
        isAuthorized = true
    }

    func logMood(valence: Double, associations: [HKStateOfMindAssociation] = []) async throws {
        let stateOfMind = HKStateOfMind(
            valence: valence,
            associations: associations,
            startDate: .now,
            endDate: .now
        )

        try await healthStore.save(stateOfMind)
    }

    func fetchRecentMoods() async throws {
        let predicate = HKQuery.predicateForSamples(
            withStart: Calendar.current.date(byAdding: .day, value: -7, to: .now),
            end: .now
        )

        let query = HKSampleQuery(
            descriptor: HKSampleDescriptor(
                sampleType: HKObjectType.categoryType(forIdentifier: .stateOfMind)!,
                predicate: predicate,
                sortDescriptors: [SortDescriptor(\.startDate, order: .reverse)],
                limit: 30
            )
        ) { _, samples, _ in
            self.recentMoods = (samples as? [HKCategorySample]) ?? []
        }

        healthStore.execute(query)
    }
}
```

## Swift Charts

```swift
import Charts

struct MoodChartView: View {
    let moods: [MoodEntry]

    var body: some View {
        Chart(moods) { mood in
            LineMark(
                x: .value("Date", mood.date),
                y: .value("Valence", mood.valence)
            )
            .foregroundStyle(.blue.gradient)
            .interpolationMethod(.catmullRom)

            AreaMark(
                x: .value("Date", mood.date),
                y: .value("Valence", mood.valence)
            )
            .foregroundStyle(.blue.opacity(0.1))
            .interpolationMethod(.catmullRom)
        }
        .chartYScale(domain: -1...1)
        .chartXAxis {
            AxisMarks(values: .stride(by: .day)) { _ in
                AxisGridLine()
                AxisValueLabel(format: .dateTime.weekday(.abbreviated))
            }
        }
        .frame(height: 200)
        .padding()
    }
}
```

## StoreKit 2

```swift
import StoreKit

@Observable
final class StoreManager {
    var products: [Product] = []
    var purchasedIDs: Set<String> = []
    var isLoading = false

    private var transactionListener: Task<Void, Never>?

    func loadProducts() async {
        isLoading = true
        products = try? await Product.products(for: ["com.app.premium", "com.app.subscription"])
        isLoading = false
    }

    func purchase(_ product: Product) async throws -> StoreKit.Transaction? {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            purchasedIDs.insert(transaction.productID)
            await transaction.finish()
            return transaction
        case .userCancelled, .pending:
            return nil
        @unknown default:
            return nil
        }
    }

    private func checkVerified(_ result: VerificationResult<StoreKit.Transaction>) throws -> StoreKit.Transaction {
        switch result {
        case .unverified(_, let error):
            throw error
        case .verified(let transaction):
            return transaction
        }
    }
}
```

## Swift 6 Concurrency Notes

- All Foundation Model types are `Sendable`.
- `LanguageModelSession` is `@MainActor`-isolated.
- Use `async throws` for all generation calls.
- Stream results with `for try await` in an async context.

## Architecture Patterns

- Wrap Foundation Models in an `@Observable` store/service.
- Inject the service via `@Environment` for testability.
- Use protocols to enable mock services in previews and tests.
- Keep UI layer unaware of Foundation Models internals.
