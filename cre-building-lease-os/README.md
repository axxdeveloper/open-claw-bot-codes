# cre-building-lease-os (Add-on Spec v0.2, Java Backend + Next.js Frontend)

本專案已調整為 **前後端分離**：

- `backend/`：Java 21 + Spring Boot 3 + Validation + JPA + Flyway + PostgreSQL
- `frontend/`：Next.js App Router（僅 UI，透過 REST 呼叫 backend）
- `docker-compose.yml`：postgres + backend + frontend

> API 回傳契約統一：
>
> `{ ok: boolean, data?: any, error?: { code, message, details? } }`

---

## 專案結構

```text
cre-building-lease-os/
  backend/    # Spring Boot API
  frontend/   # Next.js UI (no direct DB access)
  docker-compose.yml
```

---

## 架構圖（簡述）

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

---

## Backend 功能重點

### 核心流程（可走通）

1. 建大樓
2. 產生樓層（B5=-5 ... B1=-1, 1F=1）
3. 建立/切割/合併單位
4. 建立 DRAFT occupancy
5. 建立 ACTIVE lease 後自動促發 occupancy DRAFT -> ACTIVE
6. 阻擋同一 unit 重疊 ACTIVE 租約
7. managementFee fallback（lease 為 null 時使用 building）

### Add-on Spec v0.2

- Floor Owners
  - Owner / FloorOwner
  - sharePercent + startDate/endDate + notes
- Repairs History（Floor + Common Area）
  - Vendor / CommonArea / RepairRecord / RepairAttachment
  - scope validation
  - ACCEPTED 驗收欄位驗證 + acceptedAt 自動補值

### Seed

Flyway `V2__seed.sql` 會建立：

- 大樓：宏盛國際金融中心
- 樓層：B5..20F
- 單位：5F/6F/9F/10F 的 A1~A6-1
- 業主：並指派到 5F/9F/10F
- Common Areas：大廳1F、電梯、停車場B2、機房、公共走廊
- Vendors
- Repairs 至少 2 筆（10F floor + 大廳 common area）

---

## API 端點清單

### Buildings
- `POST /api/buildings`
- `GET /api/buildings`
- `GET /api/buildings/{id}`
- `PATCH /api/buildings/{id}`
- `POST /api/buildings/{id}/floors/generate`
- `GET /api/buildings/{id}/floors`

### Floors / Units
- `GET /api/floors/{id}`
- `POST /api/floors/{id}/units`
- `PATCH /api/units/{id}`
- `POST /api/units/{id}/split`
- `POST /api/units/merge`

### Tenants
- `POST /api/buildings/{id}/tenants`
- `GET /api/buildings/{id}/tenants`
- `GET /api/tenants/{id}`
- `PATCH /api/tenants/{id}`

### Occupancies
- `POST /api/occupancies`
- `PATCH /api/occupancies/{id}`

### Leases
- `POST /api/leases`
- `GET /api/buildings/{id}/leases`
- `GET /api/leases/{id}`
- `PATCH /api/leases/{id}`

### Owners (Add-on A)
- `POST /api/buildings/{buildingId}/owners`
- `GET /api/buildings/{buildingId}/owners`
- `PATCH /api/owners/{ownerId}`
- `POST /api/floors/{floorId}/owners/assign`
- `GET /api/floors/{floorId}/owners`
- `DELETE /api/floor-owners/{floorOwnerId}`

### Vendors / Common Areas / Repairs (Add-on B)
- Vendors
  - `POST /api/buildings/{id}/vendors`
  - `GET /api/buildings/{id}/vendors`
  - `PATCH /api/vendors/{id}`
- Common Areas
  - `POST /api/buildings/{id}/common-areas`
  - `GET /api/buildings/{id}/common-areas`
  - `GET /api/common-areas/{id}`
  - `PATCH /api/common-areas/{id}`
- Repairs
  - `POST /api/repairs`
  - `GET /api/buildings/{id}/repairs?status=&scopeType=&floorId=&commonAreaId=`
  - `GET /api/repairs/{id}`
  - `PATCH /api/repairs/{id}`
- Repair Attachments
  - `POST multipart /api/repairs/{repairId}/attachments`
  - `GET /api/repairs/{repairId}/attachments`
  - `DELETE /api/repair-attachments/{id}`

---

## Frontend（Next.js）

已提供基本 UI 路由：

- `/login`
- `/buildings`
- `/buildings/new`
- `/buildings/[id]`
- `/buildings/[id]/floors`
- `/buildings/[id]/floors/[floorId]`
- `/buildings/[id]/stacking`
- `/buildings/[id]/tenants`
- `/buildings/[id]/leases`
- `/leases/[leaseId]`
- `/buildings/[id]/owners`
- `/buildings/[id]/common-areas`
- `/buildings/[id]/common-areas/[commonAreaId]`
- `/buildings/[id]/repairs`

Frontend 使用 `NEXT_PUBLIC_API_BASE_URL` 呼叫 backend（預設 `http://localhost:8080/api`）。

---

## 本機啟動

### 方式 A：Docker Compose（推薦）

```bash
docker compose up -d --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Postgres: localhost:5432

### 方式 B：分開啟動

1) 先起 Postgres（可用 compose 只起 db）：

```bash
docker compose up -d postgres
```

2) 啟動 backend：

```bash
cd backend
mvn spring-boot:run
```

3) 啟動 frontend：

```bash
cd frontend
npm install
npm run dev
```

---

## Migration / Seed

- Flyway migration + seed 由 backend 啟動時自動執行（`V1__init.sql`, `V2__seed.sql`）。

---

## 測試

### Backend（JUnit）

```bash
cd backend
mvn test
```

已補測：
1. 樓層產生
2. 單位切割
3. 租約重疊阻擋
4. Repair scope validation
5. ACCEPTED 驗收欄位要求

另含 Testcontainers smoke test（docker 可用時啟動 postgres container）。

---

## 備註

- 先前 Prisma/Next API 實作仍保留於 repo 作為參考；最終主流程以 `backend/` Java API 為準。
- Frontend 不直連 DB，僅透過 backend REST。
