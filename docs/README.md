# Gamers Matrix Prompt Kit

This kit contains the shared design contract and a phased implementation plan for building the Gamers Matrix digital-goods store.

## Files

- `DESIGN_SYSTEM.md` — the permanent visual, UX, accessibility, RTL, component, storefront, admin, and implementation contract.
- `IMPLEMENTATION_PROMPTS.md` — the Master Prompt plus eight phase prompts to run one at a time.
- `IMPLEMENTATION_PLAN.md` — Phase 0 audit output: current architecture, locked decisions, phase roadmap, and env inventory.

## Recommended repository placement

Copy both Markdown files into your project:

```text
your-project/
└── docs/
    ├── DESIGN_SYSTEM.md
    └── IMPLEMENTATION_PROMPTS.md
```

If you keep this `README.md`, place it at the project root or inside the prompt kit folder. If the project already has a `docs` directory or an `AGENTS.md`, preserve it and add these files without overwriting existing instructions.

## Recommended execution order

1. Master Prompt
2. Phase 0 — Audit and plan (review before allowing code changes)
3. Phase 1 — Design tokens and app shell
4. Phase 2 — Storefront UI and routes
5. Phase 3 — Data model/API/auth/permissions
6. Phase 4 — Cart, checkout, order, payment, fulfillment
7. Phase 5 — Admin and advanced publishing
8. Phase 6 — Account/support/operational polish
9. Phase 7 — Security, accessibility, responsive QA, performance, release readiness

Do not ask the coding agent to run every phase at once. Review code diffs and genuine test output after each phase. Never paste production secrets into prompts; configure them using your deployment's secret/environment management.
