# PCB Manufacturing ERP — Master UI/UX Design Brief
### Phase 1 — Visual System, Interaction Design & Screen-Level Guidance

| | |
|---|---|
| **Document Type** | Master UI/UX Design Brief (merged from two prior drafts) — design companion to the PRD, TRD, and App Flow |
| **Companion Documents** | `PCB_ERP_Master_Spec.md` (PRD) · `PCB_ERP_Master_TRD.md` (TRD) · `PCB_ERP_Master_App_Flow.md` (App Flow) |
| **Project** | ERP for PCB Manufacturing |
| **Status** | Ready for component-library build — one open question on brand colour (§11) |
| **Version** | 1.0 (Merged) |
| **Date** | July 2026 |

---

## 0. Note to the Building Agent (Antigravity)

This is the fourth and final document in the set. It turns the screens defined in `PCB_ERP_Master_App_Flow.md` into an actual visual system. Read the App Flow doc first — every screen named there gets built using the tokens and components defined here.

How to use this document:
- **§4 is the design-token source of truth** — colours, type, and the signature Trace-Line component. Build these as reusable tokens/components first, not per-screen one-offs.
- **§6 (Key Screen UX Guidance)** gives concrete, testable behavior for the highest-traffic screens (e.g. "default quantity-forwarded to the full quantity received") — treat these as functional requirements, not cosmetic suggestions.
- **§9 ("What This Brief Deliberately Avoids")** is a real constraint list — if a generated screen matches one of those patterns, it's wrong, regardless of how polished it looks.
- The two source drafts proposed **two different colour palettes**. This document resolves that into one recommended system (§4.1) so you have a single answer to build against — the alternative is kept only as context for the client conversation in §11, not as something to build.
- Build order: **component library first** (§12), matching the App Flow's screen inventory and the TRD's milestone order — Trace-Line Tracker, Data Table, Movement Update Form, and Kanban Card are reused across nearly every screen, so get those right before wiring up individual pages.

---

## 1. Purpose & Design Thesis

This brief gives the design and frontend team the context, principles, and visual direction needed to turn the App Flow Document into wireframes and high-fidelity screens. It sets constraints and priorities so design decisions serve the actual users — factory floor staff, office-based admins, and external customers — rather than replacing designer judgment outright.

**The core idea:** this is not a marketing product — it's a **factory floor instrument** used across three very different contexts: a data-dense admin desk, a fast one-handed shop-floor scan, and a calm customer-facing status view. One visual language has to flex across all three without breaking.

The system borrows the product's own visual DNA. A PCB is copper traces carrying signal from point to point in a defined sequence — that's *literally* what a Job Card does as it moves stage to stage. The signature visual element is a **trace-line stage tracker** (§4.5) — a circuit-trace-styled progress path that every Job Card, Sub-Job Card, and Customer order view uses to show "where is this right now." It's not decoration; it's the single visual metaphor tying Admin, Mobile, and Customer Portal together.

---

## 2. Users & Context of Use

| Platform | Who | Environment | Design Implication |
|---|---|---|---|
| **Internal Web App** | Admin, Production Manager | Office desk, mouse + keyboard, large monitor | Can support denser layouts, tables, multi-field forms |
| **Mobile App / PWA** | Process/floor users, delivery staff | Shop floor — gloves, ambient noise, bright/dim lighting, shared devices, one-handed use | Large touch targets, minimal typing, high contrast, forgiving tap zones |
| **Customer Portal** | External customers | Any device, unfamiliar with internal jargon, first impression of the client's brand | Clean, trustworthy, jargon-free, mobile-responsive by default |

---

## 3. Design Principles

- **Speed over polish on the floor** — the Movement Update screen (App Flow, Journey D) will be used hundreds of times a shift; every unnecessary tap has a real productivity cost.
- **Status should be readable at a glance** — colour-coded badges for job card and stage status, so a supervisor can scan a screen without reading every row.
- **Never let the customer see internal mess** — the portal shows a simplified, confident view of progress; internal rejection detail and process names stay internal (this is a hard requirement — see App Flow §8).
- **Numbers are the product** — this is a quantity-tracking system; every screen that shows or asks for a quantity (received / processed / forwarded / rejected) must make those four numbers visually distinct, so users don't misplace a number under time pressure.
- **Design for interruption** — floor workers get pulled away mid-task; forms should autosave drafts or make it visually obvious that a step is incomplete when the user returns.
- **Motion only where it communicates state change** — this is a working tool, not a showcase (see §5). If removing an animation loses no information, cut it.

