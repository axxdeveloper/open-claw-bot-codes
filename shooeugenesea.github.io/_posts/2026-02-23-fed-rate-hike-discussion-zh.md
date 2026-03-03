---
layout: post
title: "升息重回桌面？一道減法揭示 Fed 的雙向困局"
date: 2026-02-23 08:00:00 +0800
categories: [macro]
tags: [macro, fed, bonds]
macro_kind: long
description: "FOMC 一月紀要中數位官員討論「向上調整」利率的可能性，但實質聯邦基金利率僅約 0.6%，搭配 Section 122 關稅即將推升物價，Fed 的緊縮程度可能遠不如市場想像。"
lang: zh-TW
---

## 紀要中的六個字

2 月 18 日發布的 [FOMC 一月紀要](https://www.federalreserve.gov/monetarypolicy/fomcminutes20260128.htm)出現罕見措辭：數位與會者表示支持在聲明中加入「向上調整利率」的雙向描述。聯準會 (Fed) 才於 2025 年 Q4 連續降息三次共 75 個基點，10 年期殖利率隨即 [升至 4.10%](https://www.cnbc.com/2026/02/18/us-treasury-yields-investors-await-fed-meeting-minutes-.html)。紀要中的升息討論，是口頭鷹派威懾，還是數據驅動下的真實政策選項？

本文用實質利率（名目利率減去通膨）這把尺重新丈量 Fed 的緊縮程度，關鍵門檻是核心個人消費支出物價指數 (Core PCE) 能否脫離 3% 以上的黏著區間——2 月 26 日公布的 1 月 PCE 報告將是第一個驗證點。

## 升息並非空穴來風：三條因果鏈

<aside style="float: right; width: 220px; margin: 0 0 1em 1.5em; padding: 0.75em 1em; background: rgba(100,116,139,0.15); border-left: 3px solid rgba(100,116,139,0.4); font-size: 0.82em; line-height: 1.6; border-radius: 4px;">
<strong>實質利率 (Real Interest Rate)</strong>：名目利率減去通膨率。衡量貨幣政策「實際上有多緊」的核心指標。
</aside>

**第一條因果鏈：實質利率比想像中低。** 聯邦基金利率中位數約 3.625%，[12 月核心 PCE 年增率 3.0%](https://www.bea.gov/data/personal-consumption-expenditures-price-index-excluding-food-and-energy)（2024 年 6 月以來最高），相減後實質利率僅約 0.6%。達拉斯聯儲總裁 Lorie Logan [2 月 10 日指出](https://www.dallasfed.org/news/speeches/logan/2026/lkl260210)，模型估算的實質中性利率 (r*) 區間為 1.08%-2.09%。0.6% 落在區間下方，意味著政策可能根本沒有產生足夠緊縮。Logan 原話：「我們目前的政策立場可能非常接近中性，對經濟活動與通膨幾乎沒有抑制作用。」這道減法讓紀要中的升息討論不再是空洞的恐嚇，而是有數據支撐的合理選項。

<aside style="float: right; width: 220px; margin: 0 0 1em 1.5em; padding: 0.75em 1em; background: rgba(100,116,139,0.15); border-left: 3px solid rgba(100,116,139,0.4); font-size: 0.82em; line-height: 1.6; border-radius: 4px;">
<strong>Core PCE vs CPI</strong>：Fed 以 PCE 為政策目標。CPI 中住房權重約 35%，PCE 僅約 17%，造成兩者讀數差異。
</aside>

**第二條因果鏈：CPI 與 PCE 的詭異背離。** 1 月 CPI 年增率降至 [2.4%](https://thedailyeconomy.org/article/inflation-is-cooling-jan-2026/)，看似通膨降溫，但 Fed 的政策目標是 PCE 而非 CPI。高盛 Jan Hatzius [估算 1 月核心 PCE 將達 3.05%](https://markets.financialcontent.com/stocks/article/marketminute-2026-2-18-goldman-sachs-issues-305-core-pce-alarm-why-the-inflation-disconnect-could-freeze-fed-rate-cuts-until-summer-2026)。背離的原因有二：[紐約聯儲研究](https://libertystreeteconomics.newyorkfed.org/2026/02/seeing-through-the-shutdowns-missing-inflation-data/)指出 2025 年秋季政府停擺導致 11 月 CPI 數據異常偏低，12 月趨勢通膨回升至 2.83%；其次，AI 資料中心擴張推升的 HBM 等 IT 元件價格在 PCE 權重中遠高於 CPI。紀要中多數與會者判斷：「通膨持續高於目標的風險是顯著的。」

<div style="max-width: 600px; margin: 2em auto;">
  <canvas id="macroChart1"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
new Chart(document.getElementById('macroChart1'), {
  type: 'line',
  data: {
    labels: ['2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'],
    datasets: [
      {
        label: 'Core PCE YoY (%)',
        data: [2.8, 2.9, 2.9, 2.8, 2.7, 2.8, 3.0],
        borderColor: 'rgba(239, 68, 68, 0.9)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        fill: false
      },
      {
        label: 'CPI YoY (%)',
        data: [2.7, 2.7, 2.5, 2.4, 2.4, 2.3, 2.7],
        borderColor: 'rgba(59, 130, 246, 0.9)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: false
      },
      {
        label: 'Fed 目標 (%)',
        data: [2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0],
        borderColor: 'rgba(156, 163, 175, 0.5)',
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Core PCE vs CPI：通膨的兩張面孔 (來源: BEA, BLS)',
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
        min: 1.5, max: 3.5,
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  }
});
</script>

**第三條因果鏈：關稅變數在紀要之後才落地。** [2 月 20 日最高法院推翻 IEEPA 關稅](https://www.cnn.com/2026/02/20/politics/supreme-court-tariffs)後，白宮援引 [Section 122 加徵 15% 全球進口附加稅](https://www.whitehouse.gov/presidential-actions/2026/02/imposing-a-temporary-import-surcharge-to-address-fundamental-international-payments-problems/)。[耶魯預算實驗室估算](https://budgetlab.yale.edu/research/state-tariffs-february-21-2026)此舉推升消費者物價約 0.5%-0.6%，美國平均有效關稅率升至 13.7%（1941 年以來最高）。這個衝擊發生在 FOMC 會議之後，3 月 18 日會議面對的通膨環境將更嚴峻。即使 Fed 傾向「看穿」關稅的一次性效果，若通膨預期因此固化在薪資談判中，升息選項就不再只是紀要裡的一句話。

<div style="clear: both;"></div>

目前數據最支持第一條因果鏈：實質利率偏低這個事實，讓升息從「不可想像」變成了「有道理」。但並非所有人都同意這個框架。Evercore ISI 副主席 Krishna Guha [認為](https://www.cnbc.com/2026/02/18/us-treasury-yields-investors-await-fed-meeting-minutes-.html)紀要中的升息討論純屬「尾部風險對沖」：關稅是供給面一次性衝擊，Fed 會選擇容忍而非回應，真正的政策路徑仍指向下半年降息。Guha 的邏輯鏈是：若 Section 122 在 150 天後到期且未獲國會延長，關稅推升的通膨將自動消退，升息討論也將隨之失去數據基礎。市場定價傾向 Guha 的判斷——[CME FedWatch 顯示 3 月維持利率不變的機率為 94%](https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html)——反映的是「討論」與「行動」之間的巨大落差。

## 分水嶺

如果 1 月核心 PCE 確認突破 3.05% 且 3 月非農薪資年增率加速，→ 升息討論將從「數位與會者」擴散為更廣泛共識，長端利率重新定價，TLT 面臨壓力。

如果核心 PCE 意外回落至 2.8% 以下且 Section 122 關稅因法律挑戰凍結，→ 升息討論淡出，市場焦點回到降息時間表，6 月降息定價機率回升。

如果通膨持平（核心 PCE 維持 2.9%-3.0%）但就業走軟（非農低於 10 萬、失業率破 4.5%），→ Fed 進入停滯性通膨兩難——既無法降息也無法升息，利率長期凍結在 3.50%-3.75%。

## 結語

> **核心判斷：** 升息討論的本質不是鷹派恐嚇，而是 3.625% 減 3.0% 只剩 0.6% 的現實——在通膨拒絕下行的情境中，Fed 發現自己的「緊縮」可能從未真正緊縮過。

| Metric | Threshold | Window | Implication |
|--------|-----------|--------|-------------|
| 核心 PCE 年增率 | 連續兩個月 ≥ 3.0% | 2/26 及 3/28 公布值 | 升息從討論轉為前瞻指引的實質選項 |
| 10 年期公債殖利率 | 升破 4.25% 且維持一週 | 3 月 FOMC 前 | 市場開始定價升息機率，抵押貸款利率連動上行 |
| 非農就業月增 | 連續兩月低於 10 萬人 | 3/7 及 4/4 公布值 | 就業惡化將壓制升息可能，重啟降息敘事 |

關鍵觀察變數：（一）2 月 26 日 1 月 PCE 報告，驗證 CPI-PCE 裂口是否持續；（二）Section 122 關稅的法律挑戰進度；（三）3 月 18 日 FOMC 點陣圖 (Dot Plot) 與紀要措辭。TLT 暴露於長端利率重定價風險，USFR 受惠於短端利率維持高位的情境。

---

*資料來源：[FOMC 一月紀要](https://www.federalreserve.gov/monetarypolicy/fomcminutes20260128.htm)、[Dallas Fed Logan 演講](https://www.dallasfed.org/news/speeches/logan/2026/lkl260210)、[Goldman Sachs PCE 分析](https://markets.financialcontent.com/stocks/article/marketminute-2026-2-18-goldman-sachs-issues-305-core-pce-alarm-why-the-inflation-disconnect-could-freeze-fed-rate-cuts-until-summer-2026)、[NY Fed 通膨數據分析](https://libertystreeteconomics.newyorkfed.org/2026/02/seeing-through-the-shutdowns-missing-inflation-data/)、[Yale Budget Lab 關稅報告](https://budgetlab.yale.edu/research/state-tariffs-february-21-2026)、[BEA PCE 數據](https://www.bea.gov/data/personal-consumption-expenditures-price-index-excluding-food-and-energy)、[CME FedWatch](https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html)*
*市場數據截至：2026-02-22*
*本文僅供參考，不構成投資建議。*
