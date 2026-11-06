# Gamers Matrix — Design System

> **Purpose:** This is the single source of truth for every UI decision in Gamers Matrix. Read it before designing, generating, or modifying any screen or component. When a later prompt conflicts with this file, follow this file unless the user explicitly approves a documented change.
>
> **Product:** A premium Arabic-first digital gaming store for games, add-ons, subscriptions, gift cards, in-game currency, and other legitimate digital products.
>
> **Reference direction:** A cinematic near-black gaming storefront with layered violet lighting, a strong wordmark, game-art cards, and a compact commerce layout. Recreate the visual language—not the exact pixels. Improve hierarchy, spacing, usability, accessibility, responsiveness, and consistency.

---

## 1. Product and experience principles

1. **Premium gaming atmosphere:** Deep black-plum surfaces, controlled violet light, crisp artwork, confident typography, and restrained motion.
2. **Commerce first:** Product name, platform/region, price, availability, and the primary action must be easy to scan. Decoration must never compete with product information.
3. **Arabic-first and RTL-correct:** Arabic is the default interface language. Use real RTL layout behavior, not merely right-aligned text. English game names, product codes, prices, email addresses, and IDs must remain legible in mixed-direction content.
4. **Trust is part of the UI:** Make payment, delivery method, region compatibility, refund policy, support availability, and order status visible where relevant. Never invent reviews, sales counts, stock, guarantees, discounts, or trust badges.
5. **Consistent systems over one-off screens:** Reuse tokens, layout primitives, components, spacing, states, and interaction patterns across storefront and administration.
6. **Responsive by design:** Every major view must work on small phones, tablets, laptops, and wide desktops. Never rely on horizontal page overflow.
7. **Accessible by default:** Keyboard navigability, visible focus, semantic controls, readable contrast, reduced-motion support, and useful labels are required.

## 2. Brand personality

- **Keywords:** cinematic, competitive, polished, focused, trustworthy, modern.
- **Avoid:** generic SaaS dashboards, excessive neon, giant glowing borders on every card, random gradients, glassmorphism everywhere, emoji icons, unnecessary animations, clutter, fake metrics, placeholder Latin text, and default-looking component-library pages.
- **Brand name:** `Gamers Matrix`.
- **Optional tagline:** `LEVEL UP YOUR GAME` (English brand line; do not force it into every screen).
- **Logo direction:** Custom controller/matrix mark with a sharp, geometric silhouette and violet accent. Wordmark is white; `MATRIX` or a small secondary brand line may use violet. Use an actual logo asset/SVG if supplied. Do not approximate a provided logo with emoji or unrelated icon glyphs.

## 3. Color system

Use these as semantic design tokens. Implement them as CSS variables and map them into the project's styling system. Do not scatter raw hex values through components.

### 3.1 Core palette

| Token | Hex | Intended use |
|---|---|---|
| `--gm-bg` | `#06050A` | Main page background |
| `--gm-bg-raised` | `#0A0811` | Header and secondary background regions |
| `--gm-surface` | `#100C19` | Standard cards, panels, menus |
| `--gm-surface-raised` | `#171021` | Elevated cards, popovers, active panels |
| `--gm-surface-hover` | `#21152F` | Hovered interactive surfaces |
| `--gm-border` | `#2D203D` | Standard separators and outlines |
| `--gm-border-strong` | `#49325F` | Emphasized separators and input focus context |
| `--gm-violet-950` | `#1A092E` | Deep violet surface |
| `--gm-violet-900` | `#2A0E4E` | Deep brand fill |
| `--gm-violet-800` | `#411475` | Dark brand fill |
| `--gm-violet-700` | `#5B1CA6` | Strong button and selected-state base |
| `--gm-violet-600` | `#7C2AE8` | Main brand action |
| `--gm-violet-500` | `#993DF2` | Primary accent |
| `--gm-violet-400` | `#B96AFF` | Hover accent and icon highlight |
| `--gm-violet-300` | `#D5AEFF` | Soft accent / light-on-dark accents |
| `--gm-text` | `#F7F3FC` | Primary text |
| `--gm-text-secondary` | `#C8BDD7` | Body and secondary text |
| `--gm-text-muted` | `#9486A6` | Muted metadata; avoid for small critical text |
| `--gm-white` | `#FFFFFF` | High-contrast text and artwork framing |

