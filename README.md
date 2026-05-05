# VizEx

**Regex Data Quality Visualizer** — paste raw data, write a regex, see live match highlights and data quality rule results instantly.

![VizEx](src/public/favicon.svg)

---

## What it does

VizEx is a single-page, browser-only tool for data engineers and analysts who need to:

- **Visualize regex matches** in real-time across raw text — log lines, CSV rows, JSON fragments, anything
- **Define Data Quality (DQ) rules** with named regex patterns and Pass/Fail conditions
- **Explore regex syntax** with a built-in quick-reference cheat sheet
- **Understand your data** with live input statistics — line counts, match density, matched vs. unmatched rows

No installation. No server. Open the app and start working.

---

## Features

| Feature | Description |
|---|---|
| **Live match highlighting** | Regex matches highlighted in real-time as you type, color-coded by capture group |
| **Flag toggles** | Inline `i` (case-insensitive), `m` (multiline), `s` (dotAll) controls |
| **DQ Rules panel** | Define named rules with `must-match`, `must-not-match`, or `match-count-equals N` conditions — live Pass/Fail/Error badges |
| **Regex Quick Reference** | Collapsible cheat sheet of clickable token chips — click to insert at cursor |
| **Input Statistics** | Live stats: total lines, characters, non-empty rows, matched rows, match density progress bar |
| **Example Patterns** | Built-in library of common regex patterns with one-click load |
| **File upload** | Load `.txt`, `.csv`, `.log`, `.json`, `.tsv`, `.md` files directly into the data pane |
| **Dark mode** | Full dark/light theme toggle |
| **Performance** | Handles 50,000+ character inputs — viewport-aware rendering, debounce, render cache, rAF throttle |

---

## Getting started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & run

```powershell
cd src
npm install
npm run dev
```

Opens at `http://localhost:5173`. Hot module reload active.

### Production build

```powershell
cd src
npm run build    # outputs to src/dist/
npm run preview  # serve dist/ locally
```

The `dist/` folder is fully static — open `dist/index.html` in any modern browser with no server required.

---

## Project structure

```
vizex/
├── README.md
├── specs/
│   └── 001-vizex/              # Speckit feature artifacts
│       ├── spec.md             # Feature specification
│       ├── plan.md             # Implementation plan
│       ├── tasks.md            # Task tracking
│       ├── data-model.md       # TypeScript data model spec
│       ├── quickstart.md       # Developer quickstart
│       ├── research.md         # Phase 0 research
│       ├── contracts/
│       │   └── ui-contract.md  # UI layout + module contracts
│       └── checklists/
│           └── requirements.md
└── src/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    └── src/
        ├── main.ts             # Entry point
        ├── state.ts            # Reactive state manager
        ├── types.ts            # TypeScript interfaces
        ├── engine/
        │   ├── resolveMatches.ts     # Regex evaluation + overlap resolution
        │   ├── evaluateRule.ts       # DQ rule pass/fail logic
        │   └── buildHighlightSpans.ts # Viewport-aware highlight span builder
        ├── storage/
        │   └── ruleSetStorage.ts    # localStorage CRUD
        ├── ui/
        │   ├── RegexInputPanel.ts   # Pattern input + flag toggles
        │   ├── DataPane.ts          # Data editor + highlight rendering
        │   ├── DQRulesPanel.ts      # DQ rules sidebar
        │   ├── ExamplesPanel.ts     # Example patterns library
        │   ├── RegexQuickRef.ts     # Regex cheat sheet chips
        │   └── InputStatsPanel.ts   # Live input statistics
        ├── examples/
        │   └── examples.ts          # Built-in pattern library
        └── styles/
            ├── main.css             # Layout + design system
            └── palette.css          # WCAG color palette tokens
```

---

## Tech stack

- **Vite 8** — build tool + dev server
- **TypeScript 6** — strict, no UI framework
- **Vanilla TS SPA** — no React, no Vue, no dependencies at runtime
- **Inter + JetBrains Mono** — UI and monospace fonts (Google Fonts)

---

## Development workflow

This project follows **Speckit** — a specification-first development workflow governed by the [VizEx Constitution](.specify/memory/constitution.md).

All features begin with a written spec → plan → tasks before any implementation. See [`specs/001-vizex/`](specs/001-vizex/) for the full feature artifacts.

---

## License

Private repository — © Kordelle
