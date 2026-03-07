---
name: backend-hourly-knowledge
description: Generate hourly backend-engineering knowledge briefs in Traditional Chinese for non-experts. Use when sending periodic learning nuggets about backend topics (Kafka, databases, distributed systems, observability, APIs). Always explain key terms first, then provide practical summary + links, and prioritize recent high-impact/hot articles when available.
---

# Backend Hourly Knowledge

## Goal
Deliver one practical backend knowledge brief per run that is understandable to non-experts, with clickable sources.

## Output format (mandatory)
1) `【每小時後端知識】YYYY-MM-DD HH:mm（Asia/Taipei）`
2) `主題：...`
3) `先看懂名詞（3-6 個）`
4) `為什麼重要：...`
5) `重點摘要：`
   - `1) ...`
   - `2) ...`
   - `3) ...`
6) `延伸閱讀（至少 2 條）`
7) `執行設定：model=<model_id>｜reasoning=<level>｜think=<level>`

## Topic selection rules
- Prefer **recently hot or high-impact** backend topics first (new incidents, major release notes, widely shared engineering posts).
- If no strong new topic exists, pick evergreen fundamentals with high practical value.
- Rotate categories and avoid repeating the same topic family within 3 consecutive runs.

### Topic pool
- Messaging/Streaming: Kafka, RabbitMQ, Pulsar
- Databases: PostgreSQL, MySQL, Cassandra, MongoDB
- Cache/Search: Redis, Elasticsearch
- Distributed systems: consistency, idempotency, retries, queues, partitioning
- APIs/platform: gRPC, REST, API versioning, rate limit
- Operations: observability, SLO, incident patterns, capacity/perf tuning

## Source quality rules
- Minimum 2 links; target 3 when available.
- At least 1 official/primary source (official docs, vendor engineering blog, standards doc).
- Prefer reputable sources: official docs, major engineering blogs, cloud providers, CNCF, well-known maintainers.
- Do not output unverifiable claims.

## Language rules
- Traditional Chinese (Taiwan tone).
- Avoid jargon dumps; every acronym in body should appear in `先看懂名詞` or be expanded once.
- Keep actionable and concise.

## Fallback
If live/hot sources are weak on a given run:
- output an evergreen concept brief
- still include high-quality canonical links
- clearly keep advice implementation-oriented
