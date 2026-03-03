---
layout: post
title: "18.8 兆美元下的非對稱裂縫：美國家庭信用風險正在區域化嗎？"
date: 2026-02-27 18:05:00 +0800
categories: [macro]
tags: [macro, consumercredit, employment, realestate]
macro_kind: long
description: "2025 年 Q4 美國家庭債務升至 18.776 兆美元，但風險不是平均擴散：學貸嚴重逾期流入率由 0.70% 躍升到 16.19%，低收入地區房貸逾期也明顯惡化。真正要回答的是，這是局部裂縫，還是全面信用轉折的前奏。"
lang: zh-TW
---

## 18.8 兆看起來平穩，裂縫到底在哪裡？

2025 年第四季，美國家庭債務升到 **18.776 兆美元**、單季增加 **1,910 億美元**，但市場表面仍偏平穩：S&P 500 在 **6,908.86**，VIX 約 **17.93**，高收益債利差（HY OAS）約 **2.94**（[NY Fed](https://www.newyorkfed.org/newsevents/news/research/2026/20260210), [FRED SP500](https://fred.stlouisfed.org/series/SP500), [FRED VIX](https://fred.stlouisfed.org/series/VIXCLS), [FRED HY OAS](https://fred.stlouisfed.org/series/BAMLH0A0HYM2)）。

美國家庭信用風險正在全面擴散，還是已演變成「低收入地區 + 學貸」的雙集中事件？

這篇文章用一個可重複的判讀框架來回答：先看「流入嚴重逾期」的邊際變化，再看地理與收入分層，最後看它會不會傳導到消費、地區金融與信用市場定價。讀完後你可以直接用同一組指標，持續檢查這條敘事何時成立、何時失效。

## 先確認方法可信，再談結論：這次要看「流量 × 分層 × 傳導」

這題最容易踩的坑，是把所有數字混在一起看。若只盯「總債務」或「平均逾期率」，你會看到一個還算可控的全國畫面；但若把資料拆到借款類型、地區收入帶、就業質地，輪廓會明顯不同。

| 觀察層 | 核心指標 | 為什麼重要 | 主要來源 |
|---|---|---|---|
| 邊際風險 | Flow into serious delinquency（流入嚴重逾期） | 比餘額更快反映還款壓力是否在惡化 | [NY Fed Household Debt & Credit](https://www.newyorkfed.org/newsevents/news/research/2026/20260210) |
| 分布風險 | 低收入郵遞區號房貸 90+ 天逾期流量 | 判斷是否出現區域化信用再定價 | [Liberty Street Economics](https://libertystreeteconomics.newyorkfed.org/2026/02/where-are-mortgage-delinquencies-rising-the-most/) |
| 現金流壓力 | 循環信貸增速、信用卡 APR、儲蓄率、債務償付比 | 判斷家庭緩衝墊是變厚還是變薄 | [Fed G.19](https://www.federalreserve.gov/releases/g19/current/default.htm), [FRED PSAVERT](https://fred.stlouisfed.org/series/PSAVERT), [FRED TDSP](https://fred.stlouisfed.org/series/TDSP) |
| 失真校正 | 長期失業、被迫兼職 | 修正只看失業率的盲點 | [BLS Employment Situation](https://www.bls.gov/news.release/empsit.nr0.htm) |

<aside style="float: right; width: 240px; margin: 0 0 1em 1.5em; padding: 0.75em 1em; background: rgba(100,116,139,0.15); border-left: 3px solid rgba(100,116,139,0.4); font-size: 0.82em; line-height: 1.6; border-radius: 4px;">
<strong>Flow into serious delinquency</strong>：某一期內「新進入 90+ 天逾期」的比例，反映信用惡化的邊際速度。<br>
<strong>HY OAS</strong>：高收益債相對美債的利差，常被拿來看市場是否開始定價信用壓力。
</aside>

另外一個可信度重點是口徑辨識：NY Fed 信用報告使用 Equifax panel，學生貸款餘額是 **1.664 兆美元**；Fed G.19 的學貸備忘口徑約 **1.836 兆美元**。兩者都可信，但母體與統計口徑不同，不能直接拿來做一對一高低比較（[NY Fed](https://www.newyorkfed.org/newsevents/news/research/2026/20260210), [Fed G.19](https://www.federalreserve.gov/releases/g19/current/default.htm)）。

### 證據一：風險升高是事實，但高度集中在學貸與弱勢區域

最關鍵變化在學生貸款。NY Fed 顯示，學貸 90+ 天流入嚴重逾期比率在一年內由 **0.70%** 升到 **16.19%**；全體貸款則由 **1.70%** 升到 **3.26%**。相較之下，信用卡是 **7.18% → 7.13%**，幾乎持平（[NY Fed](https://www.newyorkfed.org/newsevents/news/research/2026/20260210)）。

<div style="max-width: 600px; margin: 2em auto;">
  <canvas id="macroChart20260227credit"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
new Chart(document.getElementById('macroChart20260227credit'), {
  type: 'bar',
  data: {
    labels: ['學生貸款', '信用卡', '全部貸款'],
    datasets: [
      {
        label: '2024Q4（%）',
        data: [0.70, 7.18, 1.70],
        backgroundColor: 'rgba(59, 130, 246, 0.75)'
      },
      {
        label: '2025Q4（%）',
        data: [16.19, 7.13, 3.26],
        backgroundColor: 'rgba(239, 68, 68, 0.78)'
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: '流入嚴重逾期比率：2024Q4 vs 2025Q4（資料來源：NY Fed Household Debt & Credit）',
        color: '#e2e8f0',
        font: { size: 12 }
      },
      legend: { labels: { color: '#94a3b8' } }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      y: {
        ticks: { color: '#94a3b8', callback: function(v){ return v + '%'; } },
        grid: { color: 'rgba(255,255,255,0.08)' }
      }
    }
  }
});
</script>

區域維度同樣指向「非全面化」。Liberty Street 的結果顯示，低所得郵遞區號房貸 90+ 天逾期流量，2021 到 2025 年大約從 **0.5%** 升到接近 **3.0%**；在就業惡化更明顯的縣市，房貸新逾期惡化幅度約 **+0.6 個百分點**，穩定縣市約 **+0.2 個百分點**（[Liberty Street Economics](https://libertystreeteconomics.newyorkfed.org/2026/02/where-are-mortgage-delinquencies-rising-the-most/)）。

### 證據二：市場尚未定價系統性事件，代表風險更像「慢變」

若是全面信用壓力，通常會看到跨資產同步失序；但目前不太像。VIX 仍在 20 以下，HY OAS 尚未持續走闊，2 年期 / 10 年期公債殖利率約 **3.45% / 4.05%**，都比較像「風險存在、但未擴散為系統事件」的定價狀態（[FRED DGS2](https://fred.stlouisfed.org/series/DGS2), [FRED DGS10](https://fred.stlouisfed.org/series/DGS10), [FRED VIX](https://fred.stlouisfed.org/series/VIXCLS), [FRED HY OAS](https://fred.stlouisfed.org/series/BAMLH0A0HYM2)）。

這裡的重點不是「市場永遠正確」，而是當市場沒有恐慌定價、家庭信用卻在某些分位惡化時，最有可能的情境是：壓力先累積在弱勢地區與特定貸款類別，傳導速度慢，但持續時間可能更長。

### 證據三（Second-order effects）：真正要防的是地方層面的連鎖反應

BLS 2026 年 1 月資料顯示，失業率 **4.3%** 看起來仍在可控區間，但長期失業已升到 **180 萬**（年增 **38.6 萬**），被迫兼職升到 **490 萬**（年增 **41 萬**）（[BLS](https://www.bls.gov/news.release/empsit.nr0.htm)）。同時，個人儲蓄率降到 **3.6%**，家庭債務償付比仍在 **11%+** 區間（[FRED PSAVERT](https://fred.stlouisfed.org/series/PSAVERT), [FRED TDSP](https://fred.stlouisfed.org/series/TDSP)）。

這組組合常見的二階效果是：先影響低收入家庭現金流，再反映到地方零售與服務消費，接著推高地區性放款機構的信用成本，最後才可能傳導到更廣泛的信用利差。也就是說，這不是「明天就全面爆發」的故事，而是「若不逆轉，會逐季擴散」的故事。

### 反方與限制：為什麼現在仍不能直接定義成全面信用危機

反方最重要的論點同樣來自 NY Fed。**Wilbert van der Klaauw** 指出，房貸逾期雖然上升，但整體仍接近歷史常態，壓力集中在特定區域與收入帶，而不是全體家庭同步失速（[NY Fed](https://www.newyorkfed.org/newsevents/news/research/2026/20260210)）。

這個判讀還有三個限制要明講：第一，信用與就業資料有發布時滯，市場有時會先走一步；第二，不同資料口徑無法直接拼成單一母體；第三，若後續就業結構惡化速度超過預期，局部裂縫仍可能升級。換句話說，現在比較合理的定位是「局部且可監測」，而不是「已完成全面定義」。

## 分水嶺：三個可驗證條件，決定局部裂縫是否升級

- 如果學貸流入嚴重逾期率在未來兩季持續回落，且低收入地區房貸逾期不再擴大，→ 目前較偏「一次性調整 + 區域壓力」的框架會被強化。  
- 如果失業率仍在 4% 出頭，但長期失業與被迫兼職連續上升，→ 代表勞動市場質地走弱，家庭現金流壓力將延長，局部風險更可能向消費端擴散。  
- 如果 HY OAS 自約 300 bps 區間持續走闊，並與弱勢縣市就業惡化同時出現，→ 題材需從「家計分層風險」升級為「跨資產信用風險」。

## 結語：把注意力從總量移到分布，才能提早看見風險

> **核心判斷：** 當總量數據仍平穩、但逾期與就業壓力先在地理與族群層面集中時，真正要追蹤的是「可持續多久」而不是「何時瞬間爆發」。

這個框架的實作重點，不是去猜哪一天會出事，而是固定追蹤同一組指標，確認局部裂縫是在收斂還是外溢。對讀者而言，最有用的可執行做法是：每月做一次「流量（逾期）— 分層（地區/收入）— 傳導（就業質地與信用利差）」三欄檢查表，避免被單一 headline 或單一平均值誤導。

| Metric | Threshold | Window | Implication |
|--------|-----------|--------|-------------|
| 學貸流入嚴重逾期率（NY Fed） | 自 16.19% 連續 2 季回落，且降至 8% 以下 | 觀察 2026Q1–2026Q2（下一次 NY Fed Household Debt 報告） | 「學貸主導的局部裂縫」框架需下修，改以一次性重啟催收效應為主 |
| 低所得地區房貸 90+ 天逾期流量（Liberty Street） | 與其他地區差距連續 2 季不再擴大 | 觀察未來 2 季區域更新 | 「區域化信用再定價」強度下降，對地方消費的外溢壓力減輕 |
| HY OAS（FRED） | 升破 3.50 且連續 4 週，並伴隨弱勢縣市就業惡化延續 | 每週看利差、每月對照勞動資料 | 框架需升級為跨資產信用風險，不能只當作分層現象 |
| 長期失業 + 被迫兼職（BLS） | 長期失業 > 200 萬且被迫兼職 > 520 萬，連續 2 個月 | 2026-03、2026-04 就業報告連續驗證 | 家庭現金流緩衝進一步變薄，局部違約壓力有擴散條件 |

接下來最值得盯的三個變數：第一，3 月就業報告中長期失業與被迫兼職是否續升；第二，3 月 13 日個人所得與支出（含儲蓄率）是否繼續削弱緩衝墊（[BEA Schedule](https://www.bea.gov/news/schedule)）；第三，HY OAS 是否從「平穩區」進入「持續走闊區」。

---

*資料來源：[NY Fed Household Debt and Credit Report 2025Q4](https://www.newyorkfed.org/newsevents/news/research/2026/20260210)、[NY Fed Liberty Street Economics](https://libertystreeteconomics.newyorkfed.org/2026/02/where-are-mortgage-delinquencies-rising-the-most/)、[Federal Reserve G.19](https://www.federalreserve.gov/releases/g19/current/default.htm)、[BLS Employment Situation](https://www.bls.gov/news.release/empsit.nr0.htm)、[FRED: SP500](https://fred.stlouisfed.org/series/SP500)、[FRED: VIXCLS](https://fred.stlouisfed.org/series/VIXCLS)、[FRED: BAMLH0A0HYM2](https://fred.stlouisfed.org/series/BAMLH0A0HYM2)、[FRED: DGS2](https://fred.stlouisfed.org/series/DGS2)、[FRED: DGS10](https://fred.stlouisfed.org/series/DGS10)、[FRED: PSAVERT](https://fred.stlouisfed.org/series/PSAVERT)、[FRED: TDSP](https://fred.stlouisfed.org/series/TDSP)、[BEA Release Schedule](https://www.bea.gov/news/schedule)*  
*市場數據截至：2026-02-27*  
*本文僅供參考，不構成投資建議。*