### 3.2 Semantic colors

| Token | Hex | Intended use |
|---|---|---|
| `--gm-success` | `#39D98A` | Successful payment, delivered, enabled |
| `--gm-warning` | `#F5B84B` | Pending, scheduled, attention needed |
| `--gm-danger` | `#FF5E73` | Failed payment, destructive actions, sold out when appropriate |
| `--gm-info` | `#65B8FF` | Informational state |

Semantic colors are status indicators, not extra brand colors. Pair them with text/icons; never rely on color alone.

### 3.3 Gradients and glow

- **Primary CTA gradient:** `linear-gradient(110deg, #5B1CA6 0%, #7C2AE8 55%, #993DF2 100%)`.
- **Hero atmosphere:** radial violet light over a nearly black base, fading to transparent. Keep hero text and artwork readable.
- **Card accent:** a 1px violet-tinted border or subtle top highlight, not a thick luminous outline.
- **Glow:** use sparingly for the hero, logo, focus/selected states, and primary CTA hover. Example: `0 0 28px rgba(153, 61, 242, 0.16)`. Do not apply a large glow to every card or icon.
- Background texture (matrix digits, tiny geometric marks, particles) must remain low-contrast, non-interactive, and `aria-hidden`.

### 3.4 Contrast rules

- Body copy must remain comfortably readable against its surface.
- Do not use `--gm-text-muted` for small prices, important metadata, form labels, or critical status copy without checking contrast.
- For text on violet buttons, use a tested high-contrast foreground—normally white.
- Never communicate discount, stock, error, or success using color alone.

## 4. Typography

### 4.1 Font families

- **Arabic UI:** `IBM Plex Sans Arabic` or `Cairo`, with the first available bundled/loaded option chosen consistently.
- **Latin UI, price figures, and display text:** `Space Grotesk` or a similar geometric sans-serif.
- **Fallbacks:** `ui-sans-serif, system-ui, sans-serif`.
- Avoid mixing more than two font families. Avoid font weights that are not actually loaded.

### 4.2 Hierarchy

| Style | Desktop | Mobile | Weight / notes |
|---|---:|---:|---|
| Display / hero title | 48–64px | 32–40px | 700–800, tight line height |
| Page title | 30–36px | 26–30px | 700 |
| Section heading | 20–24px | 18–22px | 650–700 |
| Card title | 15–17px | 14–16px | 600–700 |
| Body | 14–16px | 14–16px | 400–500 |
| Metadata | 12–13px | 12px minimum | 400–500; maintain contrast |
| Price | 18–22px | 17–20px | 700, tabular numbers |

Use a consistent line-height; allow Arabic headings to breathe vertically. Avoid overly condensed type for Arabic. All-caps English display lettering may be used for the Gamers Matrix wordmark and short campaign text only.

## 5. Layout and spacing

### 5.1 Spacing scale

Use a 4px base scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`.

- Dense controls and metadata: 8–12px gaps.
- Cards: 12–16px internal gaps; 12–20px grid gaps.
- Main page sections: 24–40px vertical spacing.
- Large hero separation: 32–48px.
- Avoid arbitrary per-element spacing where a scale token fits.

### 5.2 Storefront desktop composition

- Use a near-black full-page canvas.
- A compact top header contains brand, search, wishlist, cart, and account actions.
- Preserve a visually distinctive **left-side desktop navigation rail** to echo the supplied reference, while the content itself uses correct Arabic RTL typography and reading order. Make the rail collapse to a drawer on smaller screens.
- The content area uses a responsive grid. The hero spans the main content width; featured products follow; a narrow weekly/offers panel may appear beside or below the product grid depending on available width.
- Keep the header and sidebar visually separated with subtle borders, not heavy boxes.
- Do not make the sidebar so wide that product content feels compressed.

### 5.3 Responsive behavior

- **Wide desktop (≥1440px):** header, desktop rail, hero, 4–5 product columns where art remains legible, optional campaign rail.
- **Laptop (1024–1439px):** desktop rail can become icon-plus-label compact; 3–4 product columns; campaign panel may move below products.
- **Tablet (768–1023px):** collapsible nav, 2–3 product columns, search still easy to access.
- **Mobile (<768px):** compact top bar, search entry, cart access, 2 columns only when cards stay readable otherwise 1 column; nav becomes drawer/bottom navigation; hero artwork crops intentionally; checkout controls stack vertically.
- **Small mobile (<380px):** prioritize text legibility and primary actions; avoid tiny side-by-side controls.
- Use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline-start`) for RTL-aware component styling.
- Do not create a permanently fixed element that covers content or important actions on mobile.

