# Gamers Matrix — AI Implementation Prompts

These prompts are designed for a project-aware coding agent (Cursor, Claude Code, Codex, Windsurf, or similar). Run them **one phase at a time**. Keep `DESIGN_SYSTEM.md` in the repository at `docs/DESIGN_SYSTEM.md` and treat it as the shared design contract for every phase.

## How to use this kit

1. Copy `DESIGN_SYSTEM.md` into the project at `docs/DESIGN_SYSTEM.md` (create the `docs` folder if needed).
2. Open the repository root in your coding agent.
3. Send the **Master Prompt** once.
4. Run Phase 0 first. Review its plan before implementation.
5. Run each later phase separately. Do not ask the agent to do all phases in one giant response.
6. After each phase, review the diff and test summary before continuing.

If the project already exists, the agent must adapt to its current stack and structure. It must not replace the repository or rewrite working code without a clear reason.

---

## Master Prompt — send first

```text
You are the lead product designer, senior full-stack engineer, and QA owner for Gamers Matrix, a premium Arabic-first digital gaming store.

MANDATORY DESIGN CONTRACT
- Before any design or UI code, read `docs/DESIGN_SYSTEM.md` completely.
- This file is the source of truth for colors, typography, layout, component behavior, RTL, storefront/admin patterns, accessibility, motion, and data integrity.
- Follow it in every phase. Do not invent a competing color palette or design language. If it conflicts with an explicit user instruction, stop and explain the conflict before changing the contract.

FIRST RULE: INSPECT, DO NOT GUESS
- Inspect the repository tree, `AGENTS.md`, README, package manifests/lockfiles, current framework and router, existing components/tokens, environment examples, database/schema/migrations, and tests before proposing changes.
- Preserve the current stack, package manager, conventions, and working integrations. If the repo is empty, propose a simple architecture consistent with the design-system technical contract. Do not add unnecessary infrastructure or dependencies.
- Never delete or replace user code just to make a clean scaffold. Make small, reversible, phase-scoped changes.

PRODUCT GOAL
Build a complete, polished digital products store named “Gamers Matrix” inspired by the provided near-black/violet gaming-store reference, improved for hierarchy, accessibility, responsive behavior, Arabic RTL, real commerce flows, and a sophisticated admin content/publishing workflow.

CORE STORE CAPABILITIES
- Responsive Arabic-first storefront with home page, catalog, categories, search, product details, offers, cart, checkout, account, order history/details, help, and legal/policy pages.
- Products may include legitimate digital games, add-ons, subscriptions, gift cards, in-game currency, and similar digital items. Product model should support platform, region, type, variants, price/currency, availability, delivery mode, images, SEO, and clear restrictions as relevant.
- Search, filters, sorting, wishlist, cart, coupon validation, order status, customer-facing digital fulfillment status, and support links.
- Actual data-backed admin dashboard with products, categories, media, campaigns/coupons, orders, customers/support, settings, roles/permissions, audit history, and a content studio.
- Advanced publishing: draft, review, scheduled, published and archived states; preview; server-side schedule; revisions/history; autosave status; slug collision checks; SEO/social preview fields; publish/unpublish confirmation; permissions; audit logging.
- Secure checkout/payment integration only when provider details are configured. Never assume a client redirect proves payment. Verify provider webhooks server-side and make them idempotent.
- Secure fulfillment: do not expose digital keys/tokens in logs, analytics, page source, or unauthorized admin/customer views. Only disclose fulfillment after the trusted backend confirms payment and assignment.

QUALITY BAR
- Use real, reusable components and design tokens. The result must be more than a static mockup.
- No fake metrics, fake reviews, fake stock, invented integrations, hardcoded secrets, dead buttons, silent failures, or misleading success states.
- Include loading, empty, error, disabled, and success states for the relevant flows.
- Keep keyboard accessibility, semantic HTML, visible focus, reduced motion, image optimization, SEO, and mobile responsiveness in scope.
- Arabic is the default UI language. Use correct `lang`/`dir`, CSS logical properties, and appropriate isolation for English names, URLs, product codes, and numbers.
- Do not add a dependency if existing project components can solve the problem safely.

WORKFLOW
- Execute only the phase I explicitly request. Do not jump to later phases or attempt the whole application at once.
- Before editing, provide a concise phase plan and list files/areas likely to change. Then implement.
- After editing, run relevant lint, typecheck, tests, and build commands that actually exist in the repo. Do not claim checks passed if you did not run them. If a check cannot run, state why.
- At the end, report: (1) what was implemented, (2) important files changed, (3) commands run and real results, (4) known gaps/required credentials, and (5) the exact next phase to run.
- Do not silently change scope. Stop after the report and wait for review.

Acknowledge these constraints and begin with Phase 0 only.
```

