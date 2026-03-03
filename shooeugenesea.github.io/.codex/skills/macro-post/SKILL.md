---
name: macro-post
description: "Generate macro blog posts in Traditional Chinese (thinking frameworks, not predictions): Monday long-form, other days short-form or brief, multiple posts per day allowed"
---

# /macro-post

Generate blog posts in Traditional Chinese anchored to economic and market impact. The blog sells **thinking frameworks**, not predictions or allocation advice.

- **Default mode** — 根據當日新聞量自動決定篇數。週一至少一篇長篇，其餘日短篇或快報。Every post uses a unified 4-section skeleton.
- **Topic mode** — 1 deep-research post on a user-specified topic (long-form by default)

## Usage

- `/macro-post` — 今日文章（自動判斷篇數與篇幅）
- `/macro-post "tariff impact on bonds"` — default mode with topic hint
- `/macro-post 我想要一篇關於「商業不動產 CMBS 到期牆」的深度研究` — topic mode: 1 deep-research post

**Mode detection rule:** If the user's message explicitly requests a specific topic for a single article (e.g., "我想要一篇關於…", "幫我研究…", "寫一篇…關於…", "深度分析…"), enter **topic mode**. Otherwise, use **default mode**.

## Editorial Objective

Output should position the blog as a **rational safe haven** readers instinctively turn to during market volatility. Prioritize **neutral, evidence-weighted structural analysis** for readers who want to think clearly, not be told what to do.

- Present causal frameworks with multiple explanations, not single-narrative conclusions
- Use conditional reasoning (if/then), not probability-weighted scenarios
- ETF tickers may appear as exposure-mechanism examples, never as allocation advice
- Prefer restrained language; avoid sensational framing unless explicitly quoting a source
- Separate what you know from what you infer; make the boundary visible

## Post Structure (Unified Skeleton)

All posts share a single 4-section skeleton. No style labels. The descriptive title in section 2 and the presentation method (comparison table / counter-evidence / dilemma decomposition) may vary, but the 4-section structure is fixed.

### 1. 開場（內部標籤，不要用作 heading）

The `##` heading must be a descriptive title that reflects this post's specific content — never use generic labels like「開場：市場現象 + 核心疑問」. Good examples:「紀要中的六個字」、「協定簽了，但數字對不上」.

What is everyone confused about? What single question does this post answer?

State the core question (must end with `？`). All subsequent sections must serve this question — if a paragraph doesn't, delete it or split it to another post.

**New reader retention (mandatory):** In the first ~60 seconds, a new reader should understand (a) what happened, (b) what you will explain, (c) why it matters. To enforce this:
- **First paragraph**: 1–2 sentences, describe the observable phenomenon with at most **2** key numbers.
- **Core question**: one sentence ending with `？` (no sub-questions).
- **Immediately after the core question**, use 1-2 sentences of natural prose to preview what the reader will take away: a reusable framework, the key metric/threshold to watch, and the next data point or date. Do NOT use bullet lists, bold labels, or the phrase「你會得到什麼」— weave the preview into the opening narrative.

**Link hygiene in 開場：** Keep inline links minimal to avoid forcing early click-outs:
- In section 1, prefer **1–2 source links per paragraph** (bundle multiple sources at the end of the paragraph if needed).
- Avoid putting more than **3** inline links in the first ~180 words.

### 2. [Descriptive Title]：因果拆解（主體）

2-3 possible explanations for the phenomenon, each with evidence. Point out which one is currently most supported by data.

- Chart.js chart (see Chart Guidelines below)
- Presentation may vary (comparison table / counter-evidence method / dilemma decomposition), but the section structure is fixed
- The descriptive title must reflect the post's specific content — never reuse the same generic title across posts

### 3. 分水嶺

What conditions, if met or broken, would change the structural picture?

Use conditional reasoning (no probabilities):
- 如果 [observable condition A]，→ result description（目前數據支持的路徑）
- 如果 [observable condition B]，→ result description（結構轉變信號）
- 如果 [observable condition C]，→ result description（需要全面重評）

### 4. 結語

**Core judgment blockquote** (mandatory, placed first in 結語):
```
> **核心判斷：** 一句可分享的框架
```

**Invalidation conditions** (mandatory, standardized table):

| Metric | Threshold | Window | Implication |
|--------|-----------|--------|-------------|
| [metric name] | [threshold + continuity requirement] | [observation period + next data point date] | [framework-level reassessment, not trading instruction] |

Rules for invalidation table:
- 2-4 rows per post (avoid catch-all lists)
- Threshold must include continuity duration or count (verifiable)
- Window must include observation period and ideally the next data release date
- Implication must be a framework-level reassessment, not a trading instruction

**What to watch next** — 2-3 variables

### 三級篇幅制

| 級別 | 字數 | 因果拆解 | 分水嶺 | 圖表 | 失效條件 | 使用時機 |
|------|------|----------|--------|------|----------|----------|
| **長篇** | 900-1200 | 3 種解釋 | 完整 3 條 | 必須 | 2-4 條 | 每週一固定；或重大數據日 |
| **短篇** | 600-800 | 2 種解釋 | 3 條（精簡） | 必須 | 2-3 條 | 有明確題材的一般日 |
| **快報** | 350-550 | 1 種解釋（最可能的）+ 簡述替代解釋 | 2 條 | 可選 | 1-2 條 | 低新聞日、週末、延續性追蹤 |

**快報的骨架仍是 4 段**（開場→因果拆解→分水嶺→結語），但每段壓縮：
- 開場：1-2 句 + 核心問題
- 因果拆解：1 個主要解釋 + 一句帶過替代可能
- 分水嶺：2 個 if/then
- 結語：核心判斷 + 1-2 條失效條件 + 1 個觀察變數

**快報的研究深度**：research depth gate 降為 2/5（至少命中 primary source + 一個其他層），允許 fewer web searches（3-5 instead of 5-8）。

### 週節奏

**時間口徑：** 以部落格 timezone `Asia/Taipei` (UTC+8) 決定「今天是週幾」與發文日期，避免跨時區誤判週一。

| 日 | 預設篇幅 | 說明 |
|----|----------|------|
| 週一 | 長篇 | 固定長篇。 |
| 週二-五 | 短篇 | 當日最值得拆解的一個題材。有題材就短篇，沒有好題材就降為快報。 |
| 週六-日 | 快報 | 預設快報。除非週末出現重大突發事件才升級為短篇。 |
| 任一天 | crisis / correction | 優先產出，可與當日其他文章並存。 |

**升降級規則：**
- 重大數據日（Fed 決議、非農、CPI、GDP）：當日預設至少短篇；若在週二-五 → 升級為長篇
- 短篇日無好題材 → 降級為快報
- 快報日遇突發事件 → 升級為短篇
- 任何日 crisis mode 觸發 → 直接產出危機文（500-800 字），取代當日預設
- Step 0.5 發現失效條件觸發 → 直接修正文取代當日預設

### Tags

- Fixed base tag: `[macro]`
- Tag order: `[macro, <primary_topic>, ...]` — primary_topic in second position for topic identification
- Topic tags by content: `fed`, `bonds`, `geopolitics`, `ai`, `semiconductor`, `taiwan`, `gold`, `employment`, `fiscal`, `china`, `tariff`, `energy`, etc.
- `etf` tag: only when the post specifically discusses ETF mechanisms (not just because a ticker is mentioned)
- Special tags: `correction` (correction posts), `crisis` (crisis posts)

## Special Post Types

### Correction Post (修正文) — 400-600 words

Triggered when Step 0.5 detects that a recent post's invalidation condition has been triggered by new data. Correction posts take priority over regular posts.

**Tags:** `[macro, correction, <primary_topic>]`
**Front matter:** `macro_kind: correction`

**Structure:**

