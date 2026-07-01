---
name: widgetkit-liveactivity
description: Build or review iOS home/lock-screen widgets (WidgetKit), Live Activities (ActivityKit), and Dynamic Island. Use whenever the task involves a widget, "锁屏小组件", timeline provider, Live Activity, "灵动岛"/Dynamic Island, an interactive widget button, or showing live status on the lock screen. Encodes the hard system limits so you don't design something the OS won't run.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
---

# WidgetKit · Live Activity · Dynamic Island

Widgets and Live Activities are **not** miniature apps — they are system-scheduled,
heavily constrained surfaces. Most wasted effort here comes from designing something the
OS silently refuses to run. Internalize the hard limits below FIRST, then build.

**Pull live API details with the `context7` MCP** (WidgetKit / ActivityKit / DynamicIsland
/ AppIntents) rather than trusting memory — these APIs move every release. This skill
fixes the *shape*, the *limits*, and a *known-good skeleton*; context7 fills current syntax.

## Hard limits — design within these or it won't work

**WidgetKit**
- A widget renders a **static timeline snapshot**, not a live view. **No realtime
  rendering**: no Metal/SceneKit/SpriteKit, no Lottie/Rive, no video/GIF/APNG.
- Refresh is **system-throttled** (~40–70 timeline reloads/day in practice). Budget it;
  don't assume per-minute updates.
- The only "motion" you get: number rollovers, an A↔B state cross-fade, and
  `Text(timerInterval:)` / `Text(_:style:.timer)` system-driven countup/countdown text.
  `TimelineView` high-rate animation is unreliable in a widget.
- Images must come from the **App Group container** (`UIImage(contentsOfFile:)`) — you
  cannot fetch remote images at render time.

**Live Activity / ActivityKit / Dynamic Island**
- Requires `NSSupportsLiveActivities = YES` in Info.plist.
- Lifespan ≈ **8h active + 4h stale ≈ 12h max** — there is **no true 24h persistent**
  activity; plan re-arming/renewal, and expect users to see it end.
- Dynamic Island renders **only on iPhone 14 Pro and later** (and matching simulators) —
  test on the right device.
- Animations are capped (~2s) and **system-controlled** (your `withAnimation` is largely
  ignored). In **Always-On** (`isLuminanceReduced == true`) animation is disabled — design
  a still pose that reads well.

## WidgetKit skeleton

Widget families: home `systemSmall/Medium/Large/extraLarge`; **lock-screen
`accessoryRectangular / accessoryCircular / accessoryInline`**. `StaticConfiguration` for
fixed widgets; `AppIntentConfiguration` for user-configurable ones.

```swift
struct PetEntry: TimelineEntry { let date: Date; let poseImagePath: String }

struct PetProvider: TimelineProvider {
    func placeholder(in: Context) -> PetEntry { .init(date: .now, poseImagePath: "") }
    func getSnapshot(in: Context, completion: @escaping (PetEntry) -> Void) { completion(placeholder(in: context)) }
    func getTimeline(in: Context, completion: @escaping (Timeline<PetEntry>) -> Void) {
        // Build a few pre-baked frames from the App Group; refresh sparingly.
        let entries = nextPoses()   // e.g. 6 entries over the next few hours
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

**Interactive widget (iOS 17+)** — a `Button`/`Toggle` bound to an `AppIntent` runs
without opening the app:

```swift
struct FeedPetIntent: AppIntent {
    static var title: LocalizedStringResource = "Feed"
    func perform() async throws -> some IntentResult { PetStore.feed(); return .result() }
}
// in the widget view:  Button(intent: FeedPetIntent()) { Image(systemName: "fork.knife") }
```

## Live Activity + Dynamic Island skeleton

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

```swift
struct PetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PetAttributes.self) { ctx in
            // Lock-screen banner (still image pose; no live render)
            PetBanner(state: ctx.state)
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
Implement **all three Dynamic Island states** (compact / minimal / expanded). Use
`Text(timerInterval:)` for live-looking time without a refresh budget.

## Pawket convention (this project)

- The pet is rendered live **in-app with Rive**. In widgets and the Dynamic Island, use
  **pre-baked PNG frame sequences** (offscreen-rendered from Rive — see the `rive-ios`
  skill), stored in the App Group, and flipped along the timeline: near-static with the
  occasional pose change (à la Pixel Pals). Never try to run Rive/animation in the widget.
- The competitive goal is a Live Activity that **renews reliably and doesn't drop** — treat
  re-arming/renewal and the ~12h ceiling as first-class design, not an afterthought.

## Checklist
- [ ] Chose the right families incl. lock-screen `accessory*`; nothing depends on realtime render.
- [ ] Timeline refresh budget is realistic (≤ ~40–70/day); images loaded from App Group.
- [ ] `NSSupportsLiveActivities = YES`; activity has a sane `staleDate` and a renewal plan.
- [ ] All 3 Dynamic Island states implemented; Always-On (`isLuminanceReduced`) pose is static and legible.
- [ ] Verified Dynamic Island on an iPhone 14 Pro+ simulator/device.
- [ ] Pulled current WidgetKit/ActivityKit/AppIntents syntax via context7 (not from memory).