---

## 4. Visual System

### 4.1 Colour Palette — Recommended Direction

The system uses a clean, modern, and trustworthy aesthetic, adapted from the new dashboard design. Deep navy provides a strong, professional anchor for the sidebar, while a neutral slate background ensures readability for data-dense tables. Bright blue acts as the primary accent for actions and active states.

| Name | Tailwind Class (Approx. Hex) | Use |
|---|---|---|
| **Deep Navy** | `bg-[#0f172a]` (slate-900) | Main sidebar background |
| **Slate Base** | `bg-slate-100` | Base background — neutral, easy on the eyes for long admin shifts |
| **Primary Text** | `text-slate-800` / `text-slate-900`| Primary text, headings, data values |
| **Muted Text** | `text-slate-500` / `text-slate-400`| Secondary text, table headers, inactive icons |
| **Brand Blue** | `blue-600` | Primary accent — CTAs, active nav items, key highlights |
| **Success Green** | `green-600` / `teal-600` | Completed stages, success states, insurance |
| **Warning Orange** | `orange-600` | Pending/idle stages, warnings |
| **Alert Red** | `red-600` | Rejections, errors, blocked jobs |

> This colour system replaces the previous Copper/Graphite proposal, moving towards a cleaner, more standard SaaS dashboard aesthetic optimized for data density and clarity.

#### Status Badge Convention (use identically across web and mobile)
| Status | Colour | Applies To |
|---|---|---|
| Completed / Forwarded / Delivered | Confirm Green | Stage status, dispatch status |
| Pending / In Progress / In Transit | Warning Amber | WIP, pending quantity, in-transit dispatch |
| Rejected / Failed / Blocked | Alert Rust | Rejected quantity, failed delivery, blocked access |
| Not Started / Inactive / Discontinued | Graphite Ink at low opacity (grey) | Un-launched job cards, deactivated users/products |

### 4.2 Typography

| Role | Typeface | Suggested Size (web) | Use |
|---|---|---|---|
| Display | Inter (Bold) | 28–32px, bold | Dashboard headline numbers |
| H1 | Inter (Bold) | 20–24px, bold | Screen titles (e.g. "Clients") |
| H2 | Inter (Semibold) | 16-18px, semibold | Section headers within a screen |
| Body / UI | Inter (Regular/Medium) | 14px, regular | All UI text, forms, tables, descriptions — neutral, highly legible |
| Caption | Inter (Regular) | 12px, regular, muted | Timestamps, helper text, badges |
| Data | Inter (Medium) | 14px, medium | Job Card numbers, Spec Card IDs, quantities |

**Rule:** The entire application utilizes the 'Inter' font family for a cohesive, modern look. Numeric data and identifiers should be distinct but do not strictly require a monospace font if tabular lining numerals are used in Inter.

### 4.3 Layout Concept per Surface

```
ADMIN WEB (data-dense)          MOBILE/PWA (shop floor)         CUSTOMER PORTAL (calm)
┌─────────────────────┐         ┌─────────────┐                 ┌─────────────────────┐
│ Nav │ Filters        │         │  Big scan    │                 │   Order card         │
│─────┼────────────────│         │  button      │                 │   with trace-line    │
│     │ Dense table /   │         │  (thumb      │                 │   showing stage       │
│     │ Kanban view     │         │  zone)       │                 │   progress            │
│     │ trace-line per  │         │              │                 │                       │
│     │ row              │         │  Prefilled   │                 │   Minimal, generous   │
│                       │         │  qty form    │                 │   whitespace, no      │
└─────────────────────┘         │  (large      │                 │   internal jargon     │
                                  │  touch       │                 └─────────────────────┘
                                  │  targets)    │
                                  └─────────────┘
```

