---
layout: post
title: "Roberts 的六個字封殺 IEEPA 關稅，但 Section 122 的 150 天倒數才是真正的賽局"
date: 2026-02-20 20:00:00 +0800
categories: [macro]
tags: [macro, tariff, geopolitics, fiscal]
macro_kind: long
description: "最高法院 6:3 裁定 IEEPA 關稅違法，但白宮當天動用 Section 122 重建 15% 全球關稅——150 天後到期、法律基礎存疑。$1,420 億退稅無自動機制，CRFB 估計判決將增加 $2.4 兆國債。真正的交易不是判決本身，而是 150 天倒數計時裡的關稅工具重組。"
lang: zh-TW
---

2 月 20 日，美國最高法院在 [*Learning Resources, Inc. v. Trump*](https://supreme.justia.com/cases/federal/us/607/24-1287/) 案中以 6:3 裁定，總統依據《國際緊急經濟權力法》(International Emergency Economic Powers Act, IEEPA) 徵收的所有關稅違法。S&P 500 [盤中漲 0.7%、Nasdaq 漲超 1%](https://www.cnbc.com/2026/02/19/stock-market-today-live-updates.html)，但漲幅收盤前收窄——因為白宮當天即動用 [Section 122](https://www.whitehouse.gov/presidential-actions/2026/02/imposing-a-temporary-import-surcharge-to-address-fundamental-international-payments-problems/) 簽署行政命令，對全球課徵 10% 臨時關稅，[隔天再調高至法定上限 15%](https://www.cnbc.com/2026/02/21/trump-tariffs.html)，2 月 24 日生效。判決當日 VIX 從 19.62 跳升至 [20.71](https://finance.yahoo.com/quote/%5EVIX/)（+5.57%），波動率上升反映的不是判決利多，而是關稅工具重組的法律不確定性。三個不同的法律權限、兩天內的三次關稅政策轉向——最高法院推翻 IEEPA 關稅是市場利多，但白宮即日啟動 Section 122 備案——這場法律戰真正的終局是什麼？

## 從 IEEPA 到 Section 122：關稅工具降級、財政缺口擴大、退稅無門的三重困局

<div style="max-width: 600px; margin: 2em auto;">
  <canvas id="macroChart9"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
new Chart(document.getElementById('macroChart9'), {
  type: 'bar',
  data: {
    labels: [
      'IEEPA 對等關稅\n（已推翻）',
      'IEEPA 芬太尼關稅\n（已推翻）',
      'Section 122\n全球 15%（新增）',
      'Section 232\n鋼鋁 50%（不受影響）',
      'Section 232\n汽車 25%（不受影響）',
      'Section 301\n調查中'
    ],
    datasets: [{
      label: '估計年度關稅收入（十億美元）',
      data: [95, 38, 55, 25, 15, 0],
      backgroundColor: [
        'rgba(239, 68, 68, 0.7)',
        'rgba(239, 68, 68, 0.5)',
        'rgba(251, 191, 36, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(59, 130, 246, 0.5)',
        'rgba(148, 163, 184, 0.4)'
      ],
      borderColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(251, 191, 36, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(148, 163, 184, 1)'
      ],
      borderWidth: 1
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: '各法律依據關稅收入估算（資料來源：Yale Budget Lab, CRFB, Tax Foundation）',
        color: '#e2e8f0',
        font: { size: 12 }
      },
      legend: { display: false }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', callback: function(v) { return '$' + v + 'B'; } },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  }
});
</script>

<aside style="float: right; width: 220px; margin: 0 0 1em 1.5em; padding: 0.75em 1em; background: rgba(100,116,139,0.15); border-left: 3px solid rgba(100,116,139,0.4); font-size: 0.82em; line-height: 1.6; border-radius: 4px;">
<strong>重大問題原則 (Major Questions Doctrine)</strong>：最高法院近年發展的法律原則——行政機關若主張具有重大經濟或政治影響的權力，必須指出國會的明確授權。2022 年 <em>West Virginia v. EPA</em> 確立此原則。
</aside>

第一層解釋是法律地震本身改變了關稅工具箱的結構。Roberts 的[多數意見](https://www.supremecourt.gov/opinions/25pdf/24-1287_4gcj.pdf)區分了「管制進口」(regulate importation) 與「對進口徵稅」(impose tariffs)——IEEPA 授權總統在國家緊急狀態下「管制」進出口，但關稅「[直接對國內進口商徵收以增加政府收入](https://www.scotusblog.com/2026/02/a-breakdown-of-the-courts-tariff-decision/)」，這是憲法第一條明確保留給國會的徵稅權。Roberts 寫道：「[當國會授予徵收關稅的權力時，它會明確地、附帶審慎限制條件地這樣做。IEEPA 兩者皆無。](https://www.cbsnews.com/news/trump-tariffs-supreme-court-decision/)」Roberts、Gorsuch 與 Barrett 進一步引用重大問題原則：IEEPA 自 1977 年立法以來 50 年間，[沒有任何一位總統援引它來徵收關稅](https://www.scotusblog.com/2026/02/a-breakdown-of-the-courts-tariff-decision/)，歷史上的「不使用」本身就是反證。Kavanaugh 的[少數意見](https://supreme.justia.com/cases/federal/us/607/24-1287/)主張「管制進口」與「調整進口」在實質上無法區分，並警告重大問題原則「[從未被適用於外交事務法規](https://reason.com/2026/02/20/gorsuch-blasts-thomas-alito-and-kavanaugh-for-favoring-trumps-illegal-tariffs/)」。Gorsuch 的回擊相當尖銳——他[逐案列舉](https://reason.com/2026/02/20/gorsuch-blasts-thomas-alito-and-kavanaugh-for-favoring-trumps-illegal-tariffs/) Thomas、Alito、Kavanaugh 三人過去在重大問題原則案件中的投票紀錄，指出他們的立場無法與本案調和。IEEPA 賦予的是即時、無上限、可針對個別國家的關稅權；Section 122 給的是 15% 上限、150 天期限、全球一體適用的臨時工具——覆蓋率和精準度大幅縮水。

第二層解釋是 Section 122 本身的法律基礎已岌岌可危。這條 1974 年的法律允許總統在「重大且嚴重的國際收支赤字」(large and serious balance-of-payments deficits) 下課徵最高 [15% 的臨時關稅，為期 150 天](https://www.cfr.org/articles/how-trumps-tariffs-could-survive-the-supreme-court-ruling)。但 BCA Research 首席全球策略師 Peter Berezin [明確指出](https://fortune.com/2026/02/21/trump-tariffs-section-122-trade-law-trade-deficit-capital-account-surplus-balance-of-payments/)：「國際收支赤字和貿易赤字不是同一件事。在浮動匯率制度下，美國不可能出現國際收支赤字。」美國確實有貿易逆差，但資本帳的順差完全抵消——國際收支淨額在浮動匯率下恆等於零，Section 122 的法律前提可能根本不成立。更關鍵的結構性限制：Section 122 [必須全球一體適用，不能針對個別國家](https://www.cfr.org/articles/how-trumps-tariffs-could-survive-the-supreme-court-ruling)，原先對加拿大、墨西哥、中國的「芬太尼關稅」無法透過此條復活。[Cato Institute 的 Clark Packard 警告](https://www.cato.org/blog/supreme-court-got-it-right-ieepa-dont-pop-champagne-yet)，150 天只是緩衝，行政部門正全速啟動 Section 232（商務部 [270 天調查](https://www.congress.gov/crs-product/IF13006)，對稅率無上限）與 Section 301（需 [12–18 個月正式調查](https://thehill.com/business/trade/5748172-trump-tariffs-section-301/)）——兩條路都比 IEEPA 慢得多、門檻高得多，但一旦建立，持久得多。

<aside style="float: right; width: 220px; margin: 0 0 1em 1.5em; padding: 0.75em 1em; background: rgba(100,116,139,0.15); border-left: 3px solid rgba(100,116,139,0.4); font-size: 0.82em; line-height: 1.6; border-radius: 4px;">
<strong>國際貿易法院 (Court of International Trade)</strong>：位於紐約的聯邦專業法院，專門處理進出口爭議、海關估價與關稅退還訴訟。退稅案件須在此提起。
</aside>

第三層解釋是財政衝擊與退稅困局共同放大了不確定性。CBP 數據顯示 IEEPA 關稅在 2025 年共徵收約 [$1,420 億](https://budgetlab.yale.edu/research/state-us-tariffs-february-20-2026)，最高法院明確表示政府「[可能被要求退還數十億美元](https://supreme.justia.com/cases/federal/us/607/24-1287/)」，但刻意未指定退稅機制——退稅須經[國際貿易法院](https://www.swlaw.com/publication/supreme-court-strikes-down-ieepa-tariffs-the-refund-process-will-be-messy/)逐案審理，TD Securities 估計整個流程需 [12–18 個月](https://fortune.com/2026/02/21/tariff-refunds-legal-fight-trade-courts-companies-importers-consumers/)，[Fortune 報導](https://fortune.com/2026/02/21/tariff-refunds-legal-fight-trade-courts-companies-importers-consumers/)更直言「美國企業面臨的是長達五年的法律戰」，而退稅對象是進口商，不是消費者——已轉嫁的成本不會自動退回。與此同時，[CRFB 估算](https://www.crfb.org/blogs/scotus-tariff-ruling-could-add-24-trillion-debt)判決將淨減少 $1.9 兆收入、增加 $2.4 兆國債至 FY2036，債務占 GDP 比率將從 CBO 基準的 120% 攀升至 [125%](https://www.crfb.org/blogs/scotus-tariff-ruling-could-add-24-trillion-debt)。CBO 假設 10 年期殖利率降至 3.6% 而市場目前定價 4.1%——若利率假設失準再疊加關稅收入消失，實際債務路徑比官方預測更陡。[Tax Policy Center 估算](https://taxpolicycenter.org/taxvox/supreme-court-ruling-ieepa-tariffs-could-ease-cost-burdens-less-you-might-think)取消 IEEPA 關稅可降低家庭年均成本 $1,200–1,500，但 Section 122 的 15% 立即接力、Section 232 鋼鋁 50%/汽車 25% 完好無損，[Yale Budget Lab](https://budgetlab.yale.edu/research/state-us-tariffs-february-20-2026) 估計剩餘關稅仍使 GDP 永久縮小 0.1%（約 $300 億/年），失業率年底前上升 0.3 個百分點。Pangaea Policy 創辦人 Terry Haines 的[判斷](https://ca.finance.yahoo.com/video/scotus-tariff-ruling-markets-understand-161014286.html)或許最精準：「投資人應準備好面對基於炒作的過度反應，接著很快回落到現實」——因為「關稅哪兒也不會去」(tariffs are here to stay)。

<div style="clear: both;"></div>

## 分水嶺

如果 Section 122 在 150 天內被法院以「國際收支赤字」定義不成立為由推翻，→ 關稅出現真空窗口，Section 232/301 調查尚未完成、無法接力，進口成本短期顯著下降，但政策混亂升級將推高波動率——這是關稅結構全面重估的信號。

如果 150 天倒數期間（約至 7 月 19 日）商務部加速完成 Section 232/301 調查並建立新關稅，→ Section 122 只是過渡工具，長期關稅結構在不同法律基礎上重建。市場短期利多被證明只是過渡，關稅的覆蓋率和稅率可能回升至接近 IEEPA 時期水準——判決的實質效力被程序繞過。

如果國會在 150 天內通過新法案直接授權總統徵收關稅，→ 最高法院判決的法律意義被立法推翻，回到比 IEEPA 更穩固的關稅框架。這是結構性改變最劇烈的路徑——行政權與立法權合流意味著未來的法律挑戰空間大幅壓縮，需要全面重評關稅對通膨和財政的長期影響。

<div style="clear: both;"></div>

## 結語

> **核心判斷：** 這個判決的本質是關稅工具的「降級」而非「撤除」——IEEPA 的即時、無上限、可針對特定國家的權力被替換為 Section 122 的 15% 上限、150 天期限、全球一體適用，而 150 天倒數計時本身就是行政部門重建長期關稅結構的窗口。

| Metric | Threshold | Window | Implication |
|--------|-----------|--------|-------------|
| Section 122 法律挑戰進度 | 國際貿易法院受理並發布臨時禁令 | 150 天內（~7 月 19 日到期）| 關稅空窗期擴大，需重評進口成本與通膨路徑 |
| Section 232/301 調查進展 | 商務部完成至少一項 Section 232 調查報告 | 270 天調查期（~11 月），下次進度更新預計 5 月 | 長期關稅接力結構是否成型的關鍵指標 |
| CBP 退稅申請量 | 累積退稅申請金額超過 $500 億 | Q2 2026（首波截止期限後）| 退稅規模直接影響 FY2026 赤字預測與國債發行節奏 |

Section 122 的法律挑戰將是下一個焦點——進口商是否在數週內對「國際收支赤字」定義提起訴訟，將決定 15% 全球關稅能否存續到 7 月。與此同時，150 天倒數期間 Section 232/301 調查的實際進度值得持續追蹤，因為這決定了關稅空窗期會有多長。3 月 FOMC 會議也值得關注——關稅工具重組期的通膨不確定性是否影響 Fed 對降息路徑的評估，目前 6 月降息機率約 [83%](https://www.cnbc.com/2026/02/13/cpi-inflation-report-january-2026.html)，Section 122 關稅的維持可能成為下修的理由。

---

*資料來源：[SCOTUS 判決全文](https://www.supremecourt.gov/opinions/25pdf/24-1287_4gcj.pdf)、[SCOTUSblog](https://www.scotusblog.com/2026/02/a-breakdown-of-the-courts-tariff-decision/)、[Justia](https://supreme.justia.com/cases/federal/us/607/24-1287/)、[CFR](https://www.cfr.org/articles/how-trumps-tariffs-could-survive-the-supreme-court-ruling)、[Yale Budget Lab](https://budgetlab.yale.edu/research/state-us-tariffs-february-20-2026)、[CRFB](https://www.crfb.org/blogs/scotus-tariff-ruling-could-add-24-trillion-debt)、[Cato Institute](https://www.cato.org/blog/supreme-court-got-it-right-ieepa-dont-pop-champagne-yet)、[CNBC](https://www.cnbc.com/2026/02/20/supreme-court-trump-tariffs-ruling.html)、[Fortune](https://fortune.com/2026/02/21/trump-tariffs-section-122-trade-law-trade-deficit-capital-account-surplus-balance-of-payments/)、[Tax Policy Center](https://taxpolicycenter.org/taxvox/supreme-court-ruling-ieepa-tariffs-could-ease-cost-burdens-less-you-might-think)、[白宮 Section 122 行政命令](https://www.whitehouse.gov/presidential-actions/2026/02/imposing-a-temporary-import-surcharge-to-address-fundamental-international-payments-problems/)*
*市場數據截至：2026-02-22*
*本文僅供參考，不構成投資建議。*
