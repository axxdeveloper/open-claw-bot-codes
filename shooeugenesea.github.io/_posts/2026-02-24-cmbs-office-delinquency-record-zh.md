---
layout: post
title: "辦公室 CMBS 違約率破紀錄——$250 億逾期貸款揭示的不只是空置問題"
date: 2026-02-24 08:00:00 +0800
categories: [macro]
tags: [macro, realestate, bonds, fiscal]
macro_kind: short
description: "辦公室 CMBS 違約率 1 月攀升至 12.34% 歷史新高，250 億美元貸款逾期未償，超越 2008 金融海嘯峰值。違約浪潮是否正從辦公室蔓延至零售與多戶住宅？"
lang: zh-TW
---

## 12.34%：比金融海嘯還高的數字

[Trepp 2 月初發布的數據](https://newslink.mba.org/mba-newslinks/2026/february/trepp-cmbs-rate-increases-in-january-office-hits-new-high/)顯示，辦公室商業不動產抵押貸款證券 (CMBS) 違約率 1 月攀升至 **12.34%**，創 Trepp 自 2000 年追蹤以來新高，超過 2008 年峰值 10.7%。近 [$250 億 CMBS 貸款](https://therealdeal.com/national/2026/02/17/cmbs-delinquencies-hit-record-with-25b-past-maturity/)已過到期日卻未償還、清算或延展——2008 年以來未見的規模。

辦公室危機正在向其他物業蔓延嗎？本文拆解兩條因果鏈，觀察各物業違約率的收斂或分歧，下一驗證點是 3 月 Trepp 月報。

<aside style="float: right; width: 220px; margin: 0 0 1em 1.5em; padding: 0.75em 1em; background: rgba(100,116,139,0.15); border-left: 3px solid rgba(100,116,139,0.4); font-size: 0.82em; line-height: 1.6; border-radius: 4px;">
<strong>CMBS</strong>：Commercial Mortgage-Backed Securities，將商業不動產貸款打包為證券出售給投資人。<br>
<strong>NOI</strong>：Net Operating Income，物業營運淨收入，決定貸款能否償還的核心指標。<br>
<strong>Special Servicer</strong>（特別服務機構）：CMBS 貸款違約時接管處理的專業機構，負責決定延展、修改或法拍。
</aside>

## 到期牆與空置率：兩條因果鏈

第一條：再融資斷裂。2019-2021 年發放的 CMBS 到期面臨逾 **300 個基點**的利率跳升。[Trepp](https://www.commercialsearch.com/news/100b-in-cmbs-loans-mature-this-year-what-lies-ahead/) 顯示 2026 年逾 $1,000 億 CMBS 到期，$766 億屬硬到期且無延展選項，36% 債務收益率低於 8%。清償率從 2023 年 80% 降至 2024-25 年約 75%，2026 年預計跌破 50%。$401 億特別服務貸款中[法拍佔 39.1%](https://bbgres.com/more-cmbs-loans-transfer-to-special-servicing/)，修改僅 20.3%，平均損失嚴重度 32.5%。

第二條：辦公室 NOI 結構性塌陷。曼哈頓 One Worldwide Plaza [空置率從 10% 暴漲至 37%](https://wolfstreet.com/2026/02/03/office-cmbs-delinquency-rate-spikes-to-record-12-3-much-worse-than-financial-crisis-meltdown-peak/)，Cravath 撤離 61.7 萬平方英尺，估值崩跌 77% 至 $3.9 億並進入法拍。NOI 無法覆蓋債務時，利率高低已無關緊要。

<div style="max-width: 600px; margin: 2em auto;">
  <canvas id="macroChart11"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
new Chart(document.getElementById('macroChart11'), {
  type: 'bar',
  data: {
    labels: ['辦公室', '零售', '多戶住宅', '旅館', '工業'],
    datasets: [{
      label: 'CMBS 違約率 (%) — 2026 年 1 月',
      data: [12.34, 7.04, 6.94, 5.56, 0.62],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(250, 204, 21, 0.8)',
        'rgba(74, 222, 128, 0.7)',
        'rgba(59, 130, 246, 0.7)'
      ],
      borderColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(251, 146, 60, 1)',
        'rgba(250, 204, 21, 1)',
        'rgba(74, 222, 128, 1)',
        'rgba(59, 130, 246, 1)'
      ],
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'CMBS 各物業類型違約率 — 2026 年 1 月 (來源: Trepp)',
        color: '#e2e8f0',
        font: { size: 12 }
      },
      legend: {
        labels: { color: '#94a3b8' }
      }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: {
        min: 0, max: 14,
        ticks: { color: '#94a3b8', callback: function(v) { return v + '%'; } },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  }
});
</script>

數據更支持第一條作為短期催化劑。但蔓延跡象已現——1 月多戶住宅違約率升至 6.94%（月增 30 基點），零售 7.04%（月增 12 基點），[MBA 2 月 22 日報告](https://www.archyde.com/commercial-real-estate-distress-widens-beyond-office-buildings-2026-outlook/)確認壓力正擴散。Kidder Mathews 副總裁 Mike King [主張](https://www.commercialsearch.com/news/100b-in-cmbs-loans-mature-this-year-what-lies-ahead/)到期牆是「市場出清機制」而非系統性衝擊，因損失分散在全球機構投資人手中。但區域銀行商業不動產曝險佔資產負債表 **44%**，[FDIC](https://www.fdic.gov/bank-examinations/managing-commercial-real-estate-concentrations) 顯示 1,374 家銀行集中度超標——銀行端傳導並未被分散。

## 分水嶺

如果清償率跌破 50% 且多戶住宅違約率破 8%，→ 蔓延確認，[CRED iQ 預測年底困境率 15%](https://commercialobserver.com/2026/02/cmbs-distress-2026-cred-iq/) 成真，VNQ 面臨重定價。

如果 Fed 下半年降息且 10 年期殖利率回落至 3.8% 以下，→ 再融資改善，到期牆壓力緩解，違約率 2027 年見頂。

如果辦公室違約攀升但其他物業穩定（多戶住宅 ≤7%、工業 ≤1%），→ 「出清機制」論述成立，辦公室屬獨立調整。

## 結語

> **核心判斷：** 辦公室 CMBS 12.34% 違約率是遠端工作與到期牆的雙重結構問題，尚未構成系統性風險，但多戶住宅與零售的月增趨勢正在縮小各物業間的安全距離。

| Metric | Threshold | Window | Implication |
|--------|-----------|--------|-------------|
| 多戶住宅 CMBS 違約率 | 突破 8% | Q2 Trepp 月報 | 蔓延確認，非辦公室孤立事件 |
| CMBS 整體清償率 | 連續兩季 <50% | 2026 H1 | 到期牆壓力超出出清能力 |
| 10 年期殖利率 | 跌破 3.8% 維持一月 | 2026 H2 | 再融資窗口重啟 |

關鍵觀察變數：（一）3 月 Trepp 月報各物業違約率走向；（二）核心 PCE 若持續 3% 以上則降息無望，到期牆壓力不減；（三）法拍比例是否突破 40%。VNQ 暴露於蔓延風險，BKLN 對信用利差擴大敏感。

---

*資料來源：[Trepp CMBS 報告](https://newslink.mba.org/mba-newslinks/2026/february/trepp-cmbs-rate-increases-in-january-office-hits-new-high/)、[The Real Deal](https://therealdeal.com/national/2026/02/17/cmbs-delinquencies-hit-record-with-25b-past-maturity/)、[Wolf Street](https://wolfstreet.com/2026/02/03/office-cmbs-delinquency-rate-spikes-to-record-12-3-much-worse-than-financial-crisis-meltdown-peak/)、[Commercial Property Executive](https://www.commercialsearch.com/news/100b-in-cmbs-loans-mature-this-year-what-lies-ahead/)、[MBA](https://www.archyde.com/commercial-real-estate-distress-widens-beyond-office-buildings-2026-outlook/)、[CRED iQ](https://commercialobserver.com/2026/02/cmbs-distress-2026-cred-iq/)、[BBG](https://bbgres.com/more-cmbs-loans-transfer-to-special-servicing/)、[FDIC](https://www.fdic.gov/bank-examinations/managing-commercial-real-estate-concentrations)*
*市場數據截至：2026-02-23*
*本文僅供參考，不構成投資建議。*
