# Bake Rive → PNG frame sequence (for widgets / Dynamic Island)

Render poses offscreen in the app, write PNGs to the **App Group**, let the widget flip
through them on its timeline. Bake a **small set of poses** (idle + a few actions), not a
per-frame film — keep PNGs small (widget memory is tight). Re-bake when the skin changes.

```swift
func bakePose(_ input: String, size: CGSize) -> URL? {
    let model = RiveViewModel(fileName: "pet", stateMachineName: "PetSM", artboardName: "cat")
    model.triggerInput(input)                        // set the desired pose, let it settle
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

The widget timeline references these App Group paths via `UIImage(contentsOfFile:)`. For a
short Live Activity loop, bake a handful of frames and cross-fade two — within the widget
animation limits. `drawHierarchy` captures the current rendered state, so trigger the pose
and let it settle before capturing.