## 6. Shape, borders, shadows, and surfaces

- **Small controls:** 8–10px radius.
- **Inputs and buttons:** 10–12px radius.
- **Product cards and panels:** 12–16px radius.
- **Hero/promotional panels:** 16–22px radius.
- Use 1px borders with `--gm-border`. Stronger borders should mean selected, focused, or important—not simply decorative.
- Shadows should add depth, not a floating-card appearance everywhere. Prefer layered dark shadows with a very subtle violet tint only on emphasized surfaces.
- Keep surface hierarchy clear: background < surface < raised surface < popover/dialog.

## 7. Iconography and imagery

- Use one consistent icon library, preferably **Lucide** (or the equivalent already installed in the project). Do not mix outline, filled, emoji, and miscellaneous icon styles.
- Standard icons: 18–22px. Navigation icons: 20–24px. Decorative large icons: 28–36px.
- Always pair ambiguous icon-only buttons with an accessible label and usually a tooltip on desktop.
- Use authentic product/game artwork with correct rights/available assets, or clearly labeled placeholders during development. Do not use unrelated stock imagery for products.
- Use consistent art ratios by context: product cover/portrait around `3:4`; wide game/brand hero around `16:5` to `16:7`; square category thumbnails around `1:1`.
- Images use `object-fit: cover` or `contain` intentionally; avoid stretching. Reserve aspect-ratio space to prevent layout shift.
- Add meaningful alt text for informative images. Decorative background artwork uses empty alt text and/or `aria-hidden="true"`.
- If art cannot be sourced safely, create an attractive branded placeholder with the product title or category—do not invent a game cover that could mislead users.

## 8. Component specifications

### 8.1 Buttons

Variants:
- **Primary:** violet gradient/fill, white label, visible hover and focus.
- **Secondary:** dark raised surface with a subtle border.
- **Ghost:** transparent until hover; used for low-emphasis navigation/actions.
- **Danger:** semantic red reserved for destructive or irreversible actions.
- **Icon button:** fixed square hit-area, accessible name, visible hover/focus.

Rules:
- Minimum hit area: approximately 44×44px for touch controls.
- Provide default, hover, active, focus-visible, disabled, loading, and success/error feedback where relevant.
- Loading states must prevent duplicate submission and preserve useful button text (e.g., “جارٍ إتمام الطلب…”).
- Do not use the primary CTA style for every action in a panel.

### 8.2 Inputs and search

- Dark surface, subtle border, 10–12px radius, clear placeholder contrast, persistent accessible label.
- Focus uses a violet border and a restrained focus ring; do not remove keyboard focus.
- Search supports a clear button, loading state, empty state, keyboard navigation, and an explicit no-results state.
- Validation messages appear next to the input and are programmatically associated with it. Do not rely only on border color.
- For Arabic search, support Arabic text and Latin game/product names. Normalize input thoughtfully without silently changing visible user content.

### 8.3 Product card

A standard card should present, in order of visual importance:
1. Product artwork.
2. Optional small badge (sale/new/platform), with only one or two badges at most.
3. Product title.
4. Relevant platform/region/product type metadata.
5. Current price, optional former price and discount only when valid.
6. A clear add-to-cart or view-details action appropriate to the interaction model.

States: default, hover, focus, wishlisted, discounted, low stock, out of stock, loading. Do not show fake ratings or stock counts. Avoid placing too many actions over artwork. Ensure title height remains aligned across rows without clipping useful content.

### 8.4 Navigation

