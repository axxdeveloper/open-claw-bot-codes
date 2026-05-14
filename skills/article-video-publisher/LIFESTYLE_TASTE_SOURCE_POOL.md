# Lifestyle / Fashion Taste Source Pool

Last reviewed: 2026-05-11

This file is separate from `SOURCE_POOL.md`. Use it only when a scheduled video run enters the lifestyle / fashion / taste branch.

Machine-readable registry: `LIFESTYLE_TASTE_SOURCE_REGISTRY.yml`.

Report directory: `reports/lifestyle-taste-source-watch/`.

Do not add these sources to `SOURCE_REGISTRY.yml`, and do not let technical AI/backend scoring consume lifestyle sources. The branch exists so around 40% of scheduled videos can explore taste topics without weakening the technical source pool.

## Selection Principles

- Target viewer: curious engineers and technical workers, any gender, who want better taste in everyday life, clothing, home, communication, and personal presentation.
- Write gender-neutrally unless Isaac or the original source explicitly narrows the audience.
- Avoid pickup framing, heteronormative defaults, body-shaming, status flexing, "alpha" framing, or gender stereotypes.
- For clothing/fashion videos, prioritize practical styling: how to combine clothes so the outfit looks better. Fit, proportion, silhouette, color, layering, shoes/accessories, occasion, office/commute/travel context, and repeatable outfit formulas should outrank fashion history, supply-chain ethics, sustainability, or cultural analysis.
- Material, history, labor, and sustainability can appear as supporting context, but they should not be the main automatic video payoff unless the source also teaches a clear "how to wear / how to style / what to pair it with" decision.
- Prefer evergreen taste mechanisms over trend recaps: fit, proportion, fabric, construction, care, repair, wardrobe systems, context/occasion, climate, commute, home objects, everyday environment, communication norms, and decision frameworks.
- Prefer interviews/articles that explain why something works, not just what to buy.
- Keep one main original source per video. Discovery feeds can surface a topic, but the public source must be the episode/article URL.
- If the branch finds no strong source, fall back to the normal technical AI/backend selection. Do not publish a weak lifestyle video just to satisfy the 40% branch.

## 40% Branch Rule

For automatic scheduled video runs:

1. At the beginning of topic selection, roll a 40% lifestyle/taste branch and a 60% technical AI/backend branch.
2. If selected, scan or read `LIFESTYLE_TASTE_SOURCE_REGISTRY.yml` and recent `reports/lifestyle-taste-source-watch/*.jsonl`.
3. Accept only candidates with `Taste` category, a clear viewer payoff, and enough source detail for source-attributed explanation.
4. If no candidate reaches the threshold, return to the technical source pool for that run.

This is a probability target, not a quota. Do not delay or skip good technical videos just because the lifestyle branch did not find a usable topic.

## Candidate Scorecard

Score each candidate out of 20.

| Criterion | Points | What To Check |
|---|---:|---|
| Source authority | 0-3 | Original article/episode, credible fashion/design/lifestyle publication, known host/interviewee, or source with clear expertise. |
| Substance depth | 0-4 | Explains mechanism, history, craft, material, fit, construction, social context, or tradeoff; not just a shopping list. |
| Audience value | 0-3 | Viewer gains a concrete styling decision, outfit formula, fit/proportion/color judgment, wardrobe/home workflow, care habit, or communication frame. |
| Timeliness | 0-2 | Recent, seasonally relevant, or evergreen with current usefulness. |
| Explainability | 0-3 | Can become clear visuals: before/after, fit map, material comparison, care workflow, context matrix, or example-based explanation. |
| Novelty / non-repeat | 0-2 | Not the same wardrobe/fashion/home lesson recently covered. |
| Sourceability | 0-2 | Episode/article URL, date, author/host/guest, and claims can be cited cleanly. |
| Risk clarity | 0-1 | Limits and caveats are clear: body variation, climate, budget, dress code, sustainability, culture, or context. |

Decision:

