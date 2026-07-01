# Live Activity + Dynamic Island branch

Requires `NSSupportsLiveActivities = YES` in Info.plist. Remember the red-lines
(renewal-first ~8h+4h; Dynamic Island = iPhone 14 Pro+; system-controlled animation).

```swift
struct PetAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable { var poseImagePath: String; var endsAt: Date }
    var petName: String
}

// Start (in-app):
let content = ActivityContent(state: .init(poseImagePath: path, endsAt: end), staleDate: end)
let activity = try Activity.request(attributes: PetAttributes(petName: "Miso"),
                                    content: content, pushType: nil)
// Update / end:
await activity.update(content); await activity.end(content, dismissalPolicy: .default)
```

Implement **all three Dynamic Island states** (compact / minimal / expanded). Use
`Text(timerInterval:)` for live-looking time without spending refresh budget.

```swift
struct PetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PetAttributes.self) { ctx in
            PetBanner(state: ctx.state)            // lock-screen banner (still pose)
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading)  { PetPose(ctx.state) }
                DynamicIslandExpandedRegion(.trailing) { Text(timerInterval: Date.now...ctx.state.endsAt) }
            } compactLeading:  { PetPose(ctx.state) }
              compactTrailing: { Text(ctx.state.endsAt, style: .timer).frame(maxWidth: 44) }
              minimal:         { PetPose(ctx.state) }
        }
    }
}
```
