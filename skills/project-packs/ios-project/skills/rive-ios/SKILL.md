---
name: rive-ios
description: Integrate Rive animations into a native iOS/SwiftUI app. Use for "add Rive", a Rive state machine, artboard/skin swapping (换皮), a pet/character animation, or baking Rive frames into PNGs for a widget.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
---

# Rive on iOS (SwiftUI)

Rive is a Metal-backed runtime driven by **state-machine inputs** — you set inputs, the
animation reacts; you don't hand-drive frames. Pure Swift via SPM, so generating correct
integration from the docs is high-success. **Confirm the current `rive-ios` SwiftUI API via
the `context7` MCP** (`rive-app/rive-ios`) — its surface has shifted across versions.

## Setup (SPM)
Add `https://github.com/rive-app/rive-ios` in Xcode → Package Dependencies; `import RiveRuntime`.
Ship the `.riv` in the bundle. Rive renders via Metal on-device — never in a widget extension.

## In-app: drive by inputs, not animations

```swift
import RiveRuntime
final class PetVM: ObservableObject {
    let rive = RiveViewModel(fileName: "pet", stateMachineName: "PetSM", artboardName: "cat")
    func setMood(_ v: Double) { rive.setInput("mood", value: v) }   // number
    func trigger(_ name: String) { rive.triggerInput(name) }         // e.g. "feed"
}
// view:  vm.rive.view().onTapGesture { vm.trigger("pet") }
```

- Prefer **state-machine inputs** (number / boolean / trigger) over playing named animations.
- **Skins (换皮)** = swap `artboardName:` (or a theme input) over **one shared state machine**,
  so every skin reuses the same action library. Keep the state machine identical across artboards.

## Bake frames for a widget

Widgets can't run Rive. Render poses offscreen in the app and write PNGs to the App Group;
the widget flips through them. This is the Pawket pipeline — see
[`references/bake-frames.md`](references/bake-frames.md).

## Checklist
- [ ] `.riv` bundled; in-app view driven by state-machine **inputs**, not raw animations.
- [ ] Skins swap by artboard/theme over one shared state machine.
- [ ] Widget/DI poses are **baked PNGs in the App Group**, never live Rive in the extension.
- [ ] Current rive-ios SwiftUI API confirmed via context7.