- `16-20`: Strong long-form candidate.
- `13-15`: Use long-form only if the source has enough concrete examples; otherwise make a focused Short.
- `9-12`: Short candidate only, usually one practical idea.
- `<9`: Reject.
- Reject if `audience_value < 2`.
- Reject if the value is only "looks nice", "buy this", "trend update", "celebrity style", or "sales/deals".
- Reject product affiliate posts, shopping roundups, sale posts, haul content, status/luxury flex, or thin trend galleries unless the article teaches a reusable taste principle.
- Reject automatic clothing candidates whose main value is serious fashion history, colonial/ethical/supply-chain analysis, or sustainability concern without a direct styling payoff. These can be saved for manually requested deep dives, but they are not the default Isaac wants from the lifestyle/taste lane.

Useful payoff shape:

- "看完後，觀眾可以用白 T、外層、褲型、鞋子和配色做出三種乾淨的日常搭配。"
- "看完後，觀眾可以判斷上衣長度、肩線、褲腰位置和鞋型怎麼影響整體比例。"
- "看完後，觀眾可以判斷一件衣服的版型和布料是否適合自己的日常情境。"
- "看完後，觀眾可以用一個簡單矩陣整理上班、約會、旅行、假日的衣櫃決策。"
- "看完後，觀眾可以用修補、保養、替換成本來判斷鞋子或外套值不值得買。"
- "看完後，觀眾可以把居家空間的顏色、光線和收納改成更穩定的生活系統。"

Weak payoff to reject:

- "看完後，觀眾可以知道今年流行什麼。"
- "看完後，觀眾可以了解某品牌新品。"
- "看完後，觀眾可以知道某名人穿什麼。"
- "看完後，觀眾可以知道一種材質背後的歷史問題。" unless the same video turns that into concrete styling and wardrobe decisions.

## Preferred Source Types

Fashion / clothing explainers:

- Articles of Interest
- Dressed: The History of Fashion
- Permanent Style
- Put This On
- Heddels
- Stitchdown
- Closet Core Patterns
- Un-Fancy

Interviews:

- Wardrobe Crisis
- Blamo!
- fashion/design interviews with concrete craft, material, sustainability, culture, or personal-style frameworks

Lifestyle / home taste:

- The Aesthetics of Joy
- Apartment Therapy
- Cup of Jo

Use lifestyle/home sources only when the item can teach a practical taste framework. Do not turn personal anecdotes into generic advice unless the original source gives enough substance.

## Good Video Angles

- Everyday outfit formulas: how to make a plain T-shirt, shirt, jeans, trousers, jacket, shoes, and accessories work together without looking sloppy.
- Fit and proportion: how to judge shoulder, rise, length, drape, silhouette, and comfort by context.
- Color and layering: neutral palettes, contrast, texture, outer layer choice, shoe weight, and how small changes make the outfit cleaner.
- Occasion styling: office, remote work, commute, date, weekend, travel, hot/humid weather, and "one item, three outfits" comparisons.
- Fabric/material literacy: wool, cotton, linen, denim, leather, synthetics, breathability, care, durability, and climate.
- Wardrobe systems: small repeatable wardrobes, outfit formulas, color constraints, office/remote/travel contexts.
- Repair and care: shoe care, laundry, alterations, mending, cost-per-wear, replacement timing.
- Taste history: use only when it clearly improves styling judgment, such as why a garment, style, uniform, or design language became meaningful and how to use the idea without cosplay.
- Home/life systems: lighting, storage, object choice, color, routine, hospitality, communication norms.
- Interview explainers: introduce the guest/source background first, then extract the decision model, not a personality profile.

## Public Video Requirements

- Keep the same article-video rules for source attribution, cover slide, context briefing, reader value, difficulty budget, OpenAI TTS, audio validation, YouTube description, and public-page verification.
- `source.json.reader_value.target_viewer` should say "工程師觀眾 / 技術工作者 / 一般觀眾" rather than assuming a gender.
- `context_briefing` should explain whether the source is a fashion history episode, craft article, interview, home design piece, or lifestyle essay, and why this source is credible.
- If a topic uses a gendered source such as menswear or womenswear, the video may mention that source context, but the extracted lesson should be framed only as broadly as the evidence supports.