- Active item uses a restrained violet surface and an accent marker, not a full neon block on every navigation item.
- Use clear labels in Arabic. Group categories logically; do not expose every admin or catalog action in the main rail.
- Preserve visible cart count and wishlist state when real data exists. Counts must come from application data, not hardcoded demo values.
- Mobile navigation must provide a clear way to close a drawer and must not trap users outside the main content.

### 8.5 Badges and status chips

- Neutral first; semantic colors only where meaning requires them.
- Small, consistent padding and radius; use short text.
- Do not use badges for every metadata field or decorate every section heading.
- Discount badges reflect computed, valid pricing. Schedule/stock/publishing badges reflect persisted state.

### 8.6 Dialogs, drawers, and toasts

- Dialogs must have a title, description when needed, a clear close path, keyboard support, and focus management.
- Destructive confirmation must explain the consequence and name the affected item.
- Toasts confirm a result; they are not a substitute for inline validation or a visible order status.
- Use drawers on mobile for filters/cart/navigation where appropriate; avoid over-nesting dialogs.

### 8.7 Empty, loading, and error states

Every data-driven view must include:
- Loading skeleton or useful progress feedback.
- Empty state that explains what is missing and what to do next.
- Recoverable error state with retry when possible.
- Permission-denied state for protected admin routes.
- A real not-found state for removed or invalid product URLs.
- No endless spinners, blank sections, or generic “Something went wrong” without a next step.

## 9. Storefront information architecture

Recommended routes; adapt to an existing router instead of duplicating routes:

- `/` — Home, hero campaign, featured products, popular categories, new releases, offers, confidence/service strip.
- `/products` — Searchable/filterable catalog with sort and pagination or stable infinite loading.
- `/products/[slug]` — Product detail with artwork, price, platform, region, delivery details, description, availability, policies, related items.
- `/categories/[slug]` — Category listing.
- `/offers` — Active campaigns and valid discounts.
- `/search` — Search results and useful empty state.
- `/cart` — Editable cart, price summary, coupon entry, fees/tax messaging where applicable.
- `/checkout` — Contact/account detail, payment option, order review, clear final amount and consent.
- `/account` — Profile, orders, downloads/keys or fulfillment details, security settings, support links.
- `/orders/[orderNumber]` — Authorized order confirmation/detail; never expose another user's order.
- `/help`, `/contact`, `/terms`, `/privacy`, `/refund-policy` — Real content, editable through CMS when appropriate.

Storefront requirements:
- Header search should be prominent and usable on every important storefront route.
- Product filters should include only fields that exist in the product data model (e.g., category, platform, region, price, availability, type).
- Price formatting must be centralized and currency-aware. The reference image shows SAR, so SAR may be used in mock content, but production currency must come from configuration and real data—not be hardcoded throughout UI.
- Make platform/region compatibility explicit for products where it matters.
- Before checkout, clearly disclose delivery method and any region/platform restrictions.
- Do not imply an order is paid or a key is delivered until the backend confirms it.

## 10. Admin and advanced publishing system

### 10.1 Admin visual direction

- Use the same brand tokens, but optimize for dense, reliable work rather than cinematic marketing.
- Use clear data tables, compact form groups, breadcrumbs, predictable side navigation, filters, pagination, status chips, and confirmation dialogs.
- Keep admin navigation RTL-aware; when Arabic is active, use logical start/end placement (normally right-hand navigation) unless an existing design explicitly requires otherwise.
- The admin dashboard is not the storefront hero repeated. Keep charts/metrics concise and only show real computed data.
- Add a persistent indication that the user is inside **لوحة الإدارة**, with account/role context and a clear sign-out action.

### 10.2 Recommended admin areas

