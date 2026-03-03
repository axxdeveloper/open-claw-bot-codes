---
layout: post
title: "高市早苗的豪賭：122 兆預算、JGB 殖利率飆升與「Sanaenomics」的三條路徑"
date: 2026-02-22 08:00:00 +0800
categories: [macro]
tags: [macro, japan, geopolitics, boj]
macro_kind: long
description: "高市早苗大選壓勝後推出 122.3 兆日圓預算，10 年期 JGB 殖利率飆至 1999 年以來新高 2.38%。本文拆解 Sanaenomics 的財政算術、BOJ 獨立性風險與中日摩擦，以條件推理框架評估三條分水嶺路徑。"
lang: zh-TW
---

## 122 兆預算與 JGB 的代價

高市早苗 (Takaichi Sanae) 於 2025 年 10 月 4 日擊敗小泉進次郎，在自民黨總裁決選中以 [185 票對 156 票勝出](https://www.cfr.org/blog/prime-minister-takaichi-sanae-takes-charge)，10 月 21 日就任日本首位女性首相。公明黨結束長達 26 年的聯合執政，高市轉與日本維新會結盟，並於 2026 年 1 月 23 日宣布提前大選。2 月 8 日自民黨取得[眾議院三分之二絕對多數](https://www.cnbc.com/2026/02/09/japan-stocks-set-to-soar-after-takaichi-secures-historic-mandate.html)——史上最大國會多數。選後首個交易日日經 225 指數突破 57,000 點，2 月 10 日再上攻 58,000 點，均為歷史新高。

市場稱之為「高市交易」(Takaichi Trade)，但在歡欣背後，10 年期 JGB 殖利率於 1 月底飆至 [2.38%，為 1999 年以來最高](https://www.ainvest.com/news/japan-10-year-jgb-yield-extends-decline-2-16-5-year-auction-2602/)；40 年期殖利率更突破 [4% 的歷史紀錄](https://www.cnbc.com/2026/01/20/japan-40-year-jgb-government-bond-yield-record-fiscal-jitters-snap-election-call-takaichi.html)。日經創歷史新高、自民黨拿下史上最大國會多數，但 JGB 殖利率飆至 1999 年以來最高——「高市交易」是基本面驅動還是財政幻覺？

## 財政擴張、央行獨立與地緣摩擦：因果拆解

<aside style="float: right; width: 220px; margin: 0 0 1em 1.5em; padding: 0.75em 1em; background: rgba(100,116,139,0.15); border-left: 3px solid rgba(100,116,139,0.4); font-size: 0.82em; line-height: 1.6; border-radius: 4px;">
<strong>JGB</strong>：日本國債 (Japanese Government Bond)，日本政府的舉債工具。殖利率上升意味政府借錢成本增加。<br>
<strong>Sanaenomics</strong>：市場對高市早苗經濟政策的稱呼，類比安倍經濟學 (Abenomics)。
</aside>

第一個解釋角度是財政擴張的規模與起跑線差異。高市內閣的 FY2026 預算創下 [122.3 兆日圓紀錄](https://www.kurdistan24.net/en/story/883645/japan-cabinet-approves-record-1223-trillion-budget-amid-rising-debt-costs-and-defense-buildup)，較 FY2025 增加 7.1 兆，其中債務還本付息達 31.3 兆日圓——占預算約 25%，這個數字本身就超過經濟刺激方案（21.3 兆）與國防預算（9 兆）的總和。再加上食品消費稅暫停兩年（約 5 兆年稅收缺口）、所得稅減免約 1.2 兆、廢除汽油稅、延續電力與天然氣補貼，[東亞論壇 (East Asia Forum) 直言「Sanaenomics 的財政算術對不起來」](https://eastasiaforum.org/2025/12/08/sanaenomics-fiscal-arithmetic-doesnt-add-up/)。補充預算 18.3 兆日圓規模與 [FY2022 新冠疫情時期相當](https://www.ssga.com/us/en/institutional/insights/sanae-taikichi-and-japan-new-direction)。

<div style="clear: both;"></div>

### Sanaenomics 的財政帳本

<div style="max-width: 600px; margin: 2em auto;">
  <canvas id="macroChart10"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
new Chart(document.getElementById('macroChart10'), {
  type: 'bar',
  data: {
    labels: ['FY2026 預算\n（總額）', '債務還本付息', '經濟刺激方案', '國防預算', '食品消費稅\n暫停（年缺口）', '所得稅減免'],
    datasets: [{
      label: '兆日圓',
      data: [122.3, 31.3, 21.3, 9.0, 5.0, 1.2],
      backgroundColor: [
        'rgba(59, 130, 246, 0.75)',
        'rgba(239, 68, 68, 0.75)',
        'rgba(16, 185, 129, 0.75)',
        'rgba(245, 158, 11, 0.75)',
        'rgba(139, 92, 246, 0.75)',
        'rgba(107, 114, 128, 0.75)'
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
        text: 'Sanaenomics 主要財政承諾規模（來源：MOF, 首相官邸, Al Jazeera）',
        color: '#e2e8f0',
        font: { size: 12 }
      },
      legend: { display: false }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', callback: function(v) { return v + '兆'; } },
        grid: { color: 'rgba(255,255,255,0.1)' },
        title: { display: true, text: '兆日圓', color: '#94a3b8' }
      },
      y: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  }
});
</script>

市場自然會將「高市交易」與 2012-2013 年的「安倍交易」做類比，但起跑線截然不同。安倍面對的是通縮環境：核心 CPI 接近 0%、10 年期 JGB 殖利率僅 0.7%、債務對 GDP 約 220%。高市面對的是核心 CPI 2.0%、10 年期 JGB 2.15%、債務對 GDP 約 230%，加上 2021 年以來累計上漲 12% 的物價水準與[實質薪資下降 7%](https://asiatimes.com/2026/02/take-takaichi-fiscal-policy-seriously-the-ladys-not-for-turning/) 的類停滯性通膨環境。安倍可以放手印鈔而不擔心物價；高市的財政擴張卻直接碰撞仍在升息通道的 BOJ。

<aside style="float: right; width: 220px; margin: 0 0 1em 1.5em; padding: 0.75em 1em; background: rgba(100,116,139,0.15); border-left: 3px solid rgba(100,116,139,0.4); font-size: 0.82em; line-height: 1.6; border-radius: 4px;">
<strong>殖利率曲線陡峭化</strong>：長天期利率比短天期利率上升更快，通常反映市場對未來通膨或財政風險的擔憂。
</aside>

第二個解釋角度是 BOJ 獨立性與日圓賭局。高市公開表示通膨屬「成本推動型」，主張 BOJ 應放慢升息步伐，並稱政府應與央行「協調」政策方向——這類措辭被市場解讀為對[央行獨立性的壓力](https://am.jpmorgan.com/sg/en/asset-management/institutional/insights/market-insights/market-updates/on-the-minds-of-investors/takaichis-ldp-election-win-and-the-policy-implications/)。BOJ 於 2025 年 12 月 19 日[將政策利率上調至 0.75%](https://www.cnbc.com/2025/12/19/bank-of-japan-boj-rate-cpi-inflation-takaichi-ueda.html)，為 1995 年以來最高，市場預期 2026 年中再升至終端利率約 1.0%。USD/JPY 一度衝至約 158.91，逼近 2024 年 7 月日本當局干預匯市的水準，市場將 [160 視為干預臨界線](https://www.forex.com/en/news-and-analysis/usdjpy-in-2026-can-the-yen-finally-start-to-shine/)。高市本人則稱弱勢日圓是「出口的重大機遇」。2026 年 1 月日本核心 CPI 為 [2.0%](https://www.cnbc.com/2026/02/20/japan-core-inflation-january-boj-target-gdp-growth.html)，核心核心 CPI（扣除食品與能源）為 2.6%，總體 CPI 為 1.5%；2025 年全年 GDP 成長 1.1%，Q4 僅 +0.1%。在物價黏著、經濟動能趨緩的背景下，財政擴張搭配央行壓抑利率，可能短期刺激名目成長，但中期加劇殖利率曲線陡峭化與日圓貶值壓力。

<aside style="float: right; width: 220px; margin: 0 0 1em 1.5em; padding: 0.75em 1em; background: rgba(100,116,139,0.15); border-left: 3px solid rgba(100,116,139,0.4); font-size: 0.82em; line-height: 1.6; border-radius: 4px;">
<strong>Rapidus</strong>：日本政府支持的半導體新創公司，目標量產 2 奈米製程晶片，與台積電競爭先進製程。
</aside>

第三個解釋角度是產業政策與地緣摩擦的拉鋸。Sanaenomics 的產業牌面宏大：[7 兆日圓（約 450 億美元）投入 Rapidus 開發 2 奈米晶片](https://thediplomat.com/2025/10/takaichis-ambitious-economic-and-security-agenda-for-japan/)、高科技製造 7% 生產力稅額抵免、AI 與綠能研發 50% 抵免，國防預算約 9 兆日圓，朝 GDP 2% 目標邁進。選後防衛股暴漲——川崎重工 2 月 8 日[單日飆升 17%](https://finance.yahoo.com/news/japan-defense-stocks-surge-takaichi-045049667.html)，2026 年迄今上漲約 60%，IHI 同期漲約 50%。外資在 2025 年淨買入日股約 [380 億美元，為 2013 年以來最高](https://www.wisdomtree.com/investments/blog/2025/10/08/takaichi-trades-buy-japan-and-asia-defense-post-election)。然而高市在台灣議題上的強硬發言（稱台海危機為「攸關生存的情勢」）[觸發中國外交反彈](https://time.com/7336391/china-japan-taiwan-dispute-takaichi-xi-economic-costs-diplomatic-relations/)：海鮮禁令恢復、觀光取消約 30% 計畫中的中國旅客行程（預估觀光損失 5-12 億美元）。日本已將稀土對中依賴從 2010 年的 90% 降至約 60%，但仍有脆弱性。豐田、Sony 等在中國有龐大業務的企業對政策走向保持觀望。

加州大學柏克萊分校的經濟學家指出，高市的減稅計畫令債券持有人「不安，要求更高的風險補償」。[道富 (State Street) 的 Masahiko Loo 則提醒](https://www.cmegroup.com/insights/economic-research/2026/implications-of-sanaenomics-on-japans-yen-bonds-and-equities.html)「這個警告同樣適用於美國及其他擁有大型結構性赤字的國家」。日本政府債務已達 [1,342 兆日圓（約 9 兆美元）](https://japantoday.com/category/politics/update1-japan's-total-debt-rises-to-record-1-342-tril.-yen-in-2025)，[IMF 第四條款磋商](https://www.imf.org/en/news/articles/2025/02/07/mcs-020725-japan-staff-concluding-statement-of-the-2025-article-iv-mission)明確將財政軌跡列為核心關切。弱勢日圓還強化日本出口商對亞洲對手的競爭力——對台灣而言，2025 年台幣在 Q2 已升值超過 10%，壓縮出口產業利潤；[2026 年 GDP 成長預估 4%，增速放緩](https://english.cw.com.tw/article/article.action?id=4515)。日本大量投資 Rapidus 發展先進製程，長期或對台灣半導體供應鏈形成替代壓力——雖然 2 奈米量產時程仍充滿不確定性。此外，日本持有 [1.2 兆美元美國國債](https://www.ig.com/en/news-and-trade-ideas/takaichi-japan-debt-crisis-260211)——JGB 殖利率持續攀升可能吸引日本資金回流國內，對美債市場構成溢出效應。

三個角度當中，目前數據最支持的是第一個：財政規模與起跑線差異。安倍時代的低利率環境已不復存在，而 Sanaenomics 的新增財政負荷直接加重在本已膨脹的債務償付壓力之上——122.3 兆預算中超過四分之一用於償還過去的債務，財政乘數能否大於債務成本上升的拖累，歷史上在高債務水準下的勝率並不高。

<div style="clear: both;"></div>

## 分水嶺

如果 BOJ 維持緩慢升息至年底 1.0%、10 年期 JGB 殖利率維持 2.5% 以下，→「高市交易」屬於溫和正向，名目成長提振足以消化財政擴張的成本，日圓在 150-158 區間穩定，日經在 55,000-62,000 區間整理。這是目前數據支持的路徑：BOJ 2025 年 12 月升至 0.75% 後並未加速，選後利多短暫壓低 10 年期殖利率至約 2.15%。

如果企業治理改革持續推進、AI 資本支出帶動實質盈利成長（而非僅靠日圓貶值的匯率效果），→ 日經漲勢有基本面支撐，防衛與半導體類股的外資流入具結構性而非投機性。觀察指標是 4-5 月 Q4 財報季企業實際盈利是否跟上股價漲幅，以及外資淨買入是否從 2025 年的 380 億美元節奏延續。

如果 10 年期 JGB 殖利率突破 2.5% 持續 4 週以上，或中國擴大對日制裁至稀土出口管制，→ 需全面重評「高市交易」的結構。殖利率失控意味債務償付壓力加速惡化（31.3 兆的還本付息只會更高），而稀土制裁將直接衝擊 Rapidus 與防衛產業的供應鏈基礎。日圓若因此崩至 160 以上，將觸發干預危機。

<div style="clear: both;"></div>

## 結語

> **核心判斷：** Sanaenomics 的核心矛盾是在高債務、高通膨的起跑線上複製安倍時代的低利率財政擴張——財政乘數與債務成本的賽跑結果，取決於 JGB 殖利率能否被壓制在 2.5% 以下。

| Metric | Threshold | Window | Implication |
|--------|-----------|--------|-------------|
| 10 年期 JGB 殖利率 | 2.5% 以上持續 4 週 | 2026 Q1-Q2（下次 BOJ 會議 3 月 13-14 日） | Sanaenomics 財政算術失效，債務螺旋風險重評 |
| USD/JPY | 突破 160 持續 2 週 | 2026 H1（關注 BOJ 3 月會議後走勢） | 匯率干預臨界線，弱日圓紅利轉為進口型通膨拖累 |
| 中國對日制裁範圍 | 擴大至稀土出口管制 | 2026 H1（3 月 ASEAN 相關會議為觀察窗口） | 防衛與半導體產業鏈基礎動搖，產業政策支柱需重評 |

FY2026 補充預算 18.3 兆的國會審議將在 3-4 月進行，食品消費稅暫停的具體實施時程是財政擴張規模的關鍵確認點——若通過，5 兆年稅收缺口將正式確認，JGB 市場壓力可能再次升溫。日經 225 成分股 Q4 財報季（4-5 月）是檢驗「高市交易」是否有盈利基礎的硬數據窗口。DXJ 暴露於日圓方向（弱日圓受益、強日圓拖累），EWJ 暴露於名目成長動能，GLD 暴露於 JGB 殖利率失控引發的全球債市連鎖動盪風險。

---

*資料來源：[CNBC](https://www.cnbc.com/2026/02/09/japan-stocks-set-to-soar-after-takaichi-secures-historic-mandate.html)、[BOJ](https://www.boj.or.jp/en/mopo/outlook/gor2601a.pdf)、[Al Jazeera](https://www.aljazeera.com/economy/2026/1/27/why-japans-economic-plans-are-sending-jitters-through-global-markets)、[East Asia Forum](https://eastasiaforum.org/2025/12/08/sanaenomics-fiscal-arithmetic-doesnt-add-up/)、[CME Group](https://www.cmegroup.com/insights/economic-research/2026/implications-of-sanaenomics-on-japans-yen-bonds-and-equities.html)、[JPMorgan](https://am.jpmorgan.com/sg/en/asset-management/institutional/insights/market-insights/market-updates/on-the-minds-of-investors/takaichis-ldp-election-win-and-the-policy-implications/)、[IMF](https://www.imf.org/en/news/articles/2025/02/07/mcs-020725-japan-staff-concluding-statement-of-the-2025-article-iv-mission)、[CFR](https://www.cfr.org/blog/prime-minister-takaichi-sanae-takes-charge)、[Time](https://time.com/7336391/china-japan-taiwan-dispute-takaichi-xi-economic-costs-diplomatic-relations/)、[WisdomTree](https://www.wisdomtree.com/investments/blog/2025/10/08/takaichi-trades-buy-japan-and-asia-defense-post-election)、[IG](https://www.ig.com/en/news-and-trade-ideas/takaichi-japan-debt-crisis-260211)、[Kurdistan24](https://www.kurdistan24.net/en/story/883645/japan-cabinet-approves-record-1223-trillion-budget-amid-rising-debt-costs-and-defense-buildup)、[Japan Today](https://japantoday.com/category/politics/update1-japan's-total-debt-rises-to-record-1-342-tril.-yen-in-2025)、[Asia Times](https://asiatimes.com/2026/02/take-takaichi-fiscal-policy-seriously-the-ladys-not-for-turning/)、[The Diplomat](https://thediplomat.com/2025/10/takaichis-ambitious-economic-and-security-agenda-for-japan/)、[State Street](https://www.ssga.com/us/en/institutional/insights/sanae-taikichi-and-japan-new-direction)、[Yahoo Finance](https://finance.yahoo.com/news/japan-defense-stocks-surge-takaichi-045049667.html)、[CommonWealth](https://english.cw.com.tw/article/article.action?id=4515)、[Forex.com](https://www.forex.com/en/news-and-analysis/usdjpy-in-2026-can-the-yen-finally-start-to-shine/)、[CNBC CPI](https://www.cnbc.com/2026/02/20/japan-core-inflation-january-boj-target-gdp-growth.html)、[CNBC 40Y JGB](https://www.cnbc.com/2026/01/20/japan-40-year-jgb-government-bond-yield-record-fiscal-jitters-snap-election-call-takaichi.html)、[ainvest](https://www.ainvest.com/news/japan-10-year-jgb-yield-extends-decline-2-16-5-year-auction-2602/)、[JPM Private Bank](https://privatebank.jpmorgan.com/apac/en/insights/markets-and-investing/asf/japan-leading-the-pack-but-behind-the-curve)、[Bloomberg](https://www.bloomberg.com/news/articles/2026-02-09/japan-defense-stocks-surge-on-takaichi-s-national-security-plans)*
*市場數據截至：2026-02-21*
*本文僅供參考，不構成投資建議。*