---

## Phase 0 — Repository audit and implementation plan

```text
Run Phase 0 only. Read `docs/DESIGN_SYSTEM.md` and the Master Prompt contract first.

Inspect the repository and report:
1. Existing architecture, framework, package manager, app entry points, design system, current routes, auth, database, integrations, test/lint/typecheck/build commands, and relevant constraints.
2. What already works and must be preserved.
3. The safest architecture for the remaining store, admin, and publishing features—prefer the existing stack; if the repo is empty, propose a minimal architecture and justify any separate API/database/queue.
4. A phase-by-phase plan with routes, components, data entities, security concerns, tests, and dependencies.
5. A list of environment variables/providers that will be needed later, using names and descriptions only; do not ask me to paste secret values into chat.
6. Risks, uncertain assumptions, and decisions that require my approval.

Do not implement the full site in this phase. Do not alter or delete code. You may create/update `docs/IMPLEMENTATION_PLAN.md` only if that is useful and does not overwrite important existing content. Stop after the plan and wait for approval.
```

## Phase 1 — Brand foundation, tokens, and responsive app shell

```text
Run Phase 1 only. Read `docs/DESIGN_SYSTEM.md` and the approved `docs/IMPLEMENTATION_PLAN.md` if one exists.

Implement the visual foundation and app shell for Gamers Matrix:
- Centralized CSS/theme tokens for every specified semantic color, typography, border, radius, shadow, spacing, and focus treatment.
- Font setup that correctly supports Arabic and Latin text without layout flashes or broken fallbacks.
- Reusable Button, IconButton, Input, SearchField, Badge/StatusChip, Card, ProductCard shell, Skeleton, EmptyState, ErrorState, Dialog/Drawer, and Toast primitives as appropriate to the existing stack.
- Storefront header with wordmark/logo area, search, wishlist, cart, and account entry.
- Distinctive left desktop navigation rail matching the reference direction, with an accessible mobile drawer. Content remains correctly RTL in Arabic.
- Responsive storefront content frame, hero-banner shell, section-heading pattern, and service/confidence strip.
- A separate basic admin shell with admin identity, breadcrumbs/page title, RTL-aware navigation, and main workspace layout; do not build all admin pages yet.
- Real hover, focus-visible, active, disabled, loading, and responsive states. Respect reduced motion.

Use the supplied reference's atmosphere, not a pixel-for-pixel copy. Improve consistency and avoid excessive glows. Do not use emoji as icons. Prefer existing icon assets/library.

Acceptance: no horizontal overflow at common viewports; no broken Arabic direction; tokens are centralized; shared primitives are truly reusable; no dead controls that look functional. Add/update small visual/component tests if the project has a test setup. Run available checks and report actual results. Stop after Phase 1.
```

## Phase 2 — Storefront experience with explicit development fixtures

```text
Run Phase 2 only. Read `docs/DESIGN_SYSTEM.md` and the approved implementation plan.

Build the complete storefront presentation and navigation using the project's data layer if it is ready; otherwise use clearly isolated, typed development fixtures behind a repository/service interface so real data can replace them later without rewriting components.

Implement:
- Home page with a cinematic but lightweight hero, featured items, new releases, categories, active offers, and service/confidence information.
- Catalog page with search, filters based only on supported data fields, sort, pagination or stable incremental loading, and useful empty/loading/error states.
- Category and offers pages.
- Product detail page with consistent artwork, title, platform/region/type, price, valid sale comparison if supplied, availability, product description, delivery details, restrictions/policies, related items, and a clear primary action.
- Search results and not-found pages.
- Wishlist interaction and product-card hover/focus behavior.
- Help, contact, terms, privacy, and refund policy routes with useful structured content (do not fabricate legal claims; mark business-specific values requiring owner review).
- Central price/currency formatting and configurable storefront currency. The reference uses SAR, so SAR is acceptable in clearly marked fixtures only; no currency should be hardcoded in reusable components.

Artwork must use authentic assets already provided/configured or clearly identified placeholders. Do not fabricate product ratings, review counts, sales, stock counts, or platform availability. All product links and buttons must lead to a valid route or working interaction.

Acceptance: storefront route navigation works; desktop/mobile layouts match the design system; Arabic/English mixed content is legible; product cards remain scannable; fixtures are isolated from production data. Run available checks, list unfinished data-dependent items, and stop.
```

## Phase 3 — Data model, API contracts, authentication, and authorization

