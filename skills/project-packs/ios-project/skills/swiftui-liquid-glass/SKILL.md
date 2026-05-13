---
name: swiftui-liquid-glass
description: iOS 26+ Liquid Glass API implementation and review.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
---

# iOS 26+ Liquid Glass API

## Core Guidelines

1. Always guard Liquid Glass usage with `#available(iOS 26, *)` checks.
2. Provide a fallback material-based design for iOS 17–25.
3. Use Liquid Glass as a **subtle enhancement**, not the primary visual element.
4. Respect user accessibility settings — some users may find glass effects distracting.

## Glass Shape Options

```swift
if #available(iOS 26, *) {
    // Capsule glass pill
    .glassEffect(.capsule)

    // Rectangular glass panel
    .glassEffect(.rect(cornerRadius: 16))

    // Circle glass button
    .glassEffect(.circle)

    // Custom continuous corner shape
    .glassEffect(.rect(cornerRadius: 24, style: .continuous))
} else {
    // Fallback with materials
    .background(.ultraThinMaterial, in: .rect(cornerRadius: 16))
}
```

## Button Glass

```swift
struct GlassActionButton: View {
    let title: String
    let systemImage: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .font(.headline)
                .padding(.horizontal, 24)
                .padding(.vertical, 14)
        }
        .if_iOS26 { view in
            view.glassEffect(.capsule)
        } fallback: { view in
            view
                .background(.blue)
                .foregroundStyle(.white)
                .clipShape(Capsule())
        }
    }
}
```

## Navigation Bar Glass

```swift
struct GlassNavigationView: View {
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            ContentView()
                .navigationTitle("Home")
        }
        .if_iOS26 { view in
            view.glassEffect(.rect(cornerRadius: 0))
        } fallback: { view in
            view
        }
    }
}
```

## Tab Bar Glass

```swift
TabView {
    Tab("Home", systemImage: "house") {
        HomeView()
    }
    Tab("Explore", systemImage: "compass") {
        ExploreView()
    }
}
.if_iOS26 { view in
    view.glassEffect(.rect(cornerRadius: 0))
} fallback: { view in
    view
}
```

## Glass Overlay Cards

```swift
struct InfoCard: View {
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding()
        .if_iOS26 { view in
            view.glassEffect(.rect(cornerRadius: 20))
        } fallback: { view in
            view
                .background(.ultraThinMaterial)
                .clipShape(.rect(cornerRadius: 20))
        }
    }
}
```

## Availability Helper

Use a conditional modifier helper to keep code clean:

```swift
extension View {
    @ViewBuilder
    func if_iOS26<Content: View>(
        _ transform: (Self) -> Content,
        fallback: (Self) -> some View = { $0 }
    ) -> some View {
        if #available(iOS 26, *) {
            transform(self)
        } else {
            fallback(self)
        }
    }
}
```

## Review Checklist

- [ ] All Liquid Glass code guarded with `#available(iOS 26, *)`
- [ ] Fallback uses `.ultraThinMaterial` or similar
- [ ] Glass effects don't interfere with text readability
- [ ] Accessibility: glass doesn't reduce contrast below WCAG guidelines
- [ ] No glass on glass (avoid stacking glass effects)
- [ ] Glass shapes match the surrounding UI language
- [ ] Performance tested with multiple glass elements on screen
- [ ] Dark mode appearance verified
