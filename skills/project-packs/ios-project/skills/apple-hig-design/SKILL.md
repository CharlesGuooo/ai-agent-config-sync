---
name: apple-hig-design
description: Make an iOS/SwiftUI screen look beautiful and native (Apple Human Interface Guidelines). Use for iOS visual design, layout, color/typography/spacing choices, polishing a screen so it looks Apple-native rather than templated, or "make this look good". For motion use swiftui-animation; for native component code use swiftui-components.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
---

# Apple HIG Design (iOS/SwiftUI visual taste)

Beautiful iOS UI comes from Apple's three principles — **Clarity, Deference, Depth** — plus
using the system's design tokens instead of hardcoded values. The tell of AI/templated UI is
hardcoded colors, fixed fonts, magic-number padding, and flat layering. Design **native, not
templated**.

**Pull current HIG specifics from the `context7` MCP** (Apple Human Interface Guidelines) —
this skill fixes the principles and the token discipline; context7 has the current values.

## The three principles
- **Clarity** — legible type at every size, precise icons, generous negative space; content
  over chrome. If the user can't tell what's tappable, it fails clarity.
- **Deference** — the UI recedes so content leads: system materials/blur, restrained color,
  no decorative gradients competing with content.
- **Depth** — realistic layering (sheets, `.background(.regularMaterial)`, shadows used
  sparingly) communicates hierarchy and transitions.

## Use the tokens, not literals
- **Color** — semantic colors (`Color.primary/.secondary`, `.tint`, system colors) so dark
  mode + contrast are automatic. Never hardcode hex for text/background.
- **Typography** — `Font.title/.body/.caption` etc. (SF + **Dynamic Type**), never fixed
  point sizes; support the accessibility text sizes.
- **Spacing/layout** — the **8pt grid**, `.safeAreaInset`, `.padding()` defaults over magic
  numbers; respect safe areas and the reading width.
- **Icons** — SF Symbols with weights/scales that match adjacent text.
- **Materials/depth** — `.regularMaterial`/`.thinMaterial`, `.background`, subtle shadows;
  on iOS 26 pair with `swiftui-liquid-glass`.

## Accessibility *is* design
Dynamic Type must not clip; contrast ≥ HIG minimums; every control has a VoiceOver label; tap
targets ≥ 44pt. A design that breaks at large text or in dark mode isn't finished.

## Checklist
- [ ] Colors/fonts/spacing use semantic tokens + the 8pt grid — no hardcoded hex or point sizes.
- [ ] Reads as Clarity/Deference/Depth: content leads, chrome recedes, layering shows hierarchy.
- [ ] Works in light + dark and at the largest Dynamic Type size without clipping.
- [ ] Tap targets ≥ 44pt; VoiceOver labels present; contrast meets HIG.
- [ ] Motion delegated to `swiftui-animation`; native components to `swiftui-components`.
- [ ] Current HIG specifics confirmed via context7.