- **Overview:** sales/orders summary, revenue only when actually computed, latest orders, pending publication tasks, low-stock/inventory warnings.
- **Products:** create/edit/archive, rich descriptions, media, categories, tags, platform/region, product type, variants, price/currency, comparison price, delivery configuration, inventory, SEO, preview.
- **Publishing / Content Studio:** drafts, review, scheduled publication, published, archived; revision history; autosave indication; preview; slug; SEO title/description; social/OG image; internal notes; author/editor; publish/unpublish timestamps.
- **Campaigns and offers:** start/end schedule, coupon validity, redemption limits, eligibility, priority, and validation against sale price.
- **Orders:** searchable order list, payment state, fulfillment state, customer-visible status, audit trail, approved refund/cancel actions, retry only when safe.
- **Digital inventory / fulfillment:** encrypted-at-rest or provider-managed secret inventory where applicable; atomically reserve/assign an item only after verified successful payment; never show secret keys in logs or analytics.
- **Categories and navigation:** controlled taxonomy, ordering, visibility, SEO slug.
- **Media library:** upload, preview, dimensions/size, alt text, association to records, safe file validation, deletion protection for referenced media.
- **Customers and support:** least-privilege customer lookup, order context, internal notes with access control; never expose payment secrets.
- **Admin users and roles:** role-based access control with least privilege.
- **Settings:** store identity, logo, locale, currency, tax/price configuration, payment providers, email, policies, SEO defaults. Secret values must be managed server-side through environment/secret management, not displayed after saving.
- **Audit log:** who changed what and when, with sensitive values redacted.

### 10.3 Publication workflow

Use a real state machine, not a single `published` boolean if the product needs scheduling and review:

`draft → in_review → scheduled → published → archived`

Allow only valid transitions and explain them in the UI. Depending on permissions, `draft` may be published directly; record that action in the audit log. An editor must be able to save a draft without publishing. A scheduled item must become public only after server-side time/status evaluation. Editing a published item should create or preserve a revision so accidental changes can be reviewed or reverted.

Publication features:
- Draft autosave with a visible “Saving / Saved / Failed to save” status.
- Manual save and unsaved-change protection.
- Preview that reflects the selected locale and public storefront layout.
- Slug validation and conflict detection.
- Publication schedule with timezone shown explicitly.
- Publish/unpublish/archive confirmation where the action affects customers.
- Revision history, diff if practical, restore/revert flow, editor attribution, timestamps.
- SEO fields, search/snippet preview, social share image, canonical URL when needed.
- Validation errors grouped clearly and linked to relevant form fields.
- A failed background publication must be visible and retryable; never silently claim it published.
- Use server-side authorization for every action and validate state transitions on the server.

### 10.4 Admin data handling

- Paginated, filterable tables; avoid rendering unbounded lists.
- Confirm bulk actions and show exactly how many records will be affected.
- Use soft-delete/archive for business records unless permanent deletion is explicitly required and safe.
- Protect customer records and digital delivery secrets with strict role checks.
- Log changes and redact passwords, tokens, payment payload secrets, and digital keys.

## 11. Motion and interaction

- Motion should clarify hierarchy or confirm interaction—not serve as constant decoration.
- Typical durations: 120–180ms for hover/focus; 180–280ms for drawer/dialog; hero entrance can be slower but must remain restrained.
- Prefer opacity and transform animations; avoid costly continuous blur/filter animation.
- Use parallax or cursor-reactive effects only as optional, lightweight enhancement on capable desktop devices. Core content must not depend on them.
- Respect `prefers-reduced-motion`; provide a static equivalent.
- No autoplay sound, flashing, forced scrolling, fake cursor, or animation that delays shopping.
- Hover effects must have equivalent focus/active feedback on touch and keyboard.

## 12. Accessibility and localization

- Set the correct document language and direction for the selected locale (`lang="ar"`, `dir="rtl"` for Arabic; switch deliberately for English).
- Use semantic headings in order; each page has one clear main heading.
- Prefer CSS logical properties and explicit direction-aware behavior over manually reversing each element.
- Use `dir="ltr"` selectively for English names, email addresses, URLs, serial-like identifiers, card/order codes, and other LTR strings embedded in Arabic.
- Avoid Unicode direction hacks. Use appropriate isolation such as `<bdi>` or direction-aware wrappers for mixed content.
- Every field has an accessible label; every icon-only control has an accessible name.
- All functionality works with keyboard; focus is visible and not obscured.
- Provide meaningful validation and error descriptions.
- Never put important text only inside an image.
- Do not auto-switch the entire page direction based on a product name.

## 13. Content and product-data integrity

