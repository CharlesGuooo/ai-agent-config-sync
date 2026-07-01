# WidgetKit — widget branch

Families: home `systemSmall/Medium/Large/extraLarge`; lock-screen
`accessoryRectangular / accessoryCircular / accessoryInline`. `StaticConfiguration` for
fixed widgets; `AppIntentConfiguration` for user-configurable ones. Remember the red-lines
(static snapshot; App Group images; sparse refresh).

```swift
struct PetEntry: TimelineEntry { let date: Date; let poseImagePath: String }

struct PetProvider: TimelineProvider {
    func placeholder(in: Context) -> PetEntry { .init(date: .now, poseImagePath: "") }
    func getSnapshot(in c: Context, completion: @escaping (PetEntry) -> Void) { completion(placeholder(in: c)) }
    func getTimeline(in: Context, completion: @escaping (Timeline<PetEntry>) -> Void) {
        let entries = nextPoses()          // a few pre-baked frames; refresh sparingly
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

struct PetWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PetWidget", provider: PetProvider()) { entry in
            Image(uiImage: UIImage(contentsOfFile: entry.poseImagePath) ?? UIImage())
                .resizable().scaledToFit()
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .supportedFamilies([.systemSmall, .accessoryRectangular, .accessoryCircular])
    }
}
```

**Interactive widget (iOS 17+)** — a `Button`/`Toggle` bound to an `AppIntent` runs without
opening the app:

```swift
struct FeedPetIntent: AppIntent {
    static var title: LocalizedStringResource = "Feed"
    func perform() async throws -> some IntentResult { PetStore.feed(); return .result() }
}
// in the widget view:  Button(intent: FeedPetIntent()) { Image(systemName: "fork.knife") }
```
