---
name: rive-ios
description: Integrate Rive animations into a native iOS/SwiftUI app — SPM setup, RiveViewModel + state machines, artboard/skin swapping, and (critically for Pawket) baking Rive animations into PNG frame sequences for widgets/Dynamic Island. Use for any "add Rive", "Rive state machine", "换皮/skin", "pet animation", or "bake frames for the widget" task.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash
---

# Rive on iOS (SwiftUI)

Rive is a real-time vector animation runtime (Metal-backed on iOS), driven by **state
machines** — you set inputs, the animation reacts. Pure Swift via SPM, so an agent can
usually generate correct integration from the official docs. This skill fixes the moving
parts + the Pawket-specific **offscreen → PNG frame** pipeline that feeds the widget.

**Confirm current `rive-ios` API with the `context7` MCP** (package `rive-app/rive-ios`) —
the runtime's SwiftUI surface has changed across versions; don't hardcode from memory.

## Setup (SPM)
Add `https://github.com/rive-app/rive-ios` in Xcode → Package Dependencies, `import RiveRuntime`.
Ship the `.riv` file in the app bundle (and, for baked frames, its poses reachable to the
baker). Rive renders via Metal — fine in-app; **never** in a widget extension (see below).

## In-app: RiveViewModel + state machine

```swift
import RiveRuntime
import SwiftUI

final class PetVM: ObservableObject {
    let rive = RiveViewModel(fileName: "pet", stateMachineName: "PetSM", artboardName: "cat")
    func setMood(_ v: Double) { rive.setInput("mood", value: v) }   // number input
    func trigger(_ name: String) { rive.triggerInput(name) }         // e.g. "feed"
}

struct PetView: View {
    @StateObject var vm = PetVM()
    var body: some View {
        vm.rive.view()                       // the SwiftUI RiveView
            .onTapGesture { vm.trigger("pet") }
    }
}
```

- **Inputs** drive everything: number (`mood`), boolean (`isSleeping`), trigger (`feed`).
  Prefer state-machine inputs over playing named animations directly.
- **Skins / 换皮** = swap **artboard** (`artboardName:`) or a theme input, reusing one shared
  state machine so all skins share the action library. Keep the state machine identical
  across artboards so "shared actions + swappable skin" holds.

## Bake Rive → PNG frame sequence (for widgets / Dynamic Island)

Widgets can't run Rive (no realtime render in extensions — see `widgetkit-liveactivity`).
So render poses **offscreen in the app**, write PNGs to the **App Group**, and let the
widget flip through them on its timeline.

```swift
// Render one pose to a PNG in the App Group container.
func bakePose(_ input: String, size: CGSize) -> URL? {
    let model = RiveViewModel(fileName: "pet", stateMachineName: "PetSM", artboardName: "cat")
    model.triggerInput(input)                 // or set a specific frame/state
    let riveView = model.createRiveView()
    riveView.frame = CGRect(origin: .zero, size: size)
    let img = UIGraphicsImageRenderer(size: size).image { _ in
        riveView.drawHierarchy(in: riveView.bounds, afterScreenUpdates: true)
    }
    let dir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.pawket")!
    let url = dir.appendingPathComponent("pose_\(input).png")
    try? img.pngData()?.write(to: url)
    return url
}
```
- Bake a **small set of poses** (idle + a few actions), not a per-frame film — the widget
  shows near-static poses with occasional changes. Keep PNGs small (widget memory is tight).
- Regenerate baked frames when the skin changes; the widget timeline references the App
  Group paths (`UIImage(contentsOfFile:)`).
- For a short "loop" in a Live Activity you may bake a handful of frames and cross-fade
  between two — but respect the widget/Live Activity animation limits.

## Metal / rendering notes
- Rive uses the Rive Renderer (Metal) by default on iOS; it's fine on-device. Offscreen
  baking via `UIGraphicsImageRenderer` + `drawHierarchy` captures the current rendered
  state — trigger the desired pose and let it settle before capturing.
- Test on device for color/blend fidelity; simulator Metal can differ slightly.

## Checklist
- [ ] `rive-ios` via SPM; `.riv` bundled; in-app view uses state-machine **inputs**, not raw animations.
- [ ] Skins swap by artboard/theme over one shared state machine (shared action library).
- [ ] Widget/DI poses are **baked PNGs in the App Group**, never live Rive in the extension.
- [ ] Baked pose set is small; re-baked on skin change; paths read via `UIImage(contentsOfFile:)`.
- [ ] Verified current rive-ios SwiftUI API via context7.