Core question (opening): 「[Which assumption needs re-examination?]」

**當初的判斷** — What the original post said, what assumptions it relied on

**哪個假設失效** — Which invalidation condition was triggered (use standardized table format), what the evidence is

**新的結構** — Updated causal framework + new invalidation conditions

**可泛化的教訓** — What methodological lesson this correction teaches

> **核心判斷：** [The essence of the correction — placed at the end because the lesson itself is the judgment]

**Front matter addition** — add this HTML banner at the top of the post body (no layout change needed):
```html
<div style="padding: 0.75em 1em; margin-bottom: 1.5em; background: rgba(234,179,8,0.15); border-left: 4px solid rgba(234,179,8,0.6); border-radius: 4px; font-size: 0.95em;">
⚠️ 本文為修正文，更新先前 <a href="[link to original post]">[original post title]</a> 的判斷框架。
</div>
```

### Crisis Mode (危機文) — 500-800 words

**Trigger conditions (any one):**
- VIX > 30 sustained for 2+ trading days
- S&P 500 single-day drop > 3%
- Major geopolitical escalation (military action, sovereign default, emergency central bank measures)

**Fallback** (if no real-time market data): Use news density from the past 48 hours — if mainstream media headlines densely feature crash/rout/liquidity/emergency central bank measures, or if research agents report a clear shift to panic tone. If the workflow has web fetch, try to get latest VIX and SPX daily change first.

Only produce ONE post. Overrides regular output.

**Tags:** `[macro, crisis, <primary_topic>]`
**Front matter:** `macro_kind: crisis`

**Structure:**

Core question (opening): 「[What type of volatility is this? Has the structure changed?]」

> **核心判斷：** [One-sentence classification — placed first because this is what readers need in the first second]

**事件分類** — Liquidity event / earnings shock / valuation reset / exogenous shock

**結構是否改變** — Check existing posts' invalidation conditions (standardized table format, item by item): which are triggered, which still hold

**現在該看什麼** — 3 variables, ranked by signal-to-noise ratio, each with: current value, threshold, what a breach means

**不需要做什麼** — Why the structure may still be intact (counter-panic reasoning)

## Execution Steps

### Step 0: Mode Detection

Parse the user's input to determine which mode to use:

- If the user explicitly requests a specific topic for a single article (keywords: "我想要一篇關於…", "幫我研究…", "寫一篇…關於…", "深度分析…", or similar phrasing indicating a single deep-dive), enter **Topic Mode** → skip to **Topic Mode Steps** below.
- Otherwise → **Default Mode** → proceed with Steps 1-5 below.

**Crisis mode check:** Before proceeding with either mode, check whether crisis conditions are met (see Special Post Types > Crisis Mode). If crisis conditions are detected, override normal output and produce only a crisis post.

### Step 0.5: Publication Frequency & Quality Gate (MANDATORY)

Before generating any new posts, assess whether it's the right time to publish. This step prevents quality degradation from over-publishing.

**1. Determine today's format tier (週節奏).** Check what day of the week it is (use `Asia/Taipei` timezone) and set the default format:
- **週一** → 長篇。
- **週二-五** → 短篇。如遇重大數據發布（Fed 決議、非農、CPI、GDP）→ 升級為長篇。無好題材 → 降為快報。
- **週六-日** → 快報。除非週末出現重大突發事件才升級為短篇。
- **任何日 crisis mode 觸發** → 危機文（500-800 字），取代當日預設。
- **任何日失效條件觸發** → 修正文（400-600 字），取代當日預設。

**週一長篇補缺檢查：** 若今天是週一且未觸發 crisis/correction：
- 檢查 `_posts/` 中上一個週一日期的 macro 文章是否有 `macro_kind: long`
- 若舊文缺少 `macro_kind`（尚未回填），以字數 > 900 視為長篇
- 若上週一未發長篇 → 本週一強制長篇

**2. Check publishing cadence (7-day rolling window).** Count how many macro posts were published in the last 7 days (read `_posts/` filenames, only count files whose `categories` include `macro`). Apply these rules:
- **≤ 14 posts in last 7 days** → proceed normally
- **15-20 posts in last 7 days** → warn the user: "最近 7 天已發 N 篇，注意品質可能稀釋。" Proceed if each topic passes the research depth gate.
- **≥ 21 posts in last 7 days** → STOP. Tell the user: "最近 7 天已發 N 篇，密集發文會稀釋品質與讀者注意力。" Only proceed if the user explicitly confirms.
- **Same-day duplicate check**: If the exact same primary_topic was already published TODAY (same date and same primary_topic tag in `_posts/`), skip that topic. Different topics on the same day are allowed.

**3. Check invalidation conditions.** Read the 2-3 most recent posts' invalidation condition tables. Cross-reference against latest available data (use research agents if needed). If any invalidation condition has been triggered by new data, **prioritize producing a correction post** (see Special Post Types > Correction Post).

**4. Spot-check existing post quality.** Read the 2-3 most recent posts. Check for these quality red flags:
- **Template voice** — bold labels like "**事實：**", "**推論：**", "**一句話結論：**" appearing as fill-in-the-blank fields instead of natural prose
- **Directive language** — "建議/應該/加碼/減碼/買進/賣出/佈局/進場" appearing outside of exposure-mechanism context
- **Conclusion convergence** — multiple recent posts reaching the same takeaway
- **Generic analysis** — statements an experienced investor would consider obvious

If 2+ red flags are found in recent posts, report them to the user and ask whether to fix existing posts before generating new ones. Quality of existing content should take priority over volume of new content.

### Default Mode Steps

### Step 1: Research via Agents

For **長篇/短篇**, launch **six** research agents in parallel using the Task tool (subagent_type: `general-purpose`). For **快報**, launch only **three** agents: Macro Data Agent, Market Context Agent, and a third agent selected by the following hardcoded mapping based on the topic's primary_topic tag:

| primary_topic 屬於 | 第三個 agent |
|---|---|
| `fed`, `bonds`, `gdp`, `cpi`, `pce`, `employment`, `fiscal` | Gov Reports Agent |
| `geopolitics`, `tariff`, `china`, `taiwan`, `japan`, `middleeast`, `europe`, `sanctions` | Geopolitics Agent |
| `ai`, `technology`, `semiconductor`, `cloud`, `energy` | AI/Tech Agent |
| 其他 / 不確定 | Sector Rotation Agent |

| Agent | Task | What to return |
|-------|------|----------------|
| **Macro Data Agent** | Search for latest CPI, Fed rate, unemployment, 10Y yield, Core PCE, GDP | Actual numbers with dates, source URLs, beat/miss expectations |
| **Gov Reports Agent** | Search for latest CBO, BEA, BLS, Treasury, Fed reports and speeches | Key data tables, projections, quotes, report URLs |
| **Market Context Agent** | Search for today's S&P 500, gold, oil, bitcoin, VIX, bond yields + biggest market-moving news this week | Current prices, daily/weekly changes, source URLs |
| **Geopolitics Agent** | Search for international political developments affecting global markets: US-China trade/tech war, Middle East tensions (Iran, Israel), EU/UK economic policy, Japan/BOJ policy, China PBoC stimulus, Taiwan Strait, Russia-Ukraine, OPEC+ decisions, US domestic policy (tariffs, fiscal, Supreme Court, DOGE). Cover at least 3 different regions. | What happened, which countries involved, economic transmission channels, quantified impact, source URLs |
| **AI/Tech Agent** | Search for latest AI and technology news with economic impact: big tech earnings/capex, AI adoption data, semiconductor supply, energy demand from data centers, tech layoffs or hiring, major product launches | Key numbers (capex $, revenue growth, job impact), affected sectors, source URLs |
| **Sector Rotation Agent** | Search for this week's sector ETF performance (XLK, XLF, XLE, XLV, etc.), earnings surprises, and analyst upgrades/downgrades | Sector returns, notable earnings, analyst calls with source URLs |

