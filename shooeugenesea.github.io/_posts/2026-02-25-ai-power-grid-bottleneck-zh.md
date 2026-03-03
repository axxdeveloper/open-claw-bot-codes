---
layout: post
title: "AI 軍備競賽的下一道牆：當資本開支追上電網排隊"
date: 2026-02-25 23:40:00 +0800
categories: [macro]
tags: [macro, ai, energy, semiconductor]
macro_kind: short
description: "Alphabet 2 月 4 日將 2026 年 CapEx 指引拉到 1,750-1,850 億美元，PJM 同步估 2025-2030 年資料中心新增負載約 30GW。AI 投資瓶頸正從晶片供給移向電力接入。"
lang: zh-TW
---

## 晶片很貴，送電更慢

2 月 4 日，Alphabet 在法說把 2026 年 CapEx 指引拉到 **1,750-1,850 億美元**；PJM 在 1 月 8 日年度回顧則估 2025-2030 年資料中心新增負載可達 **約 30GW**。2 月 25 日 NVIDIA 盤後財報，會是這波需求是否持續的第一個驗證點 ([Alphabet IR](https://abc.xyz/investor/events/event-details/2026/2025-Q4-Earnings-Call-2026-Dr_C033hS6/default.aspx), [PJM](https://insidelines.pjm.com/2025-year-in-review-planning-prepares-for-burgeoning-electricity-demand/), [NVIDIA](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Sets-Conference-Call-for-Fourth-Quarter-Financial-Results/default.aspx))。

截至台北時間 2 月 25 日 23:40，NVIDIA 本季財報仍未發布，本文所有與其相關描述皆屬待驗證的觀察框架，而非已公布結果。

當企業仍在擴張 AI 基建時，真正的上限是模型需求，還是電力接入速度？

這篇要回答的是一個可重複使用的框架：先分開看「算力需求是否還在加速」與「電網是否跟得上」，再用三個可觀測門檻判斷哪一條主線占上風。最直接的下一個驗證點是 NVIDIA 今晚財報，以及 EIA 3 月 10 日的下一版 STEO。

## 資本開支在加速，但瓶頸移到電網排隊：因果拆解

第一條解釋是「需求仍在擴張」。Alphabet 在 2 月 4 日法說揭露 2025 年 CapEx 為 **914 億美元**，並把 2026 年 CapEx 指引放在 **1,750-1,850 億美元**；Google Cloud backlog 也在第四季升至 **2,400 億美元**，顯示企業端採購仍在前置 ([Alphabet IR](https://abc.xyz/investor/events/event-details/2026/2025-Q4-Earnings-Call-2026-Dr_C033hS6/default.aspx))。NVIDIA 2 月 25 日財報則是下一個驗證點：若供應商指引仍維持高成長，需求端尚未出現明顯斷層 ([NVIDIA](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Sets-Conference-Call-for-Fourth-Quarter-Financial-Results/default.aspx))。

第二條解釋是「供給瓶頸已從 GPU 轉向電力與併網」。PJM 在 2026 年 1 月回顧指出，資料中心帶來的新增用電需求在 2025-2030 年可達 **約 30GW**，並把 15 年夏季尖峰增量放在 **+70GW（到 220GW）** ([PJM](https://insidelines.pjm.com/2025-year-in-review-planning-prepares-for-burgeoning-electricity-demand/))。Alphabet 管理層同場點名約束條件不只算力，還包括 **power、land、supply chain**，且 Google Cloud 處在「tight supply environment」([Alphabet IR](https://abc.xyz/investor/events/event-details/2026/2025-Q4-Earnings-Call-2026-Dr_C033hS6/default.aspx))。反方觀點來自 EIA 2 月 10 日最新版 STEO：EIA 預估全美發電量在 2026 年、2027 年仍分別成長 **1.4%** 與 **2.5%**，並預期 2026-2027 年新增太陽能與風電容量約 69GW、19GW，可部分吸收新增負載壓力 ([EIA](https://www.eia.gov/outlooks/steo/report/elec_coal_renew.php))。這代表爭點不是「有沒有電」，而是「新增供給與大型負載誰先落地」。

<aside style="float: right; width: 220px; margin: 0 0 1em 1.5em; padding: 0.75em 1em; background: rgba(100,116,139,0.15); border-left: 3px solid rgba(100,116,139,0.4); font-size: 0.82em; line-height: 1.6; border-radius: 4px;">
<strong>大型負載 (Large Load)</strong>：單一用戶一次新增數十至上百 MW 用電需求，典型案例就是超大型資料中心園區。
</aside>

就目前證據權重而言，較被數據支持的是第二條：需求仍強，但成本曲線與時程風險正由晶片單價，移向電力可得性與併網速度。對台灣讀者來說，這代表要區分「AI 需求消失」與「美國基建落地延後」兩種訊號，因為後者更常體現在供應鏈認列時點遞延，而不是訂單總量直接反轉。

<div style="clear: both;"></div>

<div style="max-width: 600px; margin: 2em auto;">
  <canvas id="macroChart13"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
new Chart(document.getElementById('macroChart13'), {
  type: 'line',
  data: {
    labels: ['2025', '2026E', '2027E'],
    datasets: [{
      label: '美國發電量年增率（%）',
      data: [2.7, 1.4, 2.5],
      borderColor: 'rgba(59, 130, 246, 0.9)',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      tension: 0.25,
      fill: true,
      pointRadius: [4, 4, 5],
      pointBackgroundColor: ['rgba(59,130,246,0.9)','rgba(59,130,246,0.9)','rgba(239,68,68,0.95)']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: '美國發電量年增率預測（資料來源：EIA STEO，2026-02）',
        color: '#e2e8f0',
        font: { size: 12 }
      },
      legend: { labels: { color: '#94a3b8' } }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: {
        ticks: { color: '#94a3b8', callback: function(v) { return v + '%'; } },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  }
});
</script>

## 分水嶺

如果 NVIDIA 今晚財報後的管理層指引仍維持高成長、且兩季內主要雲端業者沒有下修 2026 年資本開支，→ 需求端主線延續，市場焦點會更快轉向電力與施工節點。  

如果 PJM 在 2026 年後續大型負載更新中，把 2025-2030 的資料中心新增需求明顯下修，且併網流程時間同步縮短，→ 目前「電網先成瓶頸」的敘事需要降權。  

如果 EIA 後續 STEO 同步下修 2026-2027 發電與商業用電增速，且企業法說反覆提及需求遞延而非供給受限，→ 這波 AI 投資節奏要從「基建落地慢」重估為「終端需求放緩」。

## 結語

> **核心判斷：** 這一輪 AI 週期的關鍵不在「有沒有錢買晶片」，而在「電力與併網能否把已承諾的資本開支轉成可上線的算力」。

| Metric | Threshold | Window | Implication |
|--------|-----------|--------|-------------|
| Alphabet 2026 CapEx 指引 | 由 1,750-1,850 億美元下修至 <1,500 億美元，且連續兩季維持 | 2026 Q1-Q2 財報季（下一觀測：2026 年 4 月） | 需把主框架由「供給約束」調整為「需求降速」 |
| PJM 資料中心負載增量（2025-2030） | 由約 30GW 下修至 <15GW，且連續兩次更新維持 | 2026 全年 PJM 規劃更新（下一觀測：2026 年中期更新） | 電網瓶頸敘事需降權，估值重心回到雲端變現效率 |
| EIA 全美發電量年增預測 | 2026 或 2027 年增率連續兩期下修至 <1.5% | 月度 STEO（下一觀測：2026-03-10） | 需重估 AI 電力需求斜率與公用事業資本開支節奏 |

接下來我會先看三個變數：（一）NVIDIA 2 月 25 日盤後指引把成長歸因放在需求還是供給；（二）PJM 對大型負載申請的落地率；（三）Alphabet 提到的 power/land/supply chain 約束在第二季是否改善。

---

*資料來源：[NVIDIA 財報會議公告](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Sets-Conference-Call-for-Fourth-Quarter-Financial-Results/default.aspx)、[Alphabet 2025 Q4 Earnings Call](https://abc.xyz/investor/events/event-details/2026/2025-Q4-Earnings-Call-2026-Dr_C033hS6/default.aspx)、[EIA STEO（2026-02）](https://www.eia.gov/outlooks/steo/report/elec_coal_renew.php)、[PJM 2025 年回顧](https://insidelines.pjm.com/2025-year-in-review-planning-prepares-for-burgeoning-electricity-demand/)*
*市場數據截至：2026-02-25*
*本文僅供參考，不構成投資建議。*
