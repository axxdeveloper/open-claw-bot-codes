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
- Include AI engineering topics regularly: target at least **1 AI-related brief every 3 runs**.
- If no strong new topic exists, pick evergreen fundamentals with high practical value.
- Rotate categories and avoid repeating the same topic family within 3 consecutive runs.
- Anti-repeat hard rule:
  - Do not use the same core subject in consecutive runs.
  - Do not repeat the same core subject within 24 hours (e.g., Kafka Share Groups, PostgreSQL 18.3 regression).
  - If a related topic must be repeated after 24h, the angle must be materially different (incident recovery, rollout strategy, performance tuning, or architecture trade-off) and include at least 2 new links not used in the previous coverage.
  - If no fresh angle exists, switch to a different category instead of forcing repetition.

### Topic pool
- Messaging/Streaming: Kafka, RabbitMQ, Pulsar
- Databases: PostgreSQL, MySQL, Cassandra, MongoDB
- Cache/Search: Redis, Elasticsearch
- Distributed systems: consistency, idempotency, retries, queues, partitioning
- APIs/platform: gRPC, REST, API versioning, rate limit
- Operations: observability, SLO, incident patterns, capacity/perf tuning
- AI Engineering（新增）: 新模型發布、推理框架/工具（vLLM/Triton/TensorRT/ONNX Runtime）、RAG infra、向量資料庫、AI 系統可靠性/成本治理

## Source quality rules
- Minimum 2 links; target 3 when available.
- At least 1 official/primary source (official docs, vendor engineering blog, standards doc).
- Prefer reputable sources: official docs, major engineering blogs, cloud providers, CNCF, well-known maintainers.
- AI topics must include at least one of: model card / official release notes / framework docs.
- Source diversity rule: avoid using the same 1-2 domains for every run; rotate domains and include at least 2 distinct source domains per brief.
- Do not output unverifiable claims.

## Version-news handling (mandatory)
When the topic is a version/release announcement (e.g., minor release, out-of-cycle patch), do **not** stop at version numbers.
Must explain the practical mechanics:
1) What exactly broke (regression/bug class)
2) Real impact path (which workload/user flow can fail)
3) Trigger conditions (when it happens, who is affected)
4) What operators should do now (verification checklist / rollback / upgrade order)

If you cannot explain these 4 points, skip that story and pick another topic with clearer implementation value.

## Language rules
- Traditional Chinese (Taiwan tone).
- Avoid jargon dumps; every acronym in body should appear in `先看懂名詞` or be expanded once.
- Keep actionable and concise.

## Fallback
If live/hot sources are weak on a given run:
- output an evergreen concept brief
- still include high-quality canonical links
- clearly keep advice implementation-oriented
