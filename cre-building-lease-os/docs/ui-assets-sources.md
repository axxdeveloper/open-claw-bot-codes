# UI Assets Sources & License Notes

本次 UI 視覺採「宏泰風格參考（穩重商辦藍灰）」而非直接使用來源不明的宏泰官方圖片。

## 採用策略

- **風格層**：使用深藍/灰/白設計語言與商辦資訊層級。
- **圖片層**：採用可商用授權圖庫素材（Pexels），避免授權不明圖片。
- **品牌文字**：僅作「風格參考」描述，不宣稱官方合作或授權背書。

## 已放入 `frontend/public/brand`

1. `hero-building.jpg`
   - Source: https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg
   - License: Pexels License（可免費商用，無需署名）

2. `hero-lobby.jpg`
   - Source: https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg
   - License: Pexels License（可免費商用，無需署名）

3. `hero-office.jpg`
   - Source: https://images.pexels.com/photos/534220/pexels-photo-534220.jpeg
   - License: Pexels License（可免費商用，無需署名）

## 宏泰官方素材狀態

- 本次未直接導入宏泰官方宣傳照 / 官網圖片，原因是未取得明確再利用授權條款。
- 若後續要替換為官方素材，請先完成法務確認並保留授權紀錄（email/合約/授權頁截圖）。

## 替換指引

1. 新圖檔放入 `frontend/public/brand`
2. 保留相同檔名（或更新引用頁面）
3. 同步更新本文件的「來源 + 授權」欄位
4. 執行 UI snapshot / Playwright 視覺測試確認無破版
