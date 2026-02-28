# Source XLSX 匯入與 All-tabs CSV 匯出

## 目的

- **完整保留多 tab 原始資料**（避免資料欄位遺失）
- 同步保留既有結構化資料（tenant / floor / unit / occupancy）
- 提供單一 API 一次匯出 all tabs CSV

---

## 支援 tabs（若檔案中存在會自動納入）

至少支援以下 tab 名稱：

- 點交時間表
- 113
- 商戶樓層明細
- 商戶緊急聯絡電話
- 產業人數表
- 商戶戶MAIL
- 簽收表

預設會匯入 **工作簿內全部 tabs**，也可用 `sheetNames` 指定子集合。

---

## API

### 1) 匯入原始 XLSX

`POST /api/buildings/:id/import/source-xlsx`

#### Request body

```json
{
  "filePath": "/Users/openclaw-user/.openclaw/workspace/tmp-tenant.xlsx",
  "notes": "2026-02-28 初次匯入",
  "sheetNames": ["點交時間表", "113"],
  "keepOnlyRequiredTabs": false
}
```

> 兼容欄位：`filePath | sourcePath | xlsxPath | path`（任一即可）

#### Response（節錄）

```json
{
  "ok": true,
  "data": {
    "importBatchId": "cm7...",
    "sourcePath": "/Users/.../tmp-tenant.xlsx",
    "includedSheets": [
      { "name": "點交時間表", "rowCount": 89, "headerRow": 1 },
      { "name": "113", "rowCount": 92, "headerRow": 2 }
    ],
    "structured": {
      "tenantsCreated": 52,
      "floorsCreated": 18,
      "unitsCreated": 71,
      "occupanciesCreated": 64,
      "rowsWithStructuredData": 83
    }
  }
}
```

### 2) 查詢最近匯入批次（含原始列預覽）

`GET /api/buildings/:id/import/source-xlsx?batchId=<optional>`

- 每個 tab 回傳前 100 筆 `sourceRows`
- 可用來驗證「來源 tab / 原始列」已落庫

### 3) 匯出 all tabs CSV（ZIP）

`GET /api/buildings/:id/export/csv?scope=all&batchId=<optional>`

- `scope=all` 為必填
- `batchId` 不帶時，匯出該大樓最新批次
- 回傳 `application/zip`

#### ZIP 內容檔名範例

- `01-點交時間表.csv`
- `02-113.csv`
- `03-商戶樓層明細.csv`
- `04-商戶緊急聯絡電話.csv`
- `05-產業人數表.csv`
- `06-商戶戶MAIL.csv`
- `07-簽收表.csv`
- `_summary.csv`

---

## 資料模型（原始資料層）

- `ImportBatch`
  - 一次匯入的批次 metadata（來源路徑、建立時間）
- `SourceSheet`
  - 每個 tab 的欄位與統計（columns / headerRow / rowCount）
- `SourceRow`
  - 每一列原始資料（rowValues / rowObject）

此層可確保原檔欄位不丟失，後續若需重建映射規則可直接回放。

---

## UI 流程

- 主要頁（floors / stacking / tenants / leases / repairs）以**查看/查詢**為主
- 所有新增/編輯集中到：
  - `/buildings/:id/manage`
- 匯入與匯出操作也在 `資料維護` 區提供入口