- **Admin:** information-dense, tables and kanban, low motion, optimized for fast scanning over an 8-hour shift.
- **Mobile / PWA:** the opposite extreme — one primary action per screen, large tap targets (min 44×44px), minimal text, optimized for an operator wearing gloves glancing at a phone between tasks.
- **Customer Portal:** the calmest of the three — generous whitespace, no internal codes/jargon exposed beyond the Job identifier, trust-building tone.

### 4.4 Signature Element — The Trace-Line Stage Tracker

A horizontal (desktop) or vertical (mobile) line styled like a PCB copper trace, with **nodes** at each stage:

```
●━━━━●━━━━●━━━━○┈┈┈┈○┈┈┈┈○
Stage1 Stage2 Stage3  Stage4  Stage5
(done) (done) (active) (pending)(pending)
```

- Completed segments: solid Copper Signal line, filled node.
- Active segment: filled node with a subtle pulse (see §5).
- Pending segments: dotted Graphite Ink at low opacity, hollow node.
- Rejected quantity at a stage: small Alert Rust badge on that node, not a broken line — a rejection annotates the flow rather than derailing the whole visual.

This single component appears in: **Admin Job Card detail, Admin Kanban card (mini version), Mobile scan result screen, Customer Portal order detail** (App Flow §4, Journeys D, E, I). One component, four contexts, one visual grammar — this is the thread that makes the system feel designed rather than assembled from generic UI-kit defaults.

---

## 5. Animation & Motion

Motion is used **only where it communicates state change**. Rule of thumb: if removing the animation loses no information, cut it.

| Moment | Animation | Purpose |
|---|---|---|
| **Stage forward movement** (a trace-line segment goes from active → done) | The copper line "fills in" left-to-right over ~400ms, like current flowing through a trace | Reinforces the core metaphor exactly when it matters most — a quantity moving forward |
| **QR scan success** (mobile) | Quick green checkmark scale-in (150ms) + light haptic if available | Fast, unambiguous confirmation for a gloved hand glancing at a screen |
| **QR scan error** | Gentle shake on the scan frame, Alert Rust border flash | Communicates "try again" without being alarming |
| **New rejection logged** | Rust badge pops onto the relevant stage node (150ms scale-in) | Draws the eye to the exception once, not repeatedly |
| **Dashboard KPI numbers on load** | Numbers count up from 0 (~600ms, only on first load per session) | Small polish moment on the Admin home — not repeated on every refresh |
| **Kanban card moving stage** | Card slides to new column (~300ms ease-out) if the user is watching live | Confirms the action landed, avoids a jarring instant jump |
| **Everything else** (page nav, table sort, filters) | No custom animation — instant or default browser transition | Admin users doing repetitive data work should never wait on decorative motion |

**Reduced motion:** all of the above must degrade gracefully to instant state changes when `prefers-reduced-motion` is set — factory tablets/older Android devices are a realistic constraint here, not just an accessibility checkbox.

---

## 6. Key Screen UX Guidance

Cross-referenced to the App Flow document's journeys.

### 6.1 Movement Update Screen (mobile) — highest priority (App Flow Journey D, step 5)
- Default the quantity-forwarded field to the full quantity received, so the common case (no rejection, full forward) is a single tap to confirm.
- Use large numeric stepper controls, not a keyboard, for quantity fields.
- Rejection reason should be a short predefined list (dropdown/chips) with an "Other" free-text fallback — faster than typing and gives cleaner data for the rejection reports (`FR-6.1`).
- Show a persistent running total (received vs. accounted for) so the user visually confirms `qty_processed + qty_rejected = qty_received` before submitting.

