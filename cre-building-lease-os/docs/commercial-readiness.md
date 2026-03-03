# Commercial Readiness Assessment (CRE Building Lease OS)

> 角色視角：**物業管理者 / 營運人員**

## 現況摘要

目前系統已具備 MVP 可操作核心：
- 建物 / 樓層 / 單位管理
- 租戶、租約、occupancy 串接
- 業主與樓層持分管理
- 修繕履歷與驗收欄位檢核

本次已補強：
- 後端規則測試（unit + integration）
- API 錯誤碼標準化（VALIDATION / CONFLICT / NOT_FOUND）
- 分頁查詢（tenants / leases / repairs 支援 page,size,sort）
- 基本審計欄位（createdBy / updatedBy）
- 前端錯誤提示與 happy flow 自動化測試框架（Playwright + RTL）

---

## 商用差距清單（P0 / P1 / P2）

## P0（上線前必須）

1. **身份驗證與角色授權（RBAC）**
   - 目前缺少正式登入驗證、token/SSO、細粒度權限。
2. **正式審計日誌（不可竄改）**
   - 現有 createdBy/updatedBy 為 placeholder，尚非完整事件追蹤。
3. **備份 / 還原 / 災難復原流程**
   - 尚未有排程備份、還原演練與 RTO/RPO 定義。
4. **觀測性（logging/metrics/tracing）**
   - 缺少可操作儀表板與告警門檻。
5. **檔案儲存策略（修繕附件）**
   - 目前本機磁碟路徑，不適合多節點與高可用部署。

## P1（上線後 1~2 期）

1. **財務整合（租金/管理費/會計系統）**
2. **CAM/OPEX 分攤模型與報表**
3. **資料匯入/匯出（Excel/CSV/API）**
4. **批次作業與工作流程（審核、提醒、任務派工）**
5. **多語系與通知模板管理**

## P2（成長期）

1. **進階分析與預測（空置率、租約續約風險）**
2. **行動端巡檢/拍照流程整合**
3. **租戶自助入口與工單系統**
4. **外部生態整合（BMS/IoT/門禁）**

---

## 30 / 60 / 90 天 Roadmap

## Day 0~30（穩定與上線防線）
- 導入 JWT/SSO + RBAC（Owner/Manager/Operator/Viewer）
- 建立 audit log schema 與 API middleware
- 建立備份排程、還原演練文件、監控告警基線
- 將附件改為 S3 相容物件儲存
- 完成 pre-prod 壓力測試與資料遷移演練

## Day 31~60（營運能力）
- 導入帳務整合（應收、租金、管理費對帳）
- CAM/OPEX 模組（分攤規則、月報）
- 匯入匯出流程（模板 + 驗證 + 稽核紀錄）
- 通知中心（續約提醒、維修狀態通知）

## Day 61~90（效率與擴展）
- KPI 與營運儀表板（租約到期、空置率、修繕 SLA）
- 流程自動化（審批與任務路由）
- 進階報表與 BI 介接
- 多租戶隔離與企業部署標準化

---

## 建議 KPI（供營運追蹤）
- 租約資料完整率
- 逾期續約比例
- 修繕從通報到驗收平均天數
- 重大事故 MTTR
- 資料修正率 / 表單錯誤率