Each agent should run 3-5 web searches and return a concise bullet-point summary.

**Source quality hierarchy (applies to ALL research agents):**
1. **Primary sources first** — official reports (.gov), earnings transcripts, court filings, treaty text, central bank statements, regulatory filings (SEC EDGAR, BOJ minutes). These are the foundation.
2. **Expert analysis second** — research notes from named analysts (Goldman, JPMorgan, SemiAnalysis, Brookings, CSIS), academic papers, specialized industry data providers (Trepp, FactSet, TrendForce).
3. **News wire last** — Reuters, Bloomberg, CNBC are useful for context and quotes, but a post built entirely on wire service summaries will lack depth. Wire services summarize; this blog must analyze.

Each agent must return **at least 2 primary sources** in its results. If an agent cannot find primary sources, it must flag this — the topic may not be ready for a post.

**Agent output format (mandatory):**
Each agent must structure its output with two clearly labeled sections:
1. **Primary source findings** (minimum 2 per agent) — For each primary source, include: source name + URL, and one sentence starting with "**Insight beyond wire coverage:**" describing the specific finding not available in Reuters/Bloomberg summaries. Example: "CBO Budget Outlook Table 1-3 ([URL]) — **Insight beyond wire coverage:** CBO assumes 10Y yield declines to 3.6% by 2027; if rates stay at current 4.1%, net interest projections are understated by ~$200B/year."
2. **Supporting context** — Wire-level data points and quotes for background.

**Temporal status tagging (mandatory):**
Every data point returned by a research agent must be tagged with one of:
- **[ACTUAL]** — already published/released (e.g., "CPI January 2026: 2.4% [ACTUAL, BLS 2/12]")
- **[ESTIMATE]** — consensus forecast or analyst expectation for an unreleased event (e.g., "NVIDIA Q4 EPS: $1.53 [ESTIMATE, consensus, reports 2/25]")
- **[PROJECTED]** — forward-looking model output (e.g., "CBO 2027 debt/GDP: 120% [PROJECTED, CBO Jan 2026 report]")

This tagging prevents the writing agent from treating unreleased estimates as confirmed facts. The writing agent must use future tense and attribution language (「市場共識預期」「分析師預估」) for any data tagged [ESTIMATE] or [PROJECTED].

If an agent's output contains zero substantive entries under "Primary source findings," the topic's research depth is insufficient — either send the agent back for deeper searches or flag the topic for potential skipping.

### Step 1.5: Classify the News Day & Read Previous Posts

Before picking topics, do two things:

**1. Read previous posts.** Read the titles, descriptions, tags, and first paragraphs of the most recent 7 days of posts in `_posts/`. Build a list of topics and primary_topic tags already covered. For example:

```
Previous posts (last 7 days):
- 2026-02-20: GDP 放緩是需求崩塌還是財政干擾？ [macro, gdp, fiscal]
- 2026-02-19: 非科技板塊的漲勢是輪動還是溢出？ [macro, rotation, ai]
- 2026-02-18: 台海半導體風險的真實傳導路徑 [macro, geopolitics, semiconductor, taiwan]
```

**2. Classify the news day:**

- **Breaking news day**: A major event happened TODAY or YESTERDAY that wasn't covered in previous posts (e.g., surprise rate decision, military action, earnings shock, SCOTUS ruling, unexpected data release). In this case, cover the breaking news — overlap with adjacent topics is acceptable because it's genuinely new.
- **Quiet day**: No major new events since the last post batch. The same stories from yesterday are still dominating headlines with no material updates. In this case, switch to **discovery mode** — actively seek under-the-radar topics that provide reader value beyond rehashing yesterday's takes.

### Step 2: Pick Today's Topic

From all agent results, pick the best topics for today's posts. The format tier (長篇/短篇/快報) was determined in Step 0.5 — choose topics whose complexity matches the format. Each topic must have a distinct primary_topic tag and a distinct core question. The selection strategy depends on the day type from Step 1.5.

**選題需匹配今日篇幅：**
- **長篇**（週一 / 重大數據日）：允許更宏觀、更整合的題材，但仍只有一個核心問題
- **短篇**：題材要能在 600-800 字內自洽
- **快報**：題材必須是「延續追蹤 / 低新聞日的框架校準」，避免硬湊新故事

#### Anti-Red-Ocean Rule (Headline Differentiation)

Before finalizing any topic, assess whether the topic is **saturated** — i.e., dozens of news outlets are already running near-identical headlines. Signs of saturation:
- Multiple major outlets (Reuters, Bloomberg, CNBC, 聯合報, 自由時報) all published articles with overlapping titles in the past 48 hours
- The story has a single dominant narrative frame that everyone is repeating (e.g., "歷史性突破", "里程碑", "重大進展")

**When a topic is saturated, you MUST go deeper and differentiate on angle AND title.** This is NOT about being contrarian or singing a different tune — it's about providing analysis that mainstream coverage doesn't have time or depth to deliver.

1. **Launch a dedicated deep-research agent** (subagent_type: `general-purpose`) to investigate the saturated topic more thoroughly. The agent should:
   - Search for **primary sources** (official text of the agreement/ruling/report, not just news summaries)
   - Find **fine print and hidden clauses** that most coverage ignores (sunset provisions, enforcement mechanisms, poison pills, carve-outs)
   - Quantify **the math behind the headlines** — does the deal actually add up? What do the numbers look like in context?
   - Identify **implementation gaps** — what has to happen for the headline promise to become reality (legislative hurdles, infrastructure bottlenecks, timeline risks, who has to approve what)
   - Research **second-order effects** — who loses, what breaks, what downstream consequences does the headline gloss over
   - Look for **expert/analyst commentary** that goes beyond the wire service narrative

2. **Title must NOT overlap with mainstream headlines:**
   - Never use the same framing as wire services (avoid: "歷史性突破", "里程碑協定", "重大進展")
   - Lead with the deeper insight, not the event itself. Compare:
     - Bad (red ocean): "歷史性突破：美台簽署對等貿易協定"
     - Good (blue ocean): "台美協定的隱藏條款：840 億數字背後的地緣鎖定與農業代價"
     - Good: "840 億買到什麼？拆解台美貿易協定五個沒人提的條件"
   - Test: if your title could be a Reuters headline, it's too generic. Your title should read like an analyst deep-dive, not a news wire
   - Also avoid fear-driven or certainty-driven wording in titles (e.g., "末日", "崩盤", "必然") unless it's a direct quote from a cited source

3. **If no deeper angle can be found even after dedicated research, skip the topic** — it's better to write nothing than to add to the noise. Pick the next-best topic instead.

#### For breaking news days:

Cover the breaking event. If multiple unrelated breaking events occurred, each can be a separate post.

#### For quiet days (discovery mode):

Apply a priority hierarchy to find topics that provide genuine new value to readers:

