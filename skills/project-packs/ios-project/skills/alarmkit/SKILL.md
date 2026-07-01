---
name: alarmkit
description: Build alarms and timers with iOS 26's AlarmKit. Use for an alarm, 闹钟, wake-up, or a timer-with-alert that must break through silent mode / Focus.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
---

# AlarmKit (iOS 26)

AlarmKit (introduced WWDC 2025 / iOS 26) lets a third-party app schedule alarms and timers
that **break through silent mode and Focus** with a full-screen alert — previously
Apple-Clock-only. It is **new and moving**; do not trust hardcoded signatures.

**FIRST, pull the current AlarmKit API via the `context7` MCP** (framework `AlarmKit`,
`AlarmManager`, `AlarmConfiguration`, `AlarmPresentation`). This skill gives the shape and
the pitfalls; context7 gives exact current syntax.

## Shape (verify each symbol with context7)
- **Authorization**: request alarm authorization before scheduling (`AlarmManager.shared`
  authorization APIs); handle denied — degrade to a normal notification.
- **Schedule**: build an alarm/countdown configuration (schedule or duration + a
  presentation describing the alert UI + optional custom `AppIntent` buttons like
  "Snooze"/"Stop") and register it via `AlarmManager`.
- **Presentation**: alarms can show a full-screen alerting UI and a Live Activity /
  Dynamic Island countdown — reuse the `widgetkit-liveactivity` skill for the DI/Live
  Activity surface (show the pet there while counting down).
- **Lifecycle**: observe/stop/cancel alarms; a fired alarm surfaces its alert even if the
  app isn't running.

## Pawket "alarm buddy" notes
- The pet appears on the countdown (Live Activity/DI) and on the alert — bake poses per
  `rive-ios`, don't run Rive in the alert surface.
- Design so the **gimmick never delays the real wake**: the alarm must fire reliably and be
  dismissible immediately; the "coax you awake" play is on top of, not in place of, a
  dependable alarm. Test that Focus/silent-mode breakthrough actually works on device.

## Checklist
- [ ] Pulled current AlarmKit symbols via context7 (don't hardcode from memory).
- [ ] Authorization requested + denied path degrades to notifications.
- [ ] Alarm fires through silent mode/Focus; verified on a real iOS 26 device.
- [ ] Countdown/alert pet uses baked frames (see rive-ios), not live Rive.
- [ ] Real alarm reliability is never compromised by the gameplay.
