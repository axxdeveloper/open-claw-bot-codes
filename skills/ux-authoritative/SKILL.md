---
name: ux-authoritative
description: Review and improve UI/UX using authoritative standards (NN/g, Material, Apple HIG, Fluent, Atlassian, WCAG 2.2). Use when auditing product UX, prioritizing design fixes, or validating redesign quality with evidence-based criteria.
---

# UX Authoritative Review

## Goal
Produce concrete UX improvements backed by recognized standards, not personal preference.

## Standards sources (priority)
1. Nielsen Norman Group (usability heuristics)
2. WCAG 2.2 (accessibility, keyboard/focus/contrast)
3. Material Design (interaction/layout patterns)
4. Apple HIG (clarity/feedback/platform behaviors)
5. Microsoft Fluent (consistency/state/system)
6. Atlassian Design System (content hierarchy/component behavior)

## Required output format
For every audit, output 3 sections:

1) **Findings (ranked P0/P1/P2)**
- issue
- affected screen/flow
- violated standard (source + principle)
- user impact

2) **Fix plan (actionable)**
- exact change (component/text/layout/state)
- acceptance criteria (verifiable)
- risk/rollback note

3) **Verification checklist**
- keyboard navigation works (tab order/focus visible)
- color contrast meets WCAG target
- empty/loading/error states are explicit
- mobile and desktop layouts both validated
- destructive actions have guardrails

## Severity model
- **P0**: blocks completion, high error risk, security/privacy confusion
- **P1**: major friction, repeated misclicks, low trust
- **P2**: cosmetic or minor clarity issue

## Anti-patterns (forbidden)
- Vague advice like “make it cleaner” without concrete change.
- Style-only comments without user impact.
- Ignoring accessibility basics (focus, contrast, semantics).
- Mixing unrelated large redesign into a bug-fix PR.

## CRE-specific focus points
When used on CRE pages, always check:
- data-first readability (table/card density and scanability)
- consistency of labels (e.g., 門牌/戶號 wording)
- cross-page navigation consistency (breadcrumb/action placement)
- edit flow safety (inline edit/save/cancel feedback)
- mobile fallback for dense data screens
