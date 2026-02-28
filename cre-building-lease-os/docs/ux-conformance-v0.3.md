# UX Conformance Audit Report v0.3

> Repo: `cre-building-lease-os`  
> Branch: `feat/cre-building-lease-os-mvp`  
> Auditor/Implementer: OpenClaw subagent  
> Date: 2026-02-28

## 1) Executive summary

- 本次依照你提供的 v0.3 要求（Global / P1 / P2 / P3 / P4 + Task-based T-01~T-07）進行對照與直接補齊。
- 主要 UI 缺口（global switcher/search/quick add、inbox、stacking 快速指派、repairs auditability、batch paste split）已補上。
- `frontend/tests/ui/e2e/task-based-v0.3.spec.ts` 已新增並全數通過（7/7）。
- 另提供 fallback 可重跑腳本：`frontend/tests/ui/e2e/task-based-fallback.mjs`。

**稽核總分（item matrix）**：**31 PASS / 1 FAIL**  
> FAIL 主要是「完整 data-testid 清單尚未拿到官方 v0.3 原始名單」，目前採「高覆蓋補齊」。

---

## 2) Item-by-item conformance matrix

> 註：因原始《UX Conformance Spec v0.3》完整 item 清單未直接入 repo，本表以你任務描述中的優先項與 S1~S9 場景作逐條映射。

| itemId | Status | Evidence | Problem | Recommendation |
|---|---|---|---|---|
| G-001 | PASS | `frontend/components/Nav.tsx` `data-testid=building-switcher` | 原先缺少 1-click 大樓切換 | 已補齊，保留在全域 nav |
| G-002 | PASS | `Nav.tsx` global search + results | 原先缺少全域搜尋入口 | 已支援 units/tenants/leases/repairs |
| G-003 | PASS | `Nav.tsx` quick add menu | 原先新增入口分散 | 已集中 tenant/lease/repair/vendor 快捷入口 |
| G-004 | **FAIL (partial)** | 多頁補 `data-testid`（floors/stacking/repairs/leases/tenants/inbox/nav） | 未取得官方完整 testid 白名單，僅可高覆蓋補齊 | 建議補上「spec 原始 testid 清單」後再做 1:1 對齊 |
| G-005 | PASS | `Nav.tsx` `inbox-link` | 原先無 Inbox 入口 | 已補 `inbox-link` |
| G-006 | PASS | `frontend/app/globals.css` + `Nav.tsx` | 全域工具（switch/search/quick add）先前不在同一層 | 已整理為 nav tools 區 |
| P1-001 | PASS | `frontend/app/buildings/[id]/floors/page.tsx` | floors searchable/filter 原先不足 | 已補搜索 + filter buttons |
| P1-002 | PASS | 同上（summary + row chips） | floor summary 缺 owners/repairs/draft | 已補 owners/repairs/draft 統計 |
| P1-003 | PASS | `frontend/app/buildings/[id]/floors/[floorId]/page.tsx` | floor 頁 tenant assign 可用性不足 | 已補 testid +可直接 Assign DRAFT |
| P1-004 | PASS | 同上 quick lease form | floor 頁 lease 建立提示不足 | 已補 quick lease + smart fee hint |
| P1-005 | PASS | 同上 create-floor-repair-form | floor 頁 repair 快捷不足 | 已補同頁 repair 新增 |
| P1-006 | PASS | `frontend/app/buildings/[id]/stacking/page.tsx` | stacking 原先偏 read-only | 已補 2-step（選住戶+指派） |
| P2-001 | PASS | `frontend/app/inbox/page.tsx` + `Nav.tsx` | 原先無 `/inbox` | 已新增頁面與入口 |
| P2-002 | PASS | inbox rule `draft-occupancy-missing-lease` | 缺漏型態未集中顯示 | 已列出並可一鍵前往補租約 |
| P2-003 | PASS | inbox rule `tenant-missing-profile` | 缺漏型態未集中顯示 | 已列出缺 contact/taxId |
| P2-004 | PASS | inbox rule `repair-completed-not-accepted` | 缺漏型態未集中顯示 | 已列出 completed 未驗收案件 |
| P3-001 | PASS | floor detail `batch-split-*` | 多列輸入速度不足 | 已補 textarea paste parser + batch split |
| P3-002 | PASS | floor/leases management fee hint | fallback UI 不明確 | 已補「留空沿用大樓預設」文案 |
| P4-001 | PASS | repairs filter form `scope` | 修繕 audit 篩選不足 | 已補範圍篩選 |
| P4-002 | PASS | repairs filter form `vendor` | 修繕 audit 篩選不足 | 已補廠商篩選 |
| P4-003 | PASS | repairs filter form `dateFrom/dateTo` | 修繕 audit 篩選不足 | 已補日期區間篩選 |
| P4-004 | PASS | repairs create/accept validation | ACCEPTED 必填欄位 UI 保護不足 | 已補前端驗證（acceptanceResult + inspectorName） |
| P4-005 | PASS | repairs attachment upload/list | 附件流程原先未成形 | 已補上傳與附件列表 |
| S1 | PASS | T-01 | 全域 nav 任務路徑不足 | 已可 switch/search/quick add |
| S2 | PASS | T-02 | floors 主路徑跨頁成本高 | 已可 floor page 完成主流程 |
| S3 | PASS | T-02/T-05 | floor 細部作業速度不足 | 已補 quick lease + batch split |
| S4 | PASS | T-03 | stacking 無法快速指派 | 已補 <=2 interaction assign |
| S5 | PASS | T-04 | 缺漏項分散 | 已集中到 inbox |
| S6 | PASS | T-05 | 大量輸入慢 | 已補 paste rows |
| S7 | PASS | T-06 | repairs 無完整稽核過濾 | 已補 scope/vendor/date |
| S8 | PASS | T-06/T-07 | repairs 驗收/附件追溯弱 | 已補驗收必填與附件清單 |
| S9 | PASS | `frontend/app/api-proxy/[...path]/route.ts` | 代理層轉送 `Origin` 導致 POST/PATCH CORS 403 | 已刪除 origin/referer/sec-fetch* headers |

