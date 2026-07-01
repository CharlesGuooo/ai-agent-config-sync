---
name: fastlane
description: Set up and run fastlane for iOS signing, TestFlight, and App Store submission on macOS. Use for "fastlane", TestFlight upload, code signing / certificates (match), building an .ipa (gym), beta distribution (pilot), or store submission (deliver). Setup/reference skill — the CLI is installed and run on the Mac.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
---

# fastlane (iOS distribution)

fastlane automates the tedious, error-prone parts of shipping: signing, building,
TestFlight, and submission. Still the 2026 standard and the most agent-friendly path.
**macOS-only** — install and run on the Mac.

## Install (Mac)
```bash
brew install fastlane      # preferred — avoids Bundler/Ruby dependency conflicts
fastlane init              # in the project dir; creates fastlane/Fastfile + Appfile
```
Optional: the community Claude Code plugin bundles ready lanes —
`/plugin marketplace add greenstevester/fastlane-skill` (Setup/Match/Snapshot/Beta/Release).
Review what its lanes run before trusting them in a real signing/release flow.

## The tools you'll use
| Tool | Job |
|------|-----|
| `match` | Sync signing certs + provisioning profiles from a private git repo (team-shareable, reproducible). |
| `gym`   | Build + export a signed `.ipa` (`gym --scheme App`). |
| `pilot` | Upload to TestFlight + manage testers (`pilot upload`). |
| `deliver` | Push metadata/screenshots/binary to App Store Connect + submit for review. |

## Minimal Fastfile
```ruby
default_platform(:ios)
platform :ios do
  desc "Build + push to TestFlight"
  lane :beta do
    match(type: "appstore", readonly: true)
    gym(scheme: "Pawket", export_method: "app-store")
    pilot(skip_waiting_for_build_processing: true)
  end
  desc "Submit to the App Store"
  lane :release do
    match(type: "appstore", readonly: true)
    gym(scheme: "Pawket")
    deliver(submit_for_review: true, force: true)
  end
end
```
Run: `fastlane beta` / `fastlane release`.

## Notes
- **App Store Connect auth**: prefer an **API key** (`.p8` + key id + issuer id) over
  Apple-ID login — it's non-interactive and 2FA-proof; set it via `app_store_connect_api_key`.
- **`match`** needs a private repo for the encrypted certs; run `match nuke` only when you
  truly want to revoke. Keep the match passphrase in the keychain/CI secret, never in git.
- **Widget/Live Activity extensions** are separate targets/bundle-ids — make sure `match`
  provisions each app-extension bundle id, not just the main app.
- To let an agent watch build/test status, consider adding an App Store Connect MCP later.

## Checklist
- [ ] `brew install fastlane`; `fastlane init` done; scheme name matches the project.
- [ ] Signing via `match` from a private repo; ASC API key configured (no interactive login).
- [ ] All extension bundle ids (widget, Live Activity) provisioned by match.
- [ ] `fastlane beta` reaches TestFlight; `fastlane release` submits cleanly.
