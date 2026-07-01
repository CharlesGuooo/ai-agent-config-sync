---
name: widgetkit-liveactivity
description: Build or review iOS widgets (WidgetKit), Live Activities (ActivityKit), and the Dynamic Island. Use when the task involves a home/lock-screen widget, 锁屏小组件, a TimelineProvider, an interactive widget button, a Live Activity, or the Dynamic Island / 灵动岛.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
---

# WidgetKit · Live Activity · Dynamic Island

These surfaces are **static snapshots** the system schedules — not live views you drive.
The failure that wastes the most time is designing something the OS silently won't run.
Internalize the red-lines, then build the one branch you need.

**Pull current API syntax from the `context7` MCP** (WidgetKit / ActivityKit /
DynamicIsland / AppIntents) — these signatures move every release; this skill fixes the
*shape* and the *limits*, context7 fills the syntax.

## Red-lines (bind every branch)

- A widget is a **static snapshot**: no realtime render (no Metal/SceneKit, no Lottie/Rive,
  no video/GIF). The only motion is number rollover, an A↔B cross-fade, and
  `Text(timerInterval:)` system time. Refresh is throttled (~40–70 reloads/day). Images load
  from the **App Group** (`UIImage(contentsOfFile:)`), never fetched at render time.
- A Live Activity lasts ~**8h active + 4h stale** — no true 24h. Treat it as **renewal-first**:
  design the re-arm, expect it to end.
- The **Dynamic Island renders only on iPhone 14 Pro and later** — test on that simulator.
- Animation is ~2s and **system-controlled** (your `withAnimation` is ignored); in Always-On
  (`isLuminanceReduced`) it's disabled — design a legible still pose.

## Pawket convention

The pet renders live in-app with Rive; every widget/Dynamic Island surface shows
**pre-baked PNG frames** (offscreen-rendered from Rive to the App Group — see the `rive-ios`
skill), flipped along the timeline. Never run Rive in an extension. Live Activity is
renewal-first — beating competitors on "doesn't drop" is the goal.

## Build it — pick the branch

- A **widget** (home or lock-screen) → read [`references/widgetkit.md`](references/widgetkit.md):
  `TimelineProvider`, families incl. lock-screen `accessory*`, interactive `AppIntent` buttons.
- A **Live Activity + Dynamic Island** → read [`references/live-activity.md`](references/live-activity.md):
  `NSSupportsLiveActivities`, `Activity.request/update/end`, the three Dynamic Island states.

## Checklist

- [ ] Nothing depends on realtime render; motion is only rollover / cross-fade / system timer.
- [ ] Widget images come from the App Group; refresh budget is ≤ ~40–70/day.
- [ ] Live Activity is renewal-first with a sane `staleDate`; `NSSupportsLiveActivities = YES`.
- [ ] All three Dynamic Island states built; Always-On pose is static and legible; verified on iPhone 14 Pro+.
- [ ] Widget/DI art is pre-baked PNG frames, never live Rive.
- [ ] API syntax pulled from context7, not memory.