- Separate UI copy from business logic and persisted content.
- Product prices, currency, discount, stock, availability, platform compatibility, review score, and delivery status must come from real data or clearly identified development fixtures.
- Do not calculate or display a discount when the comparison price is missing, equal to, or below the current price.
- Do not publish a product publicly until required fields and valid delivery configuration are present.
- Do not store payment credentials or raw secrets in the client bundle.
- Use safe rendering for user-authored rich text; sanitize content before rendering HTML.
- Use stable IDs and slugs. Do not key interactive lists by array index if items can change order.
- Keep demo data visually credible but clearly segregated from production sources.

## 14. Technical implementation contract

Follow the existing repository's established stack and conventions when a project already exists. Do not replace working architecture just to match this document.

For a new empty project, a reasonable default is:
- **Web:** Next.js App Router, TypeScript strict mode, Tailwind CSS, reusable shadcn/ui-based primitives, Lucide icons.
- **API:** use the existing backend if present; if a separate API is warranted or already planned, NestJS with validated DTOs.
- **Data:** PostgreSQL and Prisma (or the project's current ORM).
- **Validation/forms:** shared schemas where practical, Zod or the existing validation standard, and accessible form handling.
- **Async jobs:** add Redis/queue infrastructure only when scheduled publication, email, or fulfillment needs it; avoid introducing needless infrastructure.
- **Payments:** provider adapter/hosted checkout when available; verify webhooks server-side. Never trust a client redirect as proof of payment.

Implementation rules:
- Inspect `AGENTS.md`, `README`, package manifests, route structure, UI components, env examples, database schema, and tests before modifying an existing repository.
- Reuse the existing package manager and design primitives.
- Keep tokens centralized and components composable.
- No hardcoded secrets; use environment variables and a safe `.env.example` with placeholders.
- Validate input on the server, enforce authorization on the server, and use transactions for order/payment/stock transitions.
- Make payment webhook processing idempotent.
- Keep public storefront queries separate from admin-only queries.
- Use safe pagination, server-side filtering, rate limiting where appropriate, and structured error handling.
- No pretend API integration: if a provider credential is unavailable, create a clear interface/adapter and report what is not configured. Do not claim live payments work until tested in provider sandbox.
- Avoid a large refactor unrelated to the requested phase.

## 15. Performance and SEO

- Optimize product artwork and hero media; define image dimensions/aspect ratios to prevent layout shifts.
- Avoid loading admin-only code or heavy chart packages in the public storefront.
- Use server rendering and caching appropriately for public catalog content while ensuring private carts/orders are never publicly cached.
- Add metadata and share previews to public product/category/campaign pages.
- Use meaningful, stable, localized URLs/slugs; generate a sitemap and robots policy appropriate to the real site.
- Ensure loading states don't jump the layout.
- Do not preload every image; prioritize only the hero/first visible critical artwork.

## 16. Design acceptance checklist

A screen is not considered finished until all relevant checks pass:

- [ ] Uses the semantic Gamers Matrix tokens; no random hex codes in components.
- [ ] Matches the dark-plum/violet brand without excessive glow.
- [ ] Has clear hierarchy and a single obvious primary action for the main task.
- [ ] Arabic layout direction and mixed English/number formatting are correct.
- [ ] Works at mobile, tablet, laptop, and wide desktop widths.
- [ ] Has hover, focus-visible, active, disabled, loading, empty, and error states where relevant.
- [ ] Keyboard and screen-reader labels are meaningful.
- [ ] Product/campaign/pricing claims use real data or explicit development fixtures.
- [ ] Artwork ratio, crop, and alt text are intentional.
- [ ] No horizontal overflow, clipped text, layout shift, or covered actions.
- [ ] Uses reusable components instead of copying one-off markup.
- [ ] No console errors, type errors, broken routes, or failing relevant tests.

## 17. Non-negotiable rules for every future prompt

1. Read this file before making UI changes.
2. Treat the existing app as the source of truth for established architecture; inspect before replacing anything.
3. Build complete, functional states—not only screenshots or static decorative mockups.
4. Do not implement every page with the same generic card layout. Use the appropriate pattern for catalog, details, checkout, tables, and editors.
5. Do not invent data, prices, reviews, metrics, assets, integrations, or successful payment/publication events.
6. Work only on the requested phase, run the relevant checks, summarize files changed and actual test results, and stop before the next phase unless instructed.
7. When a design exception is necessary, explain it and update this system only with explicit approval.