1. **New data releases** not yet covered (e.g., a BLS/BEA/Fed report dropped today that wasn't in previous posts)
2. **Emerging risks** the market is underpricing — things NOT in current headlines (e.g., commercial real estate stress, consumer credit delinquencies rising, a country's bond auction failing, corporate debt refinancing wall)
3. **Structural/social trends** with economic consequences (e.g., aging demographics impact on labor, student debt burden on consumption, housing affordability crisis, healthcare cost spiral, insurance market stress)
4. **Contrarian re-evaluation** of a consensus view (e.g., "everyone says stagflation, but here's why the data doesn't support it yet" — only if the contrarian case has real data behind it)
5. **Cross-market connections** others aren't making (e.g., how Japan's rate hike is affecting EM carry trades, how DOGE spending cuts flow through to specific state economies)

#### Deduplication rule (replaces style quotas)

Compare each candidate topic's primary_topic tag against the previous-posts list from Step 1.5:
- **Consecutive topic repeat**: If the candidate's primary_topic matches the primary_topic of the two most recent consecutive posts → switch to a different topic or produce only 1 post
- **Same data, same angle = skip.** (e.g., a post from the last 7 days already covered GDP 1.4% + Core PCE stagflation → don't write another stagflation post using the same numbers)
- **Same event, deeper zoom = OK only if the thesis is fundamentally different.** When building on a previous post, reference it: "上期分析了 AI capex 的 SaaS 衝擊面，本期從現金流角度切入"
- **Same sector, different story = OK.** (e.g., last post wrote AI capex + SaaS disruption → can write AI labor displacement data, since the thesis and data are entirely different)

**Aggressively skip weak topics.** Default output is 1 post at the day's format tier. Apply these skip triggers:
- **No quality topic:** If there's no meaningful news with economic impact today, produce a 快報 on a continuing theme or skip entirely. A day without a post is better than a filler post.
- **Conclusion convergence:** If considering multiple angles and they'd arrive at the same takeaway, keep only the stronger one.
- **Quality over quantity:** Only produce posts that pass the research depth gate. Never force a weak topic to fill a quota.
- Never force a weak topic — consistency over volume.

### Step 2.5: Core Question Definition (MANDATORY)

For each selected topic, define **one core question** that the post will answer. The question must:
- End with `？`
- Be specific enough that readers can evaluate whether the post answered it
- Frame the intellectual tension (not just "what happened?" but "what does it mean?")

Examples:
- 「非科技板塊的漲勢是真的輪動，還是 AI 的溢出效應？」
- 「GDP 1.4% 代表需求崩塌還是財政干擾？」
- 「日銀升息對亞洲套利交易的衝擊被低估了嗎？」

Every subsequent paragraph in the post must serve this question. If a paragraph doesn't contribute to answering the core question, delete it or save it for a separate post.

### Step 3: Deep Investigation & Post Generation (Parallel Agents)

Launch **one agent per chosen topic** using the Task tool (subagent_type: `general-purpose`). Multiple topic agents can run in parallel. Each agent independently **researches deeply** then **writes the post**.

The agent receives:
- The **broad research context** from Step 1 (relevant bullet points for its topic)
- The **core question** from Step 2.5
- The **format tier** determined in Step 0.5 (長篇/短篇/快報)
- The **unified skeleton** (開場 → 因果拆解 → 分水嶺 → 結語) from this skill
- The **Content Rules** and **Chart Guidelines** sections below
- The **target filename** and front matter template

**Research depth by format tier:**

| 篇幅 | Research agents | Web searches | Depth gate |
|------|----------------|--------------|------------|
| 長篇 | 6 research + 1 deep | 5-8 深度搜尋 | 3/5 必須通過 |
| 短篇 | 6 research + 1 deep | 5-8 深度搜尋 | 3/5 必須通過 |
| 快報 | 3 research（Macro Data + Market Context + 最相關的 1 個）| 3-5 搜尋 | 2/5 必須通過 |

The agent must:
1. **Deep research** — run web searches focused specifically on its topic (5-8 for 長篇/短篇, 3-5 for 快報). The goal is NOT more data points — it's **deeper data points** that wire services don't cover. Specifically:

   **Mandatory research layers (every post must hit at least 3 of 5):**
   - **Primary source** — find and read the actual document, not a summary of it (the Fed statement itself, the CBO table, the treaty text, the earnings transcript quote, the court ruling). Cite page/section numbers when possible.
   - **Fine print & hidden mechanics** — what do most articles skip? Sunset clauses, enforcement mechanisms, methodology changes, carve-outs, phase-in schedules, conditionality. This is where the real story often lives.
   - **The math behind the headline** — does the number actually add up? Put it in context: as % of GDP, per capita, vs historical average, vs peer countries, vs market expectations. A "$840B trade deal" means nothing without knowing current trade volume, tariff baselines, and implementation timeline.
   - **Second-order effects** — who loses? What breaks downstream? What unintended consequences does the headline gloss over? Every policy creates winners and losers; most coverage only covers the winners.
   - **Credible opposing view** — find a **named** expert or institution (full name + affiliation) with a **specific reasoning chain backed by data**. Example: "BCA Research 首席策略師 Peter Berezin argues stagflation risk is overblown because services PCE is driven by lagging shelter costs, which leading indicators (Zillow Observed Rent Index down 1.2% YoY) show will decelerate by Q2." Generic hedges ("部分分析師持保守看法") and unnamed sources ("some analysts disagree") do NOT count. Either find a real contrarian with real reasoning, or explicitly state that consensus is unusually unified and explain why that itself is a signal worth noting.

   **Deep research examples by topic type:**
   - Macro/data topics: actual government report tables (not news summaries), revisions to prior data, methodology notes, cross-asset correlations, historical parallels with specific date/magnitude comparisons, institutional positioning data (CFTC, fund flows)
   - Geopolitics topics: diplomatic statements (actual quotes, not paraphrased), trade flow data from UN Comtrade / WTO / bilateral statistics, legal text of agreements, historical precedents with outcome comparisons
   - AI/Tech topics: earnings call transcript quotes (exact words, not summaries), capex breakdowns by category, adoption survey methodology, energy consumption data from EIA / IEA

2. **Synthesize a thesis** — form a clear, falsifiable, and balanced take anchored to the core question. The thesis must pass the **"Bloomberg terminal test"**: would someone with a Bloomberg terminal and 10 years of market experience learn something new from this post? If the answer is no, the research isn't deep enough — go back and search for another layer.

   **Research depth gate (mandatory checkpoint before writing):**
   Before beginning to write, the agent must output a brief checklist:
   ```
   ✓/✗ Primary source: [document name + specific finding]
   ✓/✗ Fine print: [hidden mechanic or overlooked detail]
   ✓/✗ Math in context: [key calculation that reframes the headline]
   ✓/✗ Second-order effect: [who loses / what breaks downstream]
   ✓/✗ Named contrarian: [Name at Institution — their specific argument]
   ```
   **Gate rule:** For 長篇/短篇, if fewer than 3 of 5 are marked ✓ with substantive content, the agent must run additional targeted searches before writing. For 快報, the gate is 2 of 5 (at least primary source + one other layer). Writing on thin research is the single most common quality failure — deeper research upfront prevents rewrites later.

3. **Write the full post** in Traditional Chinese, following the unified skeleton exactly
4. **Write the file** to `/Users/isaac.l/projects/shooeugenesea.github.io/_posts/` with filename `YYYY-MM-DD-{slug}-zh.md`

**File naming:** `YYYY-MM-DD-{slug}-zh.md`

**Front matter:**
```yaml
---
layout: post
title: "{Chinese title}"
date: YYYY-MM-DD HH:MM:SS +0800
categories: [macro]
tags: [macro, <primary_topic>, ...]
macro_kind: long | short | brief
description: "{1-2 sentence Chinese summary with key numbers — this controls the Google search snippet}"
lang: zh-TW
---
```

`macro_kind` values: `long`（長篇）, `short`（短篇）, `brief`（快報）, `correction`（修正文）, `crisis`（危機文）。只要求新文加入，不回填舊文。

### Content Rules

0. **Open strong, then earn complexity** — The opening must be scannable for a first-time reader:
   - Section 1 must include the 3-bullet `你會得到什麼` TL;DR (see Post Structure §1).
   - No long glossary asides in section 1; put jargon `<aside>` boxes in section 2 near first use.
   - Paragraph discipline: keep paragraphs short (2–4 sentences). If a paragraph mixes >1 claim, split it.

1. **Use 0050 instead of EWT** — When discussing Taiwan equity ETFs, always use **元大台灣50 (0050)** instead of EWT (iShares MSCI Taiwan ETF). The blog's audience is Taiwanese investors who trade on TWSE; 0050 is the most liquid and well-known Taiwan large-cap ETF they can buy directly. Prices are in NT$, not USD.
2. **Taiwan stance** — This blog treats Taiwan as an independent, sovereign country. When covering Taiwan-related topics (trade, geopolitics, semiconductor, cross-strait), never adopt framing that implies Taiwan is part of China or that China has legitimate authority over Taiwan. Use "台灣" and "中國" as parallel entities, not "中國大陸" vs "台灣地區". Avoid Beijing's preferred language (e.g., "統一", "台灣問題", "分裂勢力"). This does not mean ignoring China's perspective — analyzing what Beijing might do (military, economic coercion, diplomatic pressure) is essential for investment analysis — but the analytical frame must be from Taiwan's standpoint as an independent actor making sovereign decisions.
3. **Consider the global picture** — every post should account for international context, not just US data in isolation. How do ECB/BOJ/PBoC policies, geopolitical tensions, global supply chains, and cross-border capital flows affect the thesis? A US CPI post should mention tariff impacts; a tech post should mention TSMC/Taiwan risk.
4. **Conditional reasoning, not probability scenarios** — Use conditional reasoning (if X then Y) instead of probability-weighted scenarios. Do NOT assign percentages to outcomes or create "base/upside/downside" buckets with probabilities summing to 100%. Instead, describe observable conditions and their structural implications in the 分水嶺 section.
5. **Do not force directional calls** — if confidence is low or evidence is mixed, explicitly state neutral/uncertain stance and focus on monitoring signals instead of hard bullish/bearish calls.
6. **Tone neutrality requirement** — avoid emotionally loaded or absolutist wording (e.g., "末日", "崩塌", "四面楚歌", "必然", "完全沒有", "歷史性的錯誤定價"), unless it is a direct quote with source attribution.
7. **Separate facts vs inference** — clearly distinguish verifiable facts from interpretation through sentence structure and context, NOT through bold labels like "**事實：**" or "**推論：**". The intellectual discipline matters; the formatting template does not. Good examples: "CBO 預測債務比率將升至 120%——這意味著期限溢價中樞很難回到超低區間" (fact flows naturally into inference). Bad examples: "**事實：** CBO 預測… **推論：** 期限溢價…" (mechanical label soup that reads like a form, not an analyst note).
8. **結語 must deliver a framework, not advice** — the 結語 section must contain: a core judgment blockquote (see Rule 20), an invalidation conditions table (see Rule 21), and 2-3 variables to watch next. These must be written as natural analyst prose (except the mandatory blockquote and table formats). Do NOT use bold labels like "**一句話結論：**", "**資產配置框架：**", "**再平衡觸發條件：**".
9. **Argue with logic chains, not adjectives** — each paragraph: claim → evidence → implication.
10. **ETF as exposure-mechanism example only** — ETF tickers are allowed in 分水嶺 and 結語 sections solely to illustrate which variables a common exposure (e.g., TLT, TIPS, SPY) is sensitive to. Use the framing: "這個框架對常見曝險的意義：[ticker] 暴露於 [variable]，而 [ticker] 暴露於 [variable]." Do NOT use directive language ("建議/加碼/減碼/買進/賣出/佈局/進場"). There must be NO standalone ETF analysis section (no `## 配置影響`, no `## ETF 影響分析`).
11. **No AI-generation mentions** — do not reference that the post was auto-generated or written by AI.
12. **Cite everything** — every factual claim needs a source URL as an inline markdown link.
13. **Use real numbers** — never write "inflation is rising" when you can write "CPI rose to 2.4% YoY".
14. **Traditional Chinese only** — parenthetically gloss English abbreviations on first use, e.g.「消費者物價指數 (CPI)」
15. **Date every event & distinguish actual vs. expected** — when referencing a policy decision, data release, ruling, or any event that didn't happen on the post's publication date, include the specific date (e.g., "聯準會 1 月 28 日以 10:2 投票維持利率不變" not "聯準會以 10:2 投票維持利率不變"). Readers should never have to guess *when* something happened. **Critical: clearly distinguish between data that has already been published and data that is a forward-looking estimate or consensus forecast.** Use past tense + definitive language for published data (e.g., "CPI 1 月升至 2.4%"). Use future tense + attribution for unreleased data (e.g., "NVIDIA 將於 2 月 25 日公佈財報，市場共識預期 EPS $1.53"). Never write unreleased estimates as if they are confirmed results — this is a credibility-destroying error.
16. **No abstract references** — never refer to scenarios, sections, or items by number/letter alone (e.g., "情境 3", "第二點"). Readers don't memorize numbering. Always use descriptive names inline.
17. **Jargon glossary** — when a post uses domain-specific terms that a general reader would not immediately understand (e.g., CMBS, NOI, carry trade, REIT, credit spread), add a small inline aside box near where the term **first appears**. Float it to the right of the paragraph so it sits alongside the relevant text. Each term is explained only once per post. Group terms that first appear in the same section into one box.
   ```html
   <aside style="float: right; width: 220px; margin: 0 0 1em 1.5em; padding: 0.75em 1em; background: rgba(100,116,139,0.15); border-left: 3px solid rgba(100,116,139,0.4); font-size: 0.82em; line-height: 1.6; border-radius: 4px;">
   <strong>TERM</strong>：一句話白話解釋。
   </aside>
   ```
   Rules:
   - Place the `<aside>` immediately before the paragraph where the term is first used in detail
   - Keep each definition to one sentence
   - Common terms like ETF, Fed, GDP, CPI do NOT need entries — only terms a casual reader would not know
   - Descriptive Chinese phrases (e.g., 到期牆、品質遷移) that are already self-explanatory in context do NOT need entries — only true jargon and acronyms
18. **Cross-post consistency** — when referencing an event, ruling, data point, or policy already covered in a recent post (past 7 days), read that post first and match its terminology and characterization exactly. Do not paraphrase legal or technical distinctions (e.g., a court ruling described as「違法」in one post must not become「違憲」in another — these are different legal concepts). If the new post needs a different framing, explicitly explain why.
19. **Disclaimer** — always include at the bottom:
   ```
   *資料來源：[列出來源連結]*
   *市場數據截至：YYYY-MM-DD*
   *本文僅供參考，不構成投資建議。*
   ```
20. **Core judgment blockquote (mandatory)** — every post must have exactly one blockquote in this format, placed as the first element of the 結語 section:
   ```
   > **核心判斷：** [one shareable framework sentence]
   ```
   Rules:
   - Must be independently understandable without reading the rest of the post
   - **Forbidden directive words:** 應該、建議、可以加碼、逢低買、減碼、進場、佈局、買進、賣出
   - **Forbidden predictive conclusions:** 接下來會…、市場將…
   - **Allowed structural language:** 強勢 ≠ 全面復甦、這是估值壓縮不是盈利崩壞
   - **Allowed conditional language:** 如果 X 未破壞，則 Y 仍成立
   - This is the ONLY allowed `> **核心判斷：**` format in any post — Step 3.65 grep should not flag it
21. **Invalidation conditions table (mandatory)** — every post's 結語 must include a standardized Markdown table:
   ```
   | Metric | Threshold | Window | Implication |
   |--------|-----------|--------|-------------|
   | [metric] | [threshold + continuity] | [period + next data date] | [framework reassessment] |
   ```
   2-4 rows. Threshold must be verifiable (include continuity duration). Window must include next data point date where possible. Implication must be framework-level, not a trading instruction.
22. **No directive language anywhere** — the following words must NEVER appear in any post except when explicitly quoting a named source: 應該、建議、加碼、減碼、買進、賣出、佈局、進場、逢低買. When describing exposure mechanisms, use structural language instead (e.g., "[ticker] 暴露於 [variable]" not "可以考慮加碼 [ticker]").
23. **Bold & highlight discipline** — Bold is a scarce resource; overuse trains readers to skim past it. Rules:
   - **Allowed bold uses:**
     - Key numbers that anchor the argument or beat/miss expectations (e.g., "Core PCE 升至 **2.8%**，高於市場預期的 2.6%")
     - Turning-point concepts that define the post's analytical frame (e.g., "關鍵在於這是 **結構性** 而非 **週期性** 的放緩")
     - The `> **核心判斷：**` blockquote (Rule 20)
     - Named sources or institutions when introducing a contrarian view for the first time (e.g., "**BCA Research 的 Peter Berezin** 認為…")
   - **Forbidden bold uses:**
     - Template-style labels inside prose ("**事實：**", "**推論：**", "**結論：**" — already covered by Rule 7)
     - Entire sentences — if a full sentence matters, let the argument carry it, not the formatting
     - Emotional emphasis ("**絕對不可能**", "**史無前例**") — this is adjectival inflation, not information
   - **Density cap:** No more than **3-4 bold instances per section** (開場/因果拆解/分水嶺/結語 each count as one section). If everything is highlighted, nothing is. When in doubt, remove the bold — the sentence structure and evidence should do the work.
   - **No other inline highlight mechanisms** — no `<mark>`, no colored text, no ALL CAPS for emphasis. The blog's visual hierarchy comes from the 4-section skeleton, the `>` blockquote, `<aside>` glossary boxes, and Markdown tables — not inline formatting tricks.

### Chart Guidelines

長篇 and 短篇 must include one Chart.js chart. 快報 charts are optional — include one only if the data story clearly benefits from visualization. **若快報省略 Chart.js，必須在「因果拆解」段提供以下任一作為可視化替代：**
- 4-8 行 Markdown 表格（含數字與來源），或
- 3-5 個關鍵數字 bullet（每點附來源）

若快報仍使用 Chart.js，則完全遵守下方 Chart rules。Each post's `<canvas>` must use a **unique id** (e.g., `macroChart1`, `macroChart2`).

**Chart data source rule:** If the post's topic centers on government data, chart data must come from official government sources (.gov). For other topics, market data, industry data, or gov data are all acceptable. Must always cite sources.

| Source | Data | URL |
|---|---|---|
| BLS | CPI, unemployment, nonfarm payrolls | bls.gov |
| BEA | PCE, GDP | bea.gov |
| Federal Reserve | Fed funds rate, FOMC projections | federalreserve.gov |
| US Treasury | Yield curve, treasury rates | home.treasury.gov |
| CBO | Deficit/debt projections, economic outlook | cbo.gov |

**Chart type selection:**

| Data story | Chart type |
|---|---|
| Inflation trend or CPI vs PCE divergence | Bar or line chart |
| Rate/yield environment | Line chart with reference lines |
| Fiscal deficit/debt trajectory | Bar chart |
| Employment trend | Line or bar chart |
| Asset/sector comparison | Horizontal bar chart |
| Capex/revenue trends | Line or grouped bar chart |
| Policy impact (before/after or with/without) | Grouped bar chart |

**Implementation:**

```html
<div style="max-width: 600px; margin: 2em auto;">
  <canvas id="macroChartN"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
new Chart(document.getElementById('macroChartN'), {
  // Chart config with REAL NUMBERS from cited sources
});
</script>
```

**Chart rules:**
- `max-width: 600px`, `margin: 2em auto`
- Title must include data source attribution
- Highlight the key data point that supports the thesis
- All numbers traceable to a specific source — never fabricate

### Step 3.5: Fact-Check Key Claims (MANDATORY — NEVER SKIP)

**This step is non-negotiable.** Every post must pass fact-check before it can be considered complete. Do not skip this step due to time pressure, context limits, or any other reason. A post that has not been fact-checked is not a finished post.

**Fact-check scale by format tier:**
- **長篇/短篇**: Launch **four** fact-check agents in parallel (as below)
- **快報**: Launch **one** all-domain fact-check agent covering market data, gov data, geopolitics, and tech/industry in a single pass

For 長篇/短篇, launch **four** fact-check agents in parallel (subagent_type: `general-purpose`) to verify the most important data points:

| Agent | What to verify |
|-------|----------------|
| **Market Data Checker** | Verify all ETF prices, gold, oil, bitcoin, VIX against current market data. Flag any number that's off by more than 1%. |
| **Gov Data Checker** | Verify all government statistics (GDP, CPI, PCE, unemployment, CBO projections) against official sources (.gov domains). Flag outdated figures (e.g., using last month's data when a new release exists). |
| **Geopolitics Checker** | Verify all geopolitical claims: who did what, who issued ultimatums, correct dates, correct characterizations. Flag any reversed attribution or overstated claims. |
| **Tech/Industry Checker** | Verify all tech/industry claims: capex numbers, market cap changes (single day vs multi-day), adoption stats. Flag timeframe errors. |

Each agent should return a table: `Claim | Blog Value | Actual Value | Source | Verdict (correct/wrong/outdated)`.

**Temporal accuracy check (CRITICAL):**
Each fact-check agent must verify the **temporal status** of every data point:
- Is the event/data already published as of the post's publication date? If yes, past tense is correct.
- Is it a forward-looking estimate or consensus forecast for an unreleased event? If yes, the post MUST use future tense and attribution (「市場共識預期」「分析師預估」). Flag any instance where an unreleased estimate is written as a confirmed fact.
- Common trap: earnings reports (e.g., "NVIDIA reported EPS $1.53" when the report date is tomorrow). Always cross-check the event date against the post's publication date.

**Chart Data Verification (CRITICAL):** Each fact-check agent must also verify the Chart.js data in its domain:
- Extract every number from the chart's `data` array and `labels`
- Cross-reference each number against the cited source
- Check that the chart type matches the data story (e.g., don't use a line chart for categorical comparisons)
- Verify axis labels, units, and scale are correct
- Flag any chart where data is fabricated, rounded beyond reason (>5% deviation), or uses a misleading scale

**After fact-check — Rejection Protocol:**
- **Minor errors** (1-2 wrong numbers, fixable): Fix the specific numbers in the post and chart. Document what was changed.
- **Major errors** (3+ wrong data points, chart data largely fabricated, wrong thesis based on incorrect data): **REJECT the post entirely.** Delete the file and re-launch the Step 3 agent for that post with corrected research data. The regenerated post must pass fact-check again.
- **Unverifiable claims**: Either remove the claim or clearly attribute it (e.g., "according to analyst estimates"). If >30% of a post's key claims are unverifiable, REJECT and regenerate.
- A post that fails fact-check twice should be skipped entirely — report to the user that the topic lacked reliable data.

### Step 3.4: Cross-Post Deduplication

When producing multiple posts on the same day, verify:
- No two posts share the same primary_topic tag
- No two posts arrive at the same core judgment (conclusion convergence)
- If two posts reference the same data point, they must use it to support different theses
- Cross-reference 分水嶺 sections: one post's invalidation condition should not contradict another post's core judgment

### Step 3.6: Bias & Tone QA (MANDATORY)

Before finalizing each post, run a short editorial QA pass:

1. **Stance balance check** — confirm at least one credible opposing view is presented and not straw-manned.
2. **Language check** — remove fear-inducing or certainty-inducing wording unless directly quoted from sources.
3. **Directive language check** — scan for forbidden directive words (Rule 22). Any instance must be rewritten to structural/exposure language.
4. **ETF placement check** — verify ETF tickers only appear in 分水嶺 and 結語, and only as exposure-mechanism examples (Rule 10). No standalone ETF section should exist.
5. **Reader impact check** — ensure the post does not push reactive overtrading; the framework should help readers think, not tell them what to do.
6. **Bold density check** — count bold instances per section (開場/因果拆解/分水嶺/結語). If any section exceeds 3-4 bold spans, remove the weakest ones. Verify no entire sentences are bolded and no emotional-emphasis bold exists (Rule 23).
7. **Logical coherence check (CRITICAL)** — for every data point, ETF, or index cited as evidence for an argument, verify the evidence actually supports the stated conclusion:
   - **Composition check**: Before using any ETF/index as evidence, identify its top holdings and sector weights. An ETF's performance must be attributed to its actual drivers, not assumed from its label. Example: 0050 is ~50% TSMC — its gains are AI-driven and cannot be cited as evidence of "non-AI rotation." EEM has heavy Taiwan/Korea weighting — its performance may reflect AI supply chain strength, not broad EM recovery.
   - **Causal chain tracing**: Do NOT stop at sector labels or top holdings. Trace the actual demand driver behind each piece of evidence back to its root cause. Many assets that appear "non-AI" on the surface are indirectly driven by AI-related demand channels. Examples: Korean memory stocks rising → because HBM demand → because AI training; copper prices surging → partially because data center construction → because AI infrastructure buildout; XLU (utilities) outperforming → partially because power demand → because AI data centers; IYT (transport) rising → partially because logistics for hardware shipments → because AI supply chain. When an asset has mixed drivers (both AI-adjacent and genuinely independent forces like fiscal spending or monetary policy), explicitly acknowledge both rather than attributing performance to only one. The key question is always: "What is the actual demand driver, and does it support or undermine my argument?"
   - **Internal consistency**: The same asset must not be described with contradictory attributions in different sections of the same post.
   - **Argument direction**: Each piece of evidence must logically point in the direction the argument claims. If evidence actually supports the opposite thesis, it must be removed or reframed with explicit acknowledgment.
   - **Thesis re-evaluation**: If removing flawed evidence weakens the thesis significantly, do not just patch the evidence — re-evaluate whether the core thesis needs reframing. A thesis built on misattributed evidence may itself be wrong or need a different angle. It is better to rewrite a thesis than to prop up a weak one with fewer data points.

### Step 3.65: Automated Pattern Scan (MANDATORY)

Before launching quality review agents, run a **deterministic grep scan** across ALL generated post files to catch known anti-patterns. This is a programmatic check, not an LLM judgment call — it catches issues that subjective review will miss.

**Run Grep for each pattern across all generated post files:**

| Pattern to grep | Action if found |
|-----------------|-----------------|
| `**事實：**` | Remove — rewrite as natural prose transition |
| `**推論：**` | Remove — rewrite as natural prose transition |
| `**一句話結論：**` | Remove — merge into 結語 prose |
| `**資產配置框架` | Remove — merge into 結語 prose |
| `**再平衡觸發條件` | Remove — merge into 結語 prose |
| `## 配置影響` | Remove — no standalone ETF/allocation sections allowed |
| `## ETF 影響分析` | Remove — no standalone ETF/allocation sections allowed |
| `## 三種情境` | Remove — replace with conditional 分水嶺 |
| `## 總經快照` | Rewrite — use 開場 skeleton instead |
| `## 筆記` | Rewrite — use 結語 skeleton instead |
| `### 股票類` or `### 債券類` or `### 替代資產` | Remove — these subheaders create mechanical template feel |
| `建議` or `應該` or `加碼` or `減碼` or `買進` or `賣出` or `佈局` or `進場` or `逢低買` | Remove or rewrite — forbidden directive words (unless inside a `>` blockquote citing a named source) |

**Also verify required structural elements:**
- Each post MUST contain `> **核心判斷：**` — this is the one allowed bold blockquote format. If missing, add it.
- Each post MUST contain an invalidation conditions table (`| Metric | Threshold | Window | Implication |`). If missing, add it.
- Each post MUST have a 分水嶺 section using conditional reasoning (`如果`...`→`). If it uses probability percentages instead, rewrite.

**Why this step exists:** LLM-based quality review agents can overlook mechanical patterns because they focus on content quality, not surface-level formatting. A simple grep catches 100% of known anti-patterns that agents miss. Fix all flagged issues before proceeding to Step 3.7.

### Step 3.7: Multi-Angle Quality Review (MANDATORY for 長篇/短篇)

**Quality review scale by format tier:**
- **長篇**: Launch **2** agents in parallel (as below)
- **短篇**: Launch **1** agent covering both perspectives
- **快報**: Skip this step — 快報 is already compressed, and pattern scan (Step 3.65) + bias & tone QA (Step 3.6) provide sufficient quality assurance

For 長篇, launch **2** agents in parallel (subagent_type: `general-purpose`) to evaluate the post from different perspectives. For 短篇, launch **1** agent covering both perspectives. This multi-angle approach catches blind spots that a single-perspective review misses.

**Agent 1: Reader & Investor Perspective.** The agent reads all post files as a whole and answers:

1. **Value test** — "If I'm a busy investor who reads this blog weekly, what do I take away from today's batch? Can I articulate the core framework in one sentence after reading?" If the answer is unclear, the 核心判斷 needs strengthening.
2. **Noise test** — "Is any post telling me something I could get from reading Reuters or Bloomberg headlines?" If yes, that post needs a deeper angle or should be cut.
3. **Durability test** — "Will this post still be worth reading in 3 months?" Posts that are purely event-reactive with no structural insight should be flagged for cutting or reframing.
4. **Repetition test** — "Am I reading the same framework wrapped in different data?" Even if the specific data is different, if the 核心判斷 sentences are thematically identical across posts, flag it.
5. **Framework test** — "Does the post help me THINK about future situations, or does it only tell me about THIS situation?" The best posts teach a transferable analytical frame.
6. **Research depth test** — For each post, answer three specific questions:
   - (a) **"What specific finding came from reading a primary source that wire services didn't report?"** The answer must cite a specific document, table, clause, or transcript quote. If the answer is vague ("used CBO data") or absent, the post fails.
   - (b) **"Is the contrarian view named, specific, and falsifiable?"** The contrarian must have a name, an institution, and a data-backed argument. "Some analysts are cautious" or "risks exist on both sides" fails this test.
   - (c) **"What second-order effect is quantified?"** At least one downstream consequence must have a number attached. Vague "ripple effects" without quantification fail.
   A post that fails 2+ of these 3 tests should be flagged for rewrite or cutting — it's adding noise, not signal.

**Agent 2: Writing Quality & Voice Perspective.** The agent reads all post files and evaluates:

1. **Template detection** — Scan the ENTIRE post for any residual bold-label templates or mechanical formatting. Step 3.65 should have caught these programmatically, but this is the human-judgment backstop. Every section should read like a human analyst wrote it.
2. **Skeleton compliance** — Verify each post follows the 4-section skeleton (開場 → 因果拆解 → 分水嶺 → 結語). Flag any post with extra sections, missing sections, or sections in wrong order.
3. **Core question alignment** — Does every paragraph in the post serve the core question stated in the 開場? Flag paragraphs that drift.
4. **Voice consistency** — Does each post sound like it was written by the same thoughtful analyst? Flag inconsistencies.
5. **Insight density** — For each paragraph, ask: "Does this sentence tell the reader something they didn't already know or couldn't have guessed?" Flag generic statements.
6. **Invalidation table quality** — Are the invalidation conditions specific, verifiable, and framework-level? Flag any that are vague ("if things get worse") or that sound like trading instructions.

**Output from each agent:** A brief report (5-10 sentences) with:
- Overall assessment
- Specific posts to cut, merge, or rewrite (if any)
- Suggested edits to strengthen weak posts

**Action:** If either agent recommends cutting or merging posts, do so before proceeding. If they recommend rewrites, make the edits. If both agents pass the batch, proceed to Step 4.

### Step 4: Retrospective — Review Past Posts & Skill

Before finalizing, review the most recent past posts (previous 7 days) in `_posts/` for errors or outdated claims that were not caught at the time:

1. **Scan recent posts** — Read the last batch of macro posts. For each factual claim, check whether subsequent data releases or events have proven it wrong or outdated.
2. **Reflect corrections in new posts** — If a past post made a claim that turned out wrong, acknowledge or correct it in today's posts where relevant (e.g., "上期我們提到 Core PCE 為 2.8%，但最新數據已修正至 3.0%"). This builds credibility and continuity.
3. **Check invalidation conditions** — Review past posts' invalidation tables against current data. If any condition has been triggered, flag it for a future correction post (or produce one now if Step 0.5 didn't already catch it).
4. **Update the skill if needed** — If the errors reveal a systematic gap, update this SKILL.md to prevent recurrence. Report any skill changes to the user.

### Step 5: Verify Output & List Posts

1. Confirm all files exist with correct filenames
2. Verify each: front matter correct (tags start with `[macro, <primary_topic>]`, `macro_kind` present and matches format tier), chart with unique canvas id (or table/bullet fallback for 快報), sourced data, all claims cited, disclaimer present, 核心判斷 blockquote present, invalidation table present
3. **Print a summary table** listing every generated post:

```
| # | File | Topic | Core Question | Format Tier | Chart ID |
|---|------|-------|---------------|-------------|----------|
| 1 | `YYYY-MM-DD-slug-zh.md` | ... | ...？ | 長篇 / 短篇 / 快報 | macroChartN |
```

4. List any fact-check corrections applied and any past-post fixes
5. List any skill updates made

### Notification style rule (for cron/user delivery)

When reporting daily research results to end users, use plain language and actionable conclusions only.
- Allowed: topic recommendation, core question, key data signals, what to watch next.
- Avoid internal workflow jargon in user-facing summaries (e.g., `Step 0.5`, `crisis/correction gate`, `agent pipeline`, `workflow`).

### Topic Mode Steps

When **topic mode** is detected in Step 0, use the following steps instead of the default mode Steps 1-5.

#### Topic Step 1: Focused Research via Agents

Launch **four** parallel research agents (subagent_type: `general-purpose`), all focused on the user's specified topic:

| Agent | Task |
|-------|------|
| **Core Data Agent** | Search for quantified data directly related to the topic (gov data, industry data, market data). Return actual numbers with dates and source URLs. |
| **Context & History Agent** | Search for historical context, precedents, trajectory, structural factors related to the topic. Return timeline, key events, and source URLs. |
| **Market Impact Agent** | Search for market reactions, cross-asset implications, analyst commentary tied to the topic. Return data and source URLs. |
| **Contrarian & Risk Agent** | Search for opposing views, risks, implementation gaps, what could go wrong with the consensus view on the topic. Return counterarguments with evidence and source URLs. |

Each agent should run 3-5 web searches and return a concise bullet-point summary. The same **source quality hierarchy** from default mode Step 1 applies: primary sources first, expert analysis second, wire services last. Each agent must return at least 2 primary sources.

#### Topic Step 1.5: Read Previous Posts

Same as default mode — read recent posts in `_posts/` to check for overlap. If the topic was recently covered, the new post must offer a substantially different angle or deeper analysis.

#### Topic Step 2: Synthesize Thesis & Core Question

Define the **core question** (must end with `？`) and synthesize research from all four agents into:
- A clear thesis statement anchored to the core question
- Conditional reasoning framework (if X then Y, not probability scenarios)
- Key data points to anchor the analysis
- At least one credible opposing interpretation

#### Topic Step 3: Deep Investigation & Post Generation

Launch **1** agent (subagent_type: `general-purpose`) to:
1. **Deep research** — run 5-8 additional web searches going deeper than Step 1: primary sources, fine print, historical parallels, expert commentary
2. **Write the post** using the **unified skeleton** (開場 → 因果拆解 → 分水嶺 → 結語), following all Content Rules and Chart Guidelines
3. **Save** to `_posts/YYYY-MM-DD-{slug}-zh.md`

The agent receives:
- All research context from Topic Step 1
- The core question and synthesized thesis from Topic Step 2
- The unified skeleton, Content Rules, and Chart Guidelines
- The target filename and front matter template

**Front matter** is the same as default mode. Tags: `[macro, <primary_topic>, ...]` + topical tags based on the subject.

**Length:** Long-form (900-1200 words) by default for topic mode, as user-specified topics typically warrant deeper treatment.

#### Topic Step 3.5: Fact-Check (MANDATORY)

Launch **1** fact-check agent (subagent_type: `general-purpose`) covering all domains (market data, gov data, geopolitics, tech/industry) for the single post. The agent should:
- Verify all key data points and statistics against primary sources
- Verify all Chart.js data against cited sources
- Return a table: `Claim | Blog Value | Actual Value | Source | Verdict (correct/wrong/outdated)`

Apply the same rejection protocol as default mode Step 3.5.

#### Topic Step 3.6: Bias & Tone QA

Same as default mode Step 3.6.

#### Topic Step 3.65: Automated Pattern Scan

Same as default mode Step 3.65 but for the single generated post file. Run Grep for all known anti-patterns and verify required structural elements. Fix before proceeding.

#### Topic Step 3.7: Multi-Angle Quality Review

Same as default mode Step 3.7 but for a single post. Launch **1** agent (instead of 2) that covers both the reader/investor perspective and the writing quality perspective. The agent evaluates:
- Does this post provide a structural framework that a reader would still find valuable in 3 months?
- Does the 結語 have a clear 核心判斷 and specific invalidation conditions?
- Could the reader get equivalent value from a Reuters summary? If yes, the post needs more depth.
- Does the post follow the unified skeleton (開場 → 因果拆解 → 分水嶺 → 結語)?
- Are there any template-feel patterns (bold labels, directive language, generic statements)?
- Does every paragraph serve the core question?

#### Topic Step 4: Retrospective

Same as default mode Step 4.

#### Topic Step 5: Verify Output

Same as default mode Step 5 but for 1 post. Print a summary table:

```
| # | File | Topic | Core Question | Length | Chart ID |
|---|------|-------|---------------|--------|----------|
| 1 | `YYYY-MM-DD-slug-zh.md` | {user's topic} | ...？ | 長篇 | macroChartN |
```

---

## 🔒 必要數字檢核（新增，發文前必做）

以下三條為 **hard gate**，任何一條不通過都不得送出最終稿：

1. **口徑聲明（Denominator Declaration）**
   - 文章若同時用到總流量、原油、成品油、LNG 等不同口徑，必須在文中明確標示：
     - 口徑名稱
     - 對應數值
     - 後續推導採用哪一個口徑
   - 禁止在同一段推導中無註記切換口徑。

2. **關鍵等式表（Key Equation Table）**
   - 針對文中核心錨點（會影響結論的算式），至少列出：
     - 式子（例如：15.0 - 3.7 = 11.3）
     - 單位（百萬桶/日、bps、% 等）
     - 口徑說明
   - 若等式與結論數字不一致，必須先修正再發文。

3. **分母一致性檢核（Denominator Consistency Gate）**
   - 檢查每個段落中的比較/減法/比率是否使用同一分母與同一單位。
   - 若結論使用 A 口徑，圖表/段落不得用 B 口徑直接承接，除非明確標示「切換口徑」與原因。

### 最終輸出前自檢清單（簡版）

- [ ] 本文是否已寫出主要口徑聲明（至少 1 段）
- [ ] 核心錨點是否有等式表可回溯
- [ ] 是否通過分母一致性檢核（無未註記切換）