```text
Run Phase 3 only. Read `docs/DESIGN_SYSTEM.md` and the approved plan. Inspect current schemas and auth before changes.

Implement or refine only the backend foundation needed for the store using the existing project architecture. Define and validate the models/contracts for:
- Product, ProductVariant, Category, MediaAsset, Campaign/Discount/Coupon.
- User/Customer, AdminUser or role membership, Role/Permission if appropriate.
- Cart/CartItem if persisted, Order/OrderItem, PaymentAttempt/PaymentEvent, Fulfillment/InventoryItem when relevant.
- ContentPage or CampaignContent, PublicationRevision, AuditLog, and scheduled publication metadata.

Requirements:
- Use migrations and seed data that are safe to rerun. Never drop or overwrite existing data without explicit approval.
- Add server-side input validation, access controls, role/permission checks, structured errors, pagination, unique slug constraints, and indexes justified by query patterns.
- Separate public read endpoints from admin mutations. Public APIs must not return private inventory fields, payment secrets, internal notes, or private customer data.
- Model publication as validated state transitions rather than trusting a client-provided status.
- Use database transactions/locking where orders, stock assignment, coupon limits, or status transitions can race.
- Make audit events useful but redact passwords, access tokens, provider secrets, payment-sensitive payloads, and digital keys.
- If the app has no auth provider configured, implement the project's approved secure auth approach or leave a clearly documented adapter boundary; do not invent a working login without real credential/session validation.

Add focused tests for validation, authorization boundaries, slug uniqueness, publication transitions, and any key transactional behavior. Update `.env.example` with placeholders and explanations only; never add real secrets. Run applicable migrations/checks in a safe local/dev environment and report exactly what ran. Stop after Phase 3.
```

## Phase 4 — Cart, checkout, orders, payments, and delivery

```text
Run Phase 4 only. Read `docs/DESIGN_SYSTEM.md`, implementation plan, and current API/data contracts.

Connect the storefront to real persisted services for:
- Cart read/update/remove and server-calculated subtotal/discount/fees/tax/total where applicable.
- Coupon validation with eligibility, time window, usage limits, and no negative/incorrect totals.
- Checkout with clear order review, selected payment method, final amount, relevant platform/region and delivery disclosures, and accessible error feedback.
- Order creation and customer order history/details.
- Payment-provider abstraction or existing integration. Never hardcode provider secrets. Verify callbacks/webhooks server-side, verify signatures where required, reject replay/invalid events, and ensure idempotent processing.
- A clear payment/order state model such as pending, paid, failed, cancelled, refunded and fulfillment pending/delivered/failed where relevant.
- Digital delivery only after trusted server-side payment verification. Avoid exposing keys/tokens in client logs, browser source, analytics, unrelated API responses, or unprivileged views.
- Safe retry/reconciliation tools for authorized operators without duplicate charges or duplicate fulfillment.
- Empty cart, pending payment, failed payment, success confirmation, order-not-found, and permission-denied states.

If credentials are not present, implement a safe test adapter/mock that is unmistakably development-only, document how to configure the real provider, and do not claim live payment processing works. Do not use real money or production webhooks during development.

Tests must cover price recalculation on the server, coupon edge cases, unauthorized order access, webhook signature/idempotency behavior (where integrated), and prevention of duplicate fulfillment. Run relevant checks and stop.
```

## Phase 5 — Admin dashboard and advanced Content Studio

```text
Run Phase 5 only. Read `docs/DESIGN_SYSTEM.md`, especially section 10, and inspect the existing data model/auth.

Build a functional, permission-protected admin area using the shared design tokens but a workspace-oriented layout, not the storefront hero repeated.

Implement:
1. Overview with accurate computed summaries, latest orders, pending content, and inventory warnings. Hide metrics that cannot be calculated from actual data.
2. Products: searchable/filterable list, pagination, create/edit/archive, category/tag assignment, media selection, product type, platform/region, variants, price/currency/comparison price, inventory/delivery configuration, SEO fields, validation, save draft, preview.
3. Categories and navigation management.
4. Media library with uploads, file type/size validation, preview, alt text, record association, and protection against removing media still in use.
5. Campaigns/coupons with start/end schedule, eligibility, limits, and server validation.
6. Orders with payment/fulfillment status, searchable details, safe operator actions, and an audit trail; never show payment secrets or raw digital keys in generic tables.
7. Customer/support views restricted by role and minimum necessary data.
8. Admin user roles/permissions and settings appropriate to the project's current auth/architecture.
9. Audit log with actor, action, record, timestamp, and redacted before/after summary where appropriate.

CONTENT STUDIO — MUST BE REAL, NOT COSMETIC
- Implement the valid workflow: draft → in_review → scheduled → published → archived (with only explicitly defined, permission-checked transitions).
- Draft creation/editing and save status; manual save and unsaved-change protection.
- Revision history with author/time and restore/revert if supported by the model.
- Preview using the actual public rendering components, without accidentally publishing the draft.
- SEO title/description, slug validation/collision checks, social image, locale, and scheduling timezone.
- A scheduled publisher that evaluates server-side; do not depend on a browser tab being open. Use existing job infrastructure if present; otherwise choose the simplest reliable mechanism for the actual deployment and document limitations.
- Publish/unpublish/archive confirmations and audit events.
- Visible failed-schedule state, retry path, and clear distinction between saving, scheduled, and published.
- Server-side validation/authorization for every mutation. UI hiding a button is not authorization.

Do not create fake charts or hardcode a “sales” number. Do not overbuild integrations whose credentials/services do not exist. Add tests for role boundaries, publication transitions/scheduling, slug conflicts, product validation, and destructive actions. Run available checks and stop after reporting genuine results.
```

