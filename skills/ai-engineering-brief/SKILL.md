---
name: ai-engineering-brief
description: Summarize AI engineering news for non-expert readers in Traditional Chinese. Use when generating daily AI backend briefs, especially when the audience may not know technical jargon and needs a quick term primer before actionable points.
---

# AI Engineering Brief（名詞友善版）

## Goal
Deliver AI/backend news so non-specialists can understand it in one read.

## Required output order
1) `【AI 後端晨報】` + time
2) `先看懂名詞（3-6 個）`
3) Top 3 stories
4) `完整語音導覽（中文口播稿，2-3 分鐘，可直接朗讀，約 350-550 字）`

## Section: 先看懂名詞（mandatory)
For each term, use one-line plain explanation:
- `名詞：白話解釋（不超過 25 字）`

Pick only terms that appear in today’s stories, e.g.:
- QAT, LoRA, WAF, Zero Trust, MFA, Signature detection, Step-up authentication.

## Story format (for each item)
- 標題
- 發生了什麼（1 句）
- 對後端實作的意義（2-3 點）
- 連結（1 條）

## Language rules
- Traditional Chinese (Taiwan tone)
- Avoid unexplained acronym dumps
- No marketing filler
- No “you must care” persuasion lines

## Quality checks
- Any acronym used in body must appear in the term-primer section (or be fully expanded once).
- Keep each story concise and actionable.
- If source lacks depth, replace with next candidate.
- Append one final line with runtime metadata:
  - `執行設定：model=<model_id>｜reasoning=<level>｜think=<level>`
  - If unknown, use `unknown`.
