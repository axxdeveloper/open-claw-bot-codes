# UX Decisions & Trade-offs

## 設計目標
- 從「資料輸入介面」轉成「任務完成介面」。
- 優先降低操作錯誤與跨頁切換成本。
- 不以動畫炫技，改以資訊可讀性與流程順暢為主。

---

## 核心決策

### 1) IA 以工作脈絡分區
**決策：** 導覽改為 Dashboard / 空間管理 / 客戶與合約 / 維運管理 / 報表匯入。  
**取捨：** 導覽層級稍多，但換來新手可理解的入口語義。

### 2) 每頁固定骨架模板
**決策：** 所有主要頁面都採「頁首 + 摘要卡 + 主要工作區 + 回饋」。  
**取捨：** 版面更一致，少數頁面需增加包裝結構。

### 3) 工程欄位隱藏
**決策：** 主視圖不顯示 sortIndex、內部 ID 等欄位。  
**取捨：** 工程除錯資訊移出主流程，但營運可用性大幅提升。

### 4) 狀態使用 chip 與色彩語意
**決策：** Active / Draft / Risk / Neutral 以一致 chip 呈現。  
**取捨：** 色彩規則增加設計約束，但跨頁辨識速度提升。

### 5) 表單分段 + 可行動錯誤訊息
**決策：** 重要表單拆成可理解段落（對象、期間、範圍）。  
**取捨：** 版面略長，但填寫錯誤率下降。

### 6) 空狀態必附下一步
**決策：** Empty state 一律附「下一步 action」。  
**取捨：** 多寫文案，但避免使用者卡住。

### 7) 優先強化連續任務
**決策：** 在樓層頁加入「快速建立租約」區塊，減少跳頁。  
**取捨：** 單頁複雜度增加，但操作效率顯著提升。

### 8) 成功/失敗回饋一致化
**決策：** 統一 success/error/info box 語意與位置。  
**取捨：** 需要全站調整，但認知穩定性提升。

### 9) 測試策略偏向 happy-flow
**決策：** 保留並更新核心 E2E happy-flow，優先保證主流程不壞。  
**取捨：** 視覺細節回歸測試不在此次優先範圍。

### 10) 報表模組先給入口 placeholder
**決策：** 先讓 IA 完整，不阻塞主流程改版。  
**取捨：** 報表功能未完備，但導航心智模型先建立。

---

## 設計系統（Token/Component）

### Tokens
- **Spacing**：`--space-1 ... --space-6`
- **Type**：`--font-xs ... --font-xl`
- **Color**：主色、成功、警示、風險、邊線、背景
- **Elevation**：`--elevation-1 / --elevation-2`

### 組件一致化
- Button（primary/secondary/danger）
- Input / Select / Textarea（同一交互規則）
- Card / SectionBlock
- Table + responsive wrap
- Status Chip（neutral/active/draft/risk/info）
- EmptyState / Feedback box
