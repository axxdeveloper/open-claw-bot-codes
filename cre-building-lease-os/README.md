# cre-building-lease-os

商辦租賃作業系統 MVP（Java Backend + Next.js Frontend，前後端分離）。

---

## 1) 架構

### 系統拓樸

```text
[ Next.js Frontend :3000 ]
           |
           | REST /api/*
           v
[ Spring Boot Backend :8080 ]
           |
           | JPA + Flyway
           v
[ PostgreSQL :5432 ]
```

### 子專案

- `backend/`: Spring Boot API（JPA, Validation, Flyway）
- `frontend/`: Next.js App Router UI（僅透過 REST 呼叫 backend）
- `docs/`: 商用化與資產文件

### API 回傳契約

```json
{ "ok": true, "data": {} }
{ "ok": false, "error": { "code": "VALIDATION|CONFLICT|NOT_FOUND|INTERNAL", "message": "...", "details": {} } }
```

`details.reasonCode` 會帶內部規則碼（例：`OVERLAPPING_ACTIVE_LEASE`）。

---

## 2) 本機啟動

## A. Docker Compose（建議）

```bash
docker compose up -d --build
```

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:8080>
- Postgres: `localhost:5432`

## B. 分開啟動（開發）

1) 啟動 DB（或你自己的 PostgreSQL）

```bash
docker compose up -d postgres
```

2) 啟 backend

```bash
cd backend
mvn spring-boot:run
```

3) 啟 frontend

```bash
cd frontend
npm install
npm run dev
```

## C. 無 Docker fallback（H2，用於本機/CI 無 Docker 場景）

```bash
cd backend
SPRING_PROFILES_ACTIVE=fallback mvn spring-boot:run
```

---

## 3) 測試策略

## Backend 測試

```bash
cd backend
mvn test
```

### 測試層級

- **Unit tests（service 規則）**
  - 樓層產生（B 樓排序）
  - 單位 split / merge 與歷史保留
  - ACTIVE 租約 overlap 阻擋
  - occupancy DRAFT -> ACTIVE 轉換
  - repair scope / ACCEPTED 必填規則
  - owner sharePercent / period validation

- **Integration tests（controller + db）**
  - `CommercialFlowIntegrationTest` 使用 `@SpringBootTest + MockMvc + H2 fallback profile`
  - `CommercialFlowTestcontainersIT` 保留 Testcontainers 版本（docker 可用時執行）

## Frontend 測試

```bash
cd frontend
npm run test:component    # RTL / Vitest
npm run test:ui           # Playwright E2E + visual snapshots
npm run test:ui:headed    # 本機可視化除錯
```

### 已補 happy flows（Playwright）

1. 建大樓 -> 產生樓層 -> floors 可見 B 樓排序
2. 建單位 -> split -> unit 列表可見新單位
3. 指派 DRAFT occupancy -> stacking 可見 tenant 名
4. 建立租約 -> occupancy 轉 ACTIVE（UI 顯示）
5. Owners / Repairs 各一條 happy path

### CI 建議

- Pipeline 分層：
  1) backend unit/integration
  2) frontend build + component test
  3) UI E2E（需要可啟動 browser）
- 無 Docker runner：使用 backend `fallback` profile。
- 有 Docker runner：可加跑 Testcontainers integration。

---

## 4) 商用化補強（本次）

- API error code 標準化（VALIDATION / CONFLICT / NOT_FOUND / INTERNAL）
- 審計欄位（`createdBy`, `updatedBy`）+ `X-Actor-Id` placeholder
- 分頁參數支援（`page`, `size`, `sort`）：
  - `GET /api/buildings/{id}/tenants`
  - `GET /api/buildings/{id}/leases`
  - `GET /api/buildings/{id}/repairs`
- 新增 `GET /api/buildings/{id}/occupancies`（供 stacking 顯示 tenant/狀態）
- 前端關鍵表單增加錯誤提示，降低 silent fail

---

## 5) UX 設計原則（Task-first）

本版前端由「工程資料頁」改為「任務導向產品頁」。

### 設計原則
- 先給任務，再給欄位（頁首明確目的 + CTA）
- 摘要卡先看重點（KPI / 風險）
- 主流程可連續完成（避免頻繁跳頁）
- 不暴露工程欄位（例如 sortIndex / 內部 ID）
- 空狀態必有下一步，避免死畫面
- 成功/失敗回饋一致化（inline alert）

### 主要操作路徑
1. Dashboard：今日待辦 / 異常 / 下一步
2. 建立新大樓：建檔 -> 樓層設定 -> 導向配置
3. 空間管理：樓層 -> 單位 -> 入住概況（Stacking）
4. 客戶與合約：住戶 -> 租約 -> 到期風險
5. 維運管理：Owners / Common Areas / Repairs

### UX 文件
- `docs/ux-review.md`
- `docs/ux-decisions.md`
- `docs/user-journeys.md`

---

## 6) 視覺系統（Token + 元件）

- 色彩：主色 / 成功 / 警示 / 風險語意
- 字級：`--font-xs ~ --font-xl`
- 間距：`--space-1 ~ --space-6`
- 陰影：`--elevation-1 ~ --elevation-2`
- 元件一致化：button / input / table / card / chip / alert / empty-state

---

## 7) 品牌資產來源與替換方式

- 圖片資產：`frontend/public/brand`
- 來源與授權：`docs/ui-assets-sources.md`

### 替換方式

1. 將新圖放到 `frontend/public/brand`
2. 更新頁面引用（或維持同檔名）
3. 更新 `docs/ui-assets-sources.md` 的來源/授權
4. 重新跑 UI snapshot / E2E

---

## 8) 上線前 Checklist（安全 / 備份 / 監控 / 權限）

## 安全
- [ ] 正式身份驗證（JWT/SSO）
- [ ] RBAC 權限矩陣（最小權限）
- [ ] 敏感資訊（DB 密碼、token）改用 secret manager
- [ ] CORS / rate limit / input validation 完整設定

## 備份與災難復原
- [ ] DB 自動備份排程
- [ ] 還原演練（定期）
- [ ] 定義 RTO / RPO
- [ ] 異地備份策略

## 監控與可觀測性
- [ ] 統一應用日誌與 request tracing
- [ ] Metrics（error rate, p95 latency）
- [ ] 告警規則（4xx/5xx 異常、DB 連線）

## 權限與稽核
- [ ] 完整 audit log（誰在何時做了什麼）
- [ ] 管理操作與資料匯出留痕
- [ ] 重要操作（刪除/批次更新）需審批或二次確認

---

## 9) 參考文件

- 商用化差距與路線圖：`docs/commercial-readiness.md`
- UI 素材來源與授權：`docs/ui-assets-sources.md`
