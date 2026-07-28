---
name: codebase-design
description: >-
  Shared vocabulary and principles for designing DEEP modules — a lot of
  behaviour behind a small interface, placed at a clean seam. Use when designing
  or reshaping a module's interface, deciding where a seam goes, hunting for
  deepening opportunities, making code more testable or easier for an agent to
  navigate, or when another skill needs this vocabulary. Also covers
  "design it twice" — exploring radically different interfaces in parallel before
  committing. Distinct from improve-codebase-architecture (which scans a whole
  codebase and reports candidates) — this designs one module well.
allowed-tools: Read, Grep, Glob, Edit, Agent
metadata:
  category: design
  tags: [architecture, deep-modules, interface, seam, testability, ousterhout]
  source: >-
    Vendored from `mattpocock/skills` (MIT) — `engineering/codebase-design`,
    with DEEPENING / DESIGN-IT-TWICE moved under `references/`. Rooted in
    Ousterhout's "A Philosophy of Software Design" and Feathers' notion of a
    seam. Adapted, not copied.
---

# Codebase Design

Design **deep modules**: a lot of behaviour behind a small interface, placed at a
clean seam, testable through that interface. Use this language and these principles
wherever code is being designed or restructured. The aim is leverage for callers,
locality for maintainers, and testability for everyone.

## Glossary

Use these terms exactly — don't substitute "component," "service," "API," or
"boundary." Consistent language is the whole point.

**Module** — anything with an interface and an implementation. Deliberately
scale-agnostic: a function, class, package, or tier-spanning slice.

**Interface** — everything a caller must know to use the module correctly: the type
signature, but also invariants, ordering constraints, error modes, required
configuration, and performance characteristics. *Avoid* "API"/"signature" — too narrow.

**Implementation** — what's inside a module. Distinct from **Adapter**: a thing can be
a small adapter with a large implementation (a Postgres repo) or a large adapter with
a small implementation (an in-memory fake).

**Depth** — leverage at the interface: how much behaviour a caller (or test) can
exercise per unit of interface they must learn. **Deep** = lots of behaviour behind a
small interface. **Shallow** = interface nearly as complex as the implementation.

**Seam** *(Michael Feathers)* — a place where you can alter behaviour without editing
in that place; the *location* at which a module's interface lives. Where to put the
seam is its own decision, distinct from what goes behind it. *Avoid* "boundary" —
overloaded with DDD's bounded context.

**Adapter** — a concrete thing that satisfies an interface at a seam. Describes *role*,
not substance.

**Leverage** — what callers get from depth: more capability per unit of interface
learned. One implementation pays back across N call sites and M tests.

**Locality** — what maintainers get from depth: change, bugs, knowledge, and
verification concentrate in one place instead of spreading across callers.

## Deep vs shallow

```
DEEP (want)                    SHALLOW (avoid)
┌─────────────────────┐        ┌─────────────────────────────────┐
│   Small Interface   │        │       Large Interface           │
├─────────────────────┤        ├─────────────────────────────────┤
│                     │        │  Thin Implementation            │
│  Deep Implementation│        │  (just passes through)          │
│  (complexity hidden)│        └─────────────────────────────────┘
└─────────────────────┘
```

When designing an interface, ask: Can I reduce the number of methods? Can I simplify
the parameters? Can I hide more complexity inside?

## Principles

- **Depth is a property of the interface, not the implementation.** A deep module can
  be internally composed of small, mockable, swappable parts — they just aren't part
  of the interface. Modules can have **internal seams** (private, used by their own
  tests) as well as the **external seam** at their interface.
- **The deletion test.** Imagine deleting the module. If complexity vanishes, it was a
  pass-through. If complexity reappears across N callers, it was earning its keep.
- **The interface is the test surface.** Callers and tests cross the same seam. If you
  want to test *past* the interface, the module is probably the wrong shape.
- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't
  introduce a seam unless something actually varies across it.

## Designing for testability

1. **Accept dependencies, don't create them.** `processOrder(order, paymentGateway)`
   beats `processOrder(order)` that news up a `StripeGateway` inside.
2. **Return results, don't produce side effects.** `calculateDiscount(cart): Discount`
   beats `applyDiscount(cart): void` that mutates `cart.total`.
3. **Small surface area.** Fewer methods = fewer tests. Fewer params = simpler setup.

## Rejected framings

- **Depth as a ratio of implementation-lines to interface-lines** (Ousterhout's own
  formulation): rewards padding the implementation. Use depth-as-leverage instead.
- **"Interface" as the TypeScript `interface` keyword** or a class's public methods:
  too narrow — interface here includes every fact a caller must know.
- **"Boundary"**: overloaded with DDD. Say **seam** or **interface**.

## Going deeper

- **Deepening a cluster given its dependencies** — `references/DEEPENING.md`:
  dependency categories, seam discipline, replace-don't-layer testing.
- **Exploring alternative interfaces** — `references/DESIGN-IT-TWICE.md`: run parallel
  subagents that each design the interface a radically different way, then compare on
  depth, locality, and seam placement.
