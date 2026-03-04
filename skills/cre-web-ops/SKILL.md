---
name: cre-web-ops
description: Operate and troubleshoot the CRE web app deployment (UI, auth, network exposure, tunnel, and container health). Use when changing CRE UI, checking external accessibility, fixing login/runtime issues, or safely hardening CRE networking without breaking access.
---

# CRE Web Ops

## Current known architecture (baseline)

- Stack: Next.js frontend + Java backend (Spring) + Postgres auth DB + Nginx + cloudflared.
- Containers commonly used:
  - `cre-frontend`
  - `cre-backend`
  - `cre-auth-postgres`
  - `cre-nginx`
  - `cre-cloudflared`
- Frontend auth is password-only mapping (no email UI field).
- API implementation should remain Java.

## Security / exposure baseline

- Keep OpenClaw gateway local loopback unless explicitly needed.
- Keep CRE reachable via Nginx/Tunnel path, but minimize exposed host ports.
- `cre-auth-postgres` should NOT be host-exposed by default (container-only networking preferred).
- Verify CRE still works after any hardening step:
  - local: `curl -I http://127.0.0.1/login`
  - external tunnel URL if applicable.

## UI and product decisions to preserve

- Data-first direction (not KPI-only storytelling).
- Buildings Overview removed:
  - summary KPI cards
  - search box
  - category filter chips
- Building detail page removed top shortcut cards:
  - 樓層明細 / 租戶明細 / 租約明細 / 維修流程
- Labeling preference:
  - use 「門牌 / 戶號」 instead of full address-heavy wording.
- Repairs page redesigned as Kanban + right-side detail panel.

## Operational rules

1. Before changing infra/UI, record current state:
   - `docker ps --format 'table {{.Names}}\t{{.Ports}}'`
   - core page checks (`/login`, `/buildings`).
2. Make one reversible change at a time.
3. Re-verify app availability after each step.
4. If tunnel is flaky, fix transport/runtime first, then re-check URL reachability.

## Cloudflare Tunnel notes

- Quick Tunnel URLs can rotate when container is recreated.
- Always report the latest reachable URL after restart.
- If logs show repeated serve/control-stream failures, treat as tunnel health issue and re-establish connection with minimal blast radius.

## Delivery checklist (for any CRE change)

- What changed (files/containers/settings)
- Why changed
- Verification evidence (build/test/http checks)
- Rollback step
- Commit hash + link

## Guardrails

- Do not expose DB/admin services publicly unless explicitly approved.
- Do not break CRE accessibility while hardening.
- No hardcoded secrets in repo files.