## Phase 6 — Account, customer support, and operational polish

```text
Run Phase 6 only. Read the design system and implementation plan.

Finish customer-facing account flows that exist in this project's scope:
- Account/profile view and safe session actions.
- Order history/detail and authorized fulfillment access.
- Useful order state timeline and support/contact entry point.
- Password/session/security flows only if supported by the configured auth provider; never fake a successful security action.
- Notification/email templates and delivery adapters only when a real provider is configured; otherwise provide a documented adapter and development preview.
- Accessible form validation, clear errors, rate limits for abuse-prone endpoints, and safe handling of account/order identifiers.

Review policies, checkout disclosures, and support paths. Ensure that customer-visible claims are consistent with configured store settings and real delivery behavior. Do not fabricate business addresses, company registration details, or legal guarantees; expose owner-configurable fields and mark missing production configuration. Add relevant tests and stop.
```

## Phase 7 — Security, accessibility, responsive QA, performance, and release readiness

```text
Run Phase 7 only. Read `docs/DESIGN_SYSTEM.md`. Do not use this as permission for an unrelated rewrite.

Perform a systematic audit and fix findings within this phase:
- Run existing lint, strict typecheck, unit/integration/e2e tests, and production build.
- Verify all important storefront/admin routes and direct URL refresh behavior.
- Test responsive widths: 320/375/390/768/1024/1440/1920px; verify no horizontal overflow, clipped labels, obscured CTA, or inaccessible navigation.
- Check Arabic RTL, mixed English game names, numbers, prices, dates, email/URL direction, and both Arabic/English locale behavior if English is supported.
- Keyboard-only navigation, focus management, dialog/drawer close behavior, input labels, error associations, alt text, contrast, reduced motion, and touch target sizes.
- Verify admin access control on the server for every sensitive route/mutation; test unauthenticated and wrong-role requests.
- Review authentication/session handling, CSRF where relevant, CORS, rate limiting, output encoding, file uploads, secrets, logging/redaction, dependencies, headers, and env configuration.
- Review order total recalculation, payment webhook authenticity/idempotency, race conditions around stock/coupons/fulfillment, and publication scheduler retries.
- Verify SEO metadata, product canonical/social metadata, sitemap/robots behavior, images/layout shift, and caching boundaries for private data.
- Remove temporary debug logs, accidental secrets, misleading demo metrics in production paths, unused imports, and obvious dead buttons.
- Update README/deployment notes and `.env.example` for real setup. Do not declare production ready if required credentials, migrations, external services, or verification steps are still missing.

Fix high-impact issues first. Re-run checks after changes and report exact commands/results, unresolved issues by severity, required manual/provider setup, and a go/no-go assessment. Stop after the report.
```

---

## Optional follow-up prompt — review a phase before continuing

```text
Review the last completed phase against `docs/DESIGN_SYSTEM.md` and its acceptance criteria. Inspect the actual diff and run relevant checks. Do not implement the next phase.

Return:
- Missing requirements grouped by severity.
- Visual/system inconsistencies (especially violet tokens, Arabic RTL, responsive layout, typography, cards, focus, and states).
- Functional dead ends, fake data/integrations, authorization gaps, and error/empty/loading states that are missing.
- The smallest safe corrective patch, followed by the tests/checks you actually ran.

Fix only issues belonging to the already completed phase, then stop.
```

## Definition of done

The project is complete only when the storefront, checkout/order lifecycle, admin CRUD, publishing state machine/scheduler, permission checks, responsive RTL layout, policy/configuration pages, and real integrations that are claimed as live have been implemented and verified. A visually complete home page alone is not completion.