### 6.2 Scanner Screen (mobile) (App Flow Journey D, steps 2–3)
- Full-screen camera view, no chrome competing for attention.
- Auto-navigate to the Sub-Job-Card screen the instant a valid code is recognized — no manual "confirm scan" step (matches App Flow §8's hard requirement).
- Clear error state for an invalid or already-completed code — a mis-scan on the floor should never silently fail.

### 6.3 Job Card / Stage Detail (web) (App Flow Journey E)
- Show the sub-job-card split visually — a simple horizontal bar or stepper showing how the original quantity has divided across stages communicates the split logic faster than a table alone.
- Surface rejections inline with a red indicator rather than requiring a separate report view to notice them.

### 6.4 Reports (App Flow Journey F)
- Default to "Today" / "This shift" view with quick date-range presets (Today, This week, This month) rather than a bare date picker.
- Every report table should support export in one click — this is a stated requirement (`FR-6.1`) and a common daily action for supervisors.

### 6.5 Customer Portal (App Flow Journey I)
- Lead with a simple progress indicator (e.g. "Stage 4 of 10") rather than internal process names the customer won't recognize.
- Use plain-language status labels: "In production," "Ready to dispatch," "On the way," "Delivered" — not internal enum values.
- EDD should be visually prominent on the order list — it's the single most-asked question customers have.

---

## 7. Interaction & Copy Principles

- **Buttons say what happens, not generic verbs:** "Launch Job," "Forward to Stage 4," "Confirm Delivery" — not "Submit" everywhere. The button label and the resulting confirmation message use the same verb ("Launched," not "Success").
- **Errors are specific, not apologetic:** "Qty forwarded (600) exceeds qty received (500)" — not "Something went wrong."
- **Empty states are instructional, not decorative:** "No products yet — create your first Product Spec Card to get started," with a direct CTA — not an illustration-first empty state. This is a working tool, not a consumer app.
- **Customer Portal tone is a notch warmer** than Admin — plain language ("Your order is currently in production, Stage 6 of 10") instead of internal terms like "sub-job-card" or "WIP."

---

## 8. Accessibility & Quality Floor

- Minimum contrast ratio 4.5:1 for all text on Slate Field / Graphite Ink combinations — verify Copper Signal on white passes for small text; use it primarily for larger elements/icons if it doesn't.
- All interactive elements have a visible keyboard focus state (Copper Signal outline).
- Mobile touch targets minimum 44×44px throughout — critical given gloved-hand use on the floor.
- Colour is never the only signal — rejection/pending/complete states pair colour with an icon or label, not colour alone (colourblind operators, harsh factory lighting).
- Web app tables support keyboard navigation for power users (Admin/Production Manager doing high-volume data entry).
- Customer Portal must meet basic WCAG AA contrast standards — it represents the client's brand to external customers.
- Responsive down to a small Android device screen (common on the factory floor) — Admin dashboard degrades to a simplified card list below tablet width, rather than a squeezed table.

---

## 9. What This Brief Deliberately Avoids

- No cream-background/serif-display/terracotta-accent look — too soft and editorial for a factory tool, and it's become an AI-design cliché.
- No dark-mode-with-neon-accent look — reads as a dev tool or SaaS analytics product, not a manufacturing instrument.
- No numbered-step markers as decoration outside of the actual Process Flow — numbering is reserved for real sequences (stages), not used generically on cards/features where it wouldn't encode real order.
- No animation for animation's sake on the Admin surface — operators doing this eight hours a day will find idle motion fatiguing, not delightful.

---

## 10. Design Deliverables Expected

- Low-fidelity wireframes for all screens listed in the App Flow document's Screen Inventory (App Flow §5).
- High-fidelity mockups for the five highest-priority screens: Movement Update, Scanner, Job Card Detail, Dashboard, Customer Portal Order Detail.
- A basic component library (buttons, status badges, form fields, quantity stepper, data table, Trace-Line Tracker, Kanban Card) reusable across web and mobile.
- Redlines/spacing spec handoff for frontend implementation, consistent with §4's typography and colour system.

---

## 11. Open Questions for Client

1. Does the client have **existing brand guidelines** (logo, colour, typography) that should override the proposed Copper Signal palette in §4.1?
2. Are factory-floor devices **client-provided** (known screen size/OS) or BYOD — this affects how conservatively the team should design for device variance.
3. Should the Customer Portal carry the client's **own branding only**, or also acknowledge the ERP platform itself (relevant if this system is eventually offered to other manufacturers)?

---

## 12. Next Steps

1. Build a small **component library first**: Trace-Line Tracker, Data Table, Movement Update Form, Kanban Card — these four are reused across almost every screen in the App Flow document.
2. Prototype the **Trace-Line Tracker animation** early and test it on an actual low-end Android device (not just desktop Chrome) — it's the signature element and needs to perform well on factory-floor hardware.
3. Once the component library is approved, wire it into the screens defined in the App Flow document, surface by surface (Admin → Mobile → Customer Portal), matching the build priority set by the TRD's milestones.
