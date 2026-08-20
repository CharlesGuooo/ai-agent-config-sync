# Provenance of the conference templates

**These files are not under this repository's terms, and they are not under the terms of the
repository we took them from.** Conference style files are distributed by each venue under its
own conditions. Do not relabel this directory with a licence.

Retrieved 2026-08-20 from
[Orchestra-Research/AI-Research-SKILLs](https://github.com/Orchestra-Research/AI-Research-SKILLs),
path `20-ml-paper-writing/ml-paper-writing/templates/`. That repository is MIT-licensed
(© 2025 Claude AI Research Skills Contributors), but the `.sty` and `.bst` files inside it
originate with the venues and are not Orchestra's to relicense — the MIT grant covers Orchestra's
own work, not redistributed third-party style files.

| Directory | Venue | Upstream source of the style files |
|---|---|---|
| `neurips2025/` | NeurIPS 2025 | neurips.cc author kit |
| `iclr2026/` | ICLR 2026 | iclr.cc author kit |
| `icml2026/` | ICML 2026 | icml.cc author kit |
| `acl/` | ACL (rolling) | acl-org/acl-style-files |
| `aaai2026/` | AAAI-26 | aaai.org author kit |
| `colm2025/` | COLM 2025 | colmweb.org author kit |

**Before submitting, re-download the current author kit from the venue.** These are a starting
point and a reference for structure, not an authority. A style file changes between years, and
sometimes between the CFP and the camera-ready deadline; submitting against a stale `.sty` is a
formatting rejection that is entirely avoidable.

## What was deliberately not copied

- **`natbib.sty` and `fancyhdr.sty`** (were in `colm2025/`, `iclr2026/`, `icml2026/`). Both are
  LPPL, both ship with every TeX distribution, and Tectonic fetches them on demand. Vendoring
  someone else's copy of a standard package into a public repository buys nothing and inherits a
  licence question.
- **Compiled PDFs** (`iclr2026_conference.pdf`, `colm2025_conference.pdf`,
  `example_paper.pdf`, `icml_numpapers.pdf`) — build artefacts, ~600 KB, regenerable.
- Orchestra's own `README.md` at the templates root, which described their repository layout.

Each venue's own `README.md` is kept where upstream provided one.