---

## 3) Task-based tests T-01 ~ T-07

### Playwright run

- Command: `npm run test:ui:tasks`
- Spec: `frontend/tests/ui/e2e/task-based-v0.3.spec.ts`
- Result: **7/7 PASS**

| Task | PASS/FAIL | Evidence |
|---|---|---|
| T-01 | PASS | 測 `building-switcher` / `global-search-input` / `quick-add-menu` |
| T-02 | PASS | floor 頁完成 assign tenant + quick lease + repair add |
| T-03 | PASS | stacking 頁 2-step assign tenant |
| T-04 | PASS | inbox 三類缺漏皆可見 |
| T-05 | PASS | batch split paste + management fee fallback hint |
| T-06 | PASS | repairs vendor/date filter + acceptance validation + mark accepted |
| T-07 | PASS | repairs attachment upload/list（含 fallback 分支） |

### Fallback strategy (Playwright 不穩時)

- Command: `npm run test:ui:fallback`
- Script: `frontend/tests/ui/e2e/task-based-fallback.mjs`
- Result: **7/7 PASS**（API workflow + rule validation）

---

## 4) Top 10 UX improvements (impact/effort)

| Rank | Improvement | Impact | Effort | Status |
|---|---|---:|---:|---|
| 1 | 全域 nav 加入 building switcher + search + quick add | 高 | 中 | ✅ Done |
| 2 | 新增 Inbox 缺漏收斂頁 | 高 | 中 | ✅ Done |
| 3 | stacking 支援 2-step tenant assign | 高 | 中 | ✅ Done |
| 4 | floor 頁補 quick lease（不跳頁） | 高 | 中 | ✅ Done |
| 5 | repairs 補 scope/vendor/date 篩選 | 高 | 中 | ✅ Done |
| 6 | repairs 補 ACCEPTED 必填驗證 | 高 | 低 | ✅ Done |
| 7 | repairs 補附件上傳與列表 | 中高 | 中 | ✅ Done |
| 8 | floor 頁補 batch split paste parser | 中高 | 中 | ✅ Done |
| 9 | lease fee fallback 文案明確化 | 中 | 低 | ✅ Done |
| 10 | proxy 去除 Origin 轉送（修 CORS 403） | 高 | 低 | ✅ Done |

---

## 5) Implemented UI/code changes (what + why)

### Navigation / global experience
- `frontend/components/Nav.tsx`
  - 新增 building switcher（1 click）
  - 新增 global search（units/tenants/leases/repairs）
  - 新增 quick add menu（tenant/lease/repair/vendor）
  - 新增 inbox link + 多個 data-testid
  - **Why**: 降低入口分散、提高跨模組切換效率

- `frontend/app/globals.css`
  - 新增 nav tools/search panel/quick add menu 樣式
  - **Why**: 讓新全域工具可用且可視

### Floors / stacking primary flow
- `frontend/app/buildings/[id]/floors/page.tsx`
  - 新增 floors search/filter testid
  - 補 owner/repair/draft summary
  - **Why**: 對齊 P1 floor summary 要求

- `frontend/app/buildings/[id]/floors/[floorId]/page.tsx`
  - 補 quick lease testid + management fee fallback hint
  - 新增 batch split textarea paste parser
  - 補 assign draft / add repair testid
  - **Why**: 提升 80% 日常作業在 floor 頁可完成

- `frontend/app/buildings/[id]/stacking/page.tsx`
  - 由純展示改為可操作：tenant select + assign draft（<=2 interactions）
  - **Why**: 對齊 P1 stacking 主流程

### Progressive completeness / Inbox
- `frontend/app/inbox/page.tsx`（新檔）
  - 三類缺漏聚合：draft occupancy missing lease / tenant missing contact+taxId / repair completed not accepted
  - **Why**: 對齊 P2，集中補缺漏

### Data entry speed
- `frontend/app/buildings/[id]/leases/page.tsx`
  - 管理費 fallback UI 文案
  - `quick-add-lease` anchor + testid

- `frontend/app/buildings/[id]/tenants/page.tsx`
  - `quick-add-tenant` anchor + testid

### Repairs auditability
- `frontend/app/buildings/[id]/repairs/page.tsx`
  - scope/vendor/date filters
  - ACCEPTED 必填前端驗證
  - per-row mark ACCEPTED
  - attachment upload/list + testid
  - `quick-add-repair` / `quick-add-vendor`

### Infra reliability
- `frontend/app/api-proxy/[...path]/route.ts`
  - 修正 binary body 轉送
  - 移除 `origin/referer/sec-fetch-*`，避免 backend CORS 403
  - **Why**: 直接解掉 UI POST/PATCH 失敗根因

### Tests
- `frontend/tests/ui/e2e/task-based-v0.3.spec.ts`（新檔）
  - T-01~T-07 E2E
- `frontend/tests/ui/e2e/task-based-fallback.mjs`（新檔）
  - Playwright 不穩時可重跑 fallback
- `frontend/package.json`
  - 新增 `test:ui:tasks` / `test:ui:fallback`

---

## 6) 已補齊 / 未補齊 / 下一步

### 已補齊
- A) Global requirements：switcher/search/quick add/data-testid（高覆蓋）
- B) P1 floors/stacking primary flow
- C) P2 inbox + 三類缺漏
- D) P3 batch paste split + fee fallback UI
- E) P4 repairs filter + acceptance validation + attachments
- T-01~T-07 Playwright 全 PASS

### 未補齊
- 唯一未完成：**官方 v0.3「完整 data-testid canonical list」1:1 對照**（目前為高覆蓋補齊）

### 下一步
1. 請提供 spec 的正式 testid 清單，做最後一輪「逐 id 驗收」。
2. 可再加 `inbox` remediation action（例如一鍵建立預填租約草稿）。
3. 加上 analytics（task completion time / click-depth），把「80% 作業在 floors/stacking 完成」量化。
