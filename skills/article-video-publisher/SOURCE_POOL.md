# Source Pool and Topic Scoring

Last reviewed: 2026-05-31

Use this file before choosing article-video topics. Prefer primary sources and high-signal material. Secondary sources can help discover topics, but the video should cite and explain primary sources whenever possible.

Machine-readable source registry: `SOURCE_REGISTRY.yml`.

- Treat `SOURCE_REGISTRY.yml` as the source-of-truth list for scheduled watchers.
- Treat this file as the editorial rubric: how to score, accept, combine, or reject candidates.
- When the registry and examples in this file disagree, update the registry first and then refresh this file.

## Selection Principles

- Prefer sources with mechanism, data, implementation detail, architecture, evidence, and tradeoffs.
- This pool is a maintained source list and an editorial scope boundary for routine 小舟 workflows. Topic choice should stay within technical, AI, backend/software, and engineering-company/operator sources, then be driven by source quality, source-understanding value, safety, duplication, cadence, and review results.
- Viewer value means the source becomes easier to understand: technical/system context, operating model, engineering-company lesson, concrete conclusion, limitation, or mental model. Do not require every candidate to become a role-specific judgment, workflow, risk check, or decision framework.
- Keep source pools organized so scoring remains readable.
- AI-related topics can be weighted above other categories when they are high-quality, non-duplicate, verifiable, and have clear source-understanding value. Do not rescue thin AI marketing posts only because they mention AI.
- Do not trade off AI by imposing a broad AI quota. AI remains a core lane. Trade off repeated sources: if recent published videos are concentrated in the same domain, registry source, source family, paper feed, interview channel, or company blog, apply a soft repetition penalty and look for an equally strong source from a different original site or evidence type.
- Within AI, rotate evidence types when quality allows: papers, official lab posts, model/system cards, repositories, engineering blogs, high-signal interviews, and operator/product AI sources. A repeated AI source can still win when it is urgent, unusually deep, or clearly better than alternatives.
- AI topic selection must be time-aware. Treat 30 days as the freshness baseline for automatic AI candidates. Older AI sources are not automatically rejected when they are durable concept, architecture, history, taxonomy, security, or retrospective lessons, but the run must record why the claim is still valid now. Time-sensitive AI sources about model releases, API behavior, pricing, benchmarks, evals, coding-agent performance, inference cost/latency, tools, or product claims should be rejected or refreshed with newer primary evidence when older than about 30 days.
- Treat a candidate as AI-related when the source category is AI, or when a source is concretely about AI systems, model releases, agents, evals, inference, RAG/search, AI safety, AI developer tooling, AI infrastructure, AI product adoption, or AI organizational impact.
- Avoid thin announcements, pure marketing posts, listicles, rumor-only stories, and content that cannot be verified from a primary or authoritative source.
- Avoid company posts that are mainly self-promotion, product marketing, customer acquisition, or "why our product" positioning. Official company posts can be selected only when they include enough architecture, benchmark data, implementation detail, operational lessons, limitations, or failure modes to teach something beyond the vendor's pitch.
- Do not confuse feed metadata quality with source quality. When a recent tier 1-2 primary technical source only exposes a thin title, URL slug, or empty summary, open the original page before rejecting it if the source type and title/URL/tags suggest a concrete technical release, model/API change, engineering post, benchmark, security item, database/runtime update, or architecture/incident lesson. Still reject obvious corporate noise such as funding, office, customer, event, or partnership posts unless the title itself points to substantial technical detail.
- Use Taiwan-local Traditional Chinese explanation in the final video.
- Treat official research blogs and named researcher/team blogs from groups like Anthropic and Google DeepMind as high-priority sources when they contain mechanism, experiments, engineering detail, or clear research context.
- For researcher/team blog posts, verify major claims against the linked paper, official release note, repo, docs, benchmark, or data source before publication.
- Treat Hacker News as a technical trend discovery layer, not as the main public source. Recent HN top stories can reveal what technical communities are discussing, but the selected video must trace back to a primary original URL whenever possible. HN score/comment volume can boost urgency only after the source passes viewer-value, verifiability, non-duplicate, and non-marketing checks.
- For HN-driven candidates, prefer stories with a concrete mechanism: incident analysis, architecture change, release with engineering detail, paper/repo with evidence, performance or reliability tradeoff, security advisory, or production lesson. Reject drama, rumor-only discussions, pure opinion fights, generic Show HN demos without substance, and Ask HN discussions unless the discussion itself contains unusually strong expert detail.
- Treat public posts from technology workers, KOLs, maintainers, researchers, founders/operators, and engineering practitioners as optional technical trend discovery signals. They can reveal what AI/backend/database/infra/security/devtools communities are discussing, including Kafka, Cassandra, streaming/messaging, database internals, and distributed systems. Use only already-available public signals; do not add a social-platform follow or engagement workflow for topic radar.
- For social/KOL-driven candidates, trace the signal back to an original article, official project/company post, repo/release, paper, benchmark, conference talk, or documentation before selection. A KOL hot take can only boost urgency or source-discovery priority after the original source passes the scorecard, sourceability, safety, non-duplicate, and non-marketing gates.

## Continuous Topic Optimization Loop

Topic selection should improve from the same evidence every day, not rely on a static list.

Use this loop for scheduled workflows:

1. Daily source watch scans `SOURCE_REGISTRY.yml` and writes `reports/source-watch/YYYY-MM-DD.jsonl` plus `reports/source-watch/source-health.json`.
2. Daily HN watch scans recent Hacker News top stories and writes/updates the `hn-daily-top-1500` section in `reports/daily-audio-pack/YYYY-MM-DD.md`; use it as discovery context for the technical branch.
3. Existing historical social/KOL signal notes may be read only as discovery context and source-diversity hints, not as public sources. Do not create a new proactive social follow-scout workflow for topic radar.
4. Candidate ranking applies the 20-point scorecard, source weights, AI priority multiplier, interview priority bonus, duplicate checks, source-diversity penalty, trend-signal urgency, and marketing penalty before choosing a topic.
5. For high-authority recent sources with thin feed metadata, the watcher may enrich the candidate by opening the original page and extracting title, meta description, structured data, and article text before scoring. The goal is fair comparison against paper feeds and RSS feeds that already include abstracts; it is not a license to rescue marketing posts.
6. Review `reports/source-watch/YYYY-MM-DD-near-misses.jsonl` when selection looks odd. It records high-authority or close-call items that were rejected, including whether enrichment ran, the summary length, score, format decision, and reject reasons.
7. Before starting a new video, compare the candidate against recent `reports/article-video-publisher/**/source.json`, YouTube metadata, the last 30 days of source-watch dedupe keys, and recent YouTube Community source-intro ledgers. Inspect both topic duplication and source concentration.
8. After every published video, keep `review/improvement-notes.md`, `review/ai-usage-improvement.md`, and `source.json.candidate_score` so future runs can see which sources produced understandable, deep videos and which sources improved our own AI workflows.
9. Use `review/ai-usage-improvement.md` to capture whether the source suggests improvements to topic selection, prompts, agents, source verification, RAG/search, eval/review gates, TTS/video, reliability, cost/latency, safety, privacy, or publishing operations. Prefer reversible tests; write no-op when the source does not produce a concrete internal improvement.
10. When a source repeatedly yields thin, promotional, duplicate, or unverifiable candidates, lower its registry weight or disable it. When a source repeatedly yields review-passing, high-depth AI topics or useful internal AI usage improvements, keep or raise its weight.

The practical goal: the pool should drift toward sources that repeatedly produce explainable mechanisms, not just sources that publish often.

## Source Pool Maintenance Cadence

The source pool is a maintained system, not a fixed bookmark list.

Daily:

- `source-pool-watch-daily-0830` scans the technical registry, writes daily JSONL, and updates `source-health.json`.
- Production and補位 jobs should use the latest health/candidate reports before selecting topics.
- Treat transient feed errors as watch items, not immediate deletion.

Weekly:

- Review `reports/source-watch/source-health.json` and the last 7 days of `reports/source-watch/*.jsonl`.
- Build a weekly technical radar with `scripts/build_weekly_tech_radar.py --date YYYY-MM-DD`. Use `reports/weekly-tech-radar/YYYY-MM-DD.md` as the source for a weekly radar video or YouTube post: what was scanned, the top picks, why those picks won, good topics that were not selected, and what the watcher likely missed.
- Check for enabled sources with repeated fetch errors, zero candidates, malformed titles, homepage/navigation noise, or mostly marketing output.
- Check for coverage imbalance across AI, databases, streaming/messaging, observability/SRE, production engineering, Java/JVM, runtimes, and cloud architecture, plus domain/source-family concentration in recently published videos.
- Adjust weights or disable sources that repeatedly fail the clear source-understanding gate.
- Add or repair sources when a useful category has weak coverage, but prefer primary, official, project, expert, or high-signal sources over aggregator feeds.
- Run a clean temporary dry-run after changes and require: registry parses, IDs are unique, watcher can fetch/parse, and candidate quality is plausible.

Weekly radar editorial format:

- The radar is a "what the system saw this week" explanation, not a replacement for normal source-first videos.
- Cover the strongest candidates across the week, grouped by technical lane when useful: AI, backend/database, streaming/messaging, security, infra/SRE, devtools/runtime, and engineering-operator lessons.
- For each top pick, say why it was chosen in plain language: source authority, substance, why viewers can understand something better, freshness, explainability, and source-diversity tradeoff.
- Include a "not picked but worth knowing" section for high-scoring shorts, duplicate-adjacent items, source-repetitive items, or good topics that lost to a stronger candidate.
- Include a "radar gaps" section. This must be honest and limited: source-health failures, registry categories with no accepted candidates, enabled sources with zero candidates, and manually known important releases that were not captured. Do not claim the internet had no topic; only claim OpenClaw did not scan or accept it.
- If a radar gap is important, create a follow-up source-registry repair, enrichment rule, or manual topic candidate before the next weekly radar.

Monthly:

- Compare recent published `source.json` and `review/improvement-notes.md` against source-watch candidates.
- Raise or keep sources that produce deep, understandable, review-passing videos.
- Lower, disable, or quarantine sources that repeatedly produce thin, promotional, duplicate, unverifiable, or off-audience candidates.
- Revisit manual/reference sources such as Amazon Builders Library when the parser can support their catalogs.

Promotion and demotion:

- Promote a source when it repeatedly gives transferable mechanisms: architecture, implementation, benchmark, migration, incident, reliability, storage/query/runtime, or operational tradeoff.
- Demote a source when the useful angle is mainly "this vendor/product is good", the feed is mostly events/webinars/customer stories, or the watcher cannot parse stable article URLs.
- Keep exploratory vendor sources at lower weights unless their posts consistently teach general software engineering, AI-assisted development, or production engineering decisions.

## Candidate Scorecard

Score each candidate out of 20.

| Criterion | Points | What To Check |
|---|---:|---|
| Source authority | 0-3 | Primary/official source, credible engineering/research/data source, or expert technical video. |
| Substance depth | 0-4 | Enough mechanism, data, architecture, code, method, implementation detail, or engineering tradeoff. |
| Audience value | 0-3 | The source can be made easier to understand: source object, mechanism, evidence, conclusion, limitation, or mental model, not just headline awareness. |
| Timeliness | 0-2 | Recent, newly relevant, or still important because it explains a current shift. |
| Explainability | 0-3 | Can be turned into clear diagrams, examples, timelines, comparisons, or decision maps. |
| Novelty / non-repeat | 0-2 | Not a repeated topic or overused recent source/domain/source family unless the angle is materially new. |
| Sourceability | 0-2 | URLs, dates, claims, and data can be cited cleanly in video description/slides. |
| Risk clarity | 0-1 | Risks, caveats, or uncertainty can be stated responsibly. |

AI priority multiplier:

- After the 20-point score, apply a ranking multiplier to AI-related candidates for sorting. Use `ai_priority=true` in local artifacts when this boost affected ordering.
- A qualified AI candidate with `total >= 13` should beat a non-AI candidate unless the AI source is stale-risk without a durability/freshness justification, duplicated, unverifiable, too thin, source-repetitive without exceptional value, or blocked by a manual URL/topic.
- Strong AI candidates with `total >= 16` should be selected before non-AI strong candidates by default, but first apply the source-diversity penalty so the channel does not feel dominated by the same few websites.

AI temporal relevance gate:

- Automatic AI candidates within 30 days are fresh by default, subject to normal quality checks.
- AI candidates older than 30 days must be classified before selection: durable concept/architecture/history/retrospective, or time-sensitive current claim.
- Reject or refresh older time-sensitive claims about model releases, API behavior, pricing, benchmark/eval results, coding-agent performance, inference cost/latency, tooling, and product capabilities.
- Missing or unparsable dates are a freshness blocker for automatic AI topics unless a newer primary source is opened and recorded.
- For older durable AI sources that pass, record `ai_temporal_review_required=true` plus the reason the source still teaches something valid now.

Source-diversity soft gate:

- Before final selection, inspect at least the last 10 published video `source.json` files when available, and preferably the last 20 for trend context.
- If the same domain, registry source, source family, arXiv/paper feed, interview channel, or company blog appears more than twice in the last 10 or more than four times in the last 20, do not hard-reject it; require a stronger reason such as major release, unusually deep mechanism, high urgency, or no comparable alternative.
- Avoid back-to-back selections from the same domain/source family unless the new item is clearly stronger than the alternatives. Record the reason in `source.json.candidate_score.source_diversity_note` or the run notes.
- When two candidates are close in score, choose the one that broadens the published source mix and still passes the source-understanding gate.

Marketing penalty:

- Subtract enough from `substance_depth`, `audience_value`, and `explainability` to reject posts that are mostly launch copy, customer stories, partner announcements, webinars, lead-gen, or self-serving product comparisons.
- If the strongest reason to make the video is "this company says its product is useful", reject it.
- If the post is from a vendor but contains concrete architecture, reproducible benchmarks, constraints, implementation detail, or operational lessons, treat those technical details as the topic and keep vendor claims clearly bounded.
- Official AI/company posts about customer adoption, partnerships, finance, education, government, legal/policy, culture, religion, society, or other broad non-engineering contexts need substantial technical substance to pass automatic selection. If they do not explain a model/API/system change, benchmark, architecture, implementation, security issue, incident, runtime/database behavior, or operational tradeoff, reject them as off-audience even when the source is authoritative.

Decision:

- `16-20`: Strong long-form candidate.
- `13-15`: Use long-form if source is deep enough; otherwise make a focused Short.
- `9-12`: Short candidate only, unless combined with another strong source.
- `<9`: Reject or keep only as background.
- Reject or reshape any candidate with `audience_value < 2`, even if the total score is high.
- Reject automatic candidates only when the topic is thin, unverifiable, duplicate, unsafe for the platform, too promotional, or lacks clear source-understanding value.
- Reject automatic candidates that cannot state what viewers will understand better about the original source.
- Give `audience_value=3` only when you can write one sentence such as "看完後，觀眾可以更容易理解..." followed by the source object, mechanism, conclusion, or limitation that becomes clearer.
- `audience_value=2` means useful background or mental model, but the title/intro must still make the source-understanding value visible.
- `audience_value=1` means mostly headline awareness; do not make a long-form video.
- `audience_value=0` means no clear source-understanding value; reject.
- Apply AI priority after reject/quality filtering, not before. Do not rescue thin AI marketing posts only because they mention AI.
- Apply technical community trend signals after reject/quality filtering, not before. Do not rescue a weak source only because a community is talking about it.

Format choice:

- Long-form: use when the topic has at least three strong explanatory units: background, mechanism, tradeoff, impact, implementation, or risk.
- Shorts: use when the topic is high-signal but narrow, visual, or useful as a quick concept/risk explainer.
- Single-topic explainer with supplemental verification: use one main original source as the public video source. Additional authoritative sources may verify claims or provide context only when they support the same topic; do not turn this into a roundup.

## AI Sources

Tier A primary sources:

- OpenAI News: https://openai.com/blog/
- OpenAI Developers / API docs: https://platform.openai.com/docs
- Google DeepMind Blog: https://deepmind.google/en/blog/
- Anthropic News: https://www.anthropic.com/news
- Anthropic Research: https://www.anthropic.com/research
- Anthropic Engineering / researcher-team posts: https://www.anthropic.com/engineering
- Meta AI Blog: https://ai.meta.com/blog/
- Hugging Face Blog: https://huggingface.co/blog
- arXiv AI / ML papers: https://arxiv.org/list/cs.AI/recent and https://arxiv.org/list/cs.LG/recent

Tier B discovery / context sources:

- AI Engineer / Latent Space talks and interviews when transcript/detail is available.
- DeepLearning.AI technical posts and courses when they explain mechanisms.
- Major cloud AI blogs: AWS, Google Cloud, Azure, Cloudflare AI.
- GitHub high-star repos with active releases, docs, architecture notes, or benchmark detail.
- Named researcher personal/team blogs from credible labs when the author identity is clear and claims are tied back to primary artifacts.

AI paper priority sources:

- arXiv cs.AI: https://arxiv.org/list/cs.AI/recent
- arXiv cs.LG: https://arxiv.org/list/cs.LG/recent
- arXiv cs.CL: https://arxiv.org/list/cs.CL/recent
- arXiv cs.CV: https://arxiv.org/list/cs.CV/recent
- arXiv stat.ML: https://arxiv.org/list/stat.ML/recent
- Hugging Face Papers: https://huggingface.co/papers

Treat AI-related papers as priority candidates only when their research question, method, result, and limitation can be explained clearly for first-time viewers. Prefer papers about agents, coding/codegen, RAG/search/source attribution, eval/safety/reliability, inference cost/latency/serving, tool/browser/GUI use, long context/memory, multimodal systems, open models, post-training, or deployment workflows. Method, benchmark, evaluation, dataset, code, and artifacts are evidence requirements; they do not make a paper important by themselves.

Use the arXiv abstract/PDF, conference/OpenReview page, official project page, or repository as the main source when possible. Hugging Face Papers and Papers With Code-style pages are discovery/context unless the paper page links cleanly to the original paper and artifacts.

Reject or defer papers when the abstract is too narrow, math-only without a clear explanation path, domain-specific without a source-backed concept a broader viewer can follow, lacks evidence, duplicates a recently covered idea, has no accessible source/PDF, or would require speculation beyond the paper's claims. Do not select a paper only because it is recent or because it appeared in an arXiv/Hugging Face feed.

AI leader interview priority sources:

- Dwarkesh Podcast: https://www.dwarkesh.com/
- Latent Space: https://www.latent.space/podcast
- No Priors: https://www.youtube.com/@nopriorspodcast
- The Cognitive Revolution: https://www.cognitiverevolution.ai/
- TWIML AI Podcast: https://twimlai.com/podcast/twimlai/
- Machine Learning Street Talk: https://www.mlst.ai/
- Lex Fridman AI interviews: https://www.youtube.com/@lexfridman
- AI + a16z: https://a16z.com/podcasts/ai-a16z/
- Sequoia Training Data: https://sequoiacap.com/series/training-data/
- Sequoia Capital YouTube / AI Ascent: https://www.youtube.com/@sequoiacapital/videos
- Invest Like The Best YouTube: https://www.youtube.com/@ILTB_Podcast/videos
- Practical AI: https://practicalai.fm/

Treat high-signal AI interviews as priority candidates when they feature frontier lab leaders, important researchers, model/tooling builders, inference/infra operators, AI product founders, or credible safety/eval voices. Strong interview topics include Ilya Sutskever, Dario Amodei, Demis Hassabis, Jeff Dean, Andrej Karpathy, Noam Shazeer, Jensen Huang, Yann LeCun, Geoffrey Hinton, Yoshua Bengio, Fei-Fei Li, Andrew Ng, and similarly influential AI builders or researchers.

Use the interview episode URL as the main original source only when the episode has enough transcript, show notes, chaptering, linked references, or concrete claims to support a source-attributed explainer. For broad interview feeds, select only AI-relevant episodes. Avoid celebrity, biography, fundraising, or pure founder-story episodes unless they explain a real technical, product, safety, eval, or deployment mechanism.

For YouTube-only conference talks or channel videos, do not assume the podcast/RSS feed will catch them. Add or maintain a channel parser/source when the channel repeatedly publishes AI Ascent-style frontier-lab interviews, keynotes, or builder conversations. A title-only item can still be important when it combines an influential AI builder/researcher with a concrete frontier claim such as AGI timelines, world models, AI for science, drug discovery, safety/governance, reasoning/planning limits, or deployment impact. Prefer videos with captions, chapters, or a description rich enough to explain the claim instead of making a personality profile.

Also keep a lane for AI product/operator interviews. These are important when the guest is a credible builder/operator and the episode explains how AI changes product design, team structure, hiring, management layers, consumer AI, user experience, company operating models, or AI adoption workflows. Brian Chesky / Airbnb-style "AI founder mode" conversations should surface when they teach a reusable AI-era product or organization mechanism. Avoid biography, motivation, or generic business episodes even if they mention AI.

Do not depend only on fixed channels Isaac or the registry already know. The daily broad discovery job writes `reports/source-discovery/YYYY-MM-DD.jsonl` from YouTube searches such as AI founder mode, consumer AI, AI product strategy, AI agents, coding agents, frontier AI, and AI for science. Treat those results as candidate context for technical AI/operator interviews; promote repeated high-quality channels into `SOURCE_REGISTRY.yml`, but do not require manual user submission before evaluating a strong discovered interview.

Good AI video angles:

- Model release mechanics: context window, tool use, coding, evals, safety, deployment constraints.
- Inference systems: batching, KV cache, routing, quantization, GPU utilization, latency/cost tradeoffs.
- Agent engineering: tracing, permissioning, memory, evals, browser/tool reliability, rollback.
- RAG/search: indexing, chunking, ranking, grounding, vector/database tradeoffs.
- Interview explainers: turn the guest's mental model into background, mechanism, tradeoff, risk, source-backed implication, and what to watch next in the original source. Do not make a personality profile.

## Backend / Infrastructure Sources

Coverage rule:

- Do not let the technical pool collapse into a few familiar company blogs, paper feeds, or AI interview channels. Keep the engineering branch balanced across AI engineering, databases, streaming/messaging, observability/SRE, cloud architecture, runtimes/frameworks, security, developer tooling, performance/cost, and real production engineering blogs.
- Keep technology learning broader than code and infrastructure. Add high-quality operator/company-building sources when they help viewers understand how strong technology companies operate in the AI era: product strategy, team structure, management layers, hiring, decision-making, user experience, AI adoption, and engineering/product collaboration. Accept these when the source has concrete claims, examples, or mechanisms that can be explained clearly without turning the topic into generic adoption advice.
- When a scheduled run has several similar candidates, prefer the one that fills a recent coverage gap if it still passes the scorecard and can state what the viewer will understand better about the original source.
- Treat broad company engineering blogs as discovery sources unless the specific post has mechanism, architecture, incident detail, benchmark data, migration steps, or operational tradeoffs. Reject posts that are mainly hiring, culture, launch, product positioning, or customer marketing.
- For vendor database and observability sources, require the public video angle to be the transferable mechanism, not "this product is good".

Tier A primary sources:

- Cloudflare Blog / Engineering: https://blog.cloudflare.com/ and https://blog.cloudflare.com/tag/engineering/
- AWS Architecture Blog: https://aws.amazon.com/blogs/architecture/
- AWS Database Blog: https://aws.amazon.com/blogs/database/
- Amazon Builders Library: https://aws.amazon.com/builders-library/ (manual/reference until watcher parser supports its dynamic catalog)
- Netflix TechBlog: https://netflixtechblog.com/
- Uber Engineering Blog: https://www.uber.com/blog/engineering/
- Meta Engineering: https://engineering.fb.com/
- Google Research / Engineering blogs: https://research.google/blog/ and https://developers.googleblog.com/
- Google SRE Resources: https://sre.google/resources/
- CNCF Blog: https://www.cncf.io/blog/
- GitHub Engineering: https://github.blog/engineering/
- Stripe Engineering: https://stripe.com/blog/engineering
- Slack Engineering: https://slack.engineering/
- Shopify Engineering: https://shopify.engineering/
- Dropbox Tech: https://dropbox.tech/
- Spotify Engineering: https://engineering.atspotify.com/
- Airbnb Tech: https://airbnb.tech/

Project / release sources:

- PostgreSQL: https://www.postgresql.org/about/news/
- Apache Kafka: https://kafka.apache.org/blog
- Apache Cassandra: https://cassandra.apache.org/_/blog.html
- Apache Flink: https://flink.apache.org/posts/
- Apache Pulsar: https://pulsar.apache.org/blog/
- RabbitMQ: https://www.rabbitmq.com/blog/
- NATS: https://nats.io/blog/
- Debezium: https://debezium.io/blog/
- Kubernetes: https://kubernetes.io/blog/
- Redis: https://redis.io/blog/
- OpenSearch: https://opensearch.org/blog/
- Elasticsearch: https://www.elastic.co/blog/
- OpenTelemetry: https://opentelemetry.io/blog/
- Go Blog: https://go.dev/blog/
- Rust Blog: https://blog.rust-lang.org/

Database / data platform sources to actively include:

- Databricks Blog: https://www.databricks.com/blog
- MongoDB Blog: https://www.mongodb.com/company/blog
- PlanetScale Blog: https://planetscale.com/blog
- Neon Blog: https://neon.tech/blog
- ClickHouse Blog: https://clickhouse.com/blog
- Cockroach Labs Blog: https://www.cockroachlabs.com/blog/
- MySQL Release Notes: https://dev.mysql.com/doc/relnotes/mysql/8.4/en/
- MariaDB Blog: https://mariadb.org/
- OpenText Analytics Database / Vertica Community: https://community.opentext.com/data-analytics/b/data-analytics-blog
- ScyllaDB Engineering: https://www.scylladb.com/category/engineering/
- DuckDB Blog: https://duckdb.org/
- TigerData / Timescale Blog: https://www.tigerdata.com/blog
- YugabyteDB Blog: https://www.yugabyte.com/blog/
- Materialize Blog: https://materialize.com/blog/
- Redpanda Blog: https://redpanda.com/blog

Good database video angles:

- Release explainer: optimizer, replication, indexing, storage engine, security, transaction, or compatibility changes.
- Database internals: MVCC, WAL, compaction, vector search, distributed SQL, consistency, query planning, caching, and storage layout.
- Operational tradeoffs: schema migration, backups, failover, serverless architecture, cost/performance, latency, and observability.
- Data platform architecture: lakehouse, Spark/Databricks SQL, streaming, batch/online boundaries, governance, and AI data pipelines.

Good streaming / messaging video angles:

- Kafka/Pulsar/RabbitMQ/NATS tradeoffs: durability, ordering, replay, consumer groups, geo-replication, backpressure, and operational failure modes.
- Stream processing architecture: Flink state, checkpointing, watermarks, CDC, schema evolution, exactly-once semantics, connectors, and Kubernetes operations.
- Change data capture: source database impact, ordering guarantees, schema drift, replay strategy, and downstream consistency.

Good observability / SRE video angles:

- OpenTelemetry collector and semantic-convention changes that alter instrumentation, cost, or incident-debug workflows.
- Metrics/logs/traces/profiles pipeline architecture, sampling, cardinality control, storage cost, and retention tradeoffs.
- SLO, incident response, capacity, rollout, and operational playbooks from Google SRE, AWS Builders Library, Datadog, Grafana, and real company engineering writeups.

Good production engineering blog angles:

- Large-scale migrations, incident writeups, platform rebuilds, API correctness, developer-experience systems, CI/build systems, security hardening, and reliability tradeoffs.
- Prefer posts that expose constraints, measurement, failure modes, and rollback decisions. Reject culture/hiring posts and high-level "how we work" essays unless they teach a concrete engineering workflow.

## Java / JVM Sources

Tier A primary and project sources:

- Inside Java: https://inside.java/
- OpenJDK JEPs: https://openjdk.org/jeps/0
- Spring Blog: https://spring.io/blog

Tier B Java technical sharing / discovery:

- Foojay Today: https://foojay.io/today/
- Conference talks from Devoxx, JVM Language Summit, JavaOne/Oracle Code One, QCon, Strange Loop, SpringOne, and high-signal maintainer talks when slides/transcript are available.

Good Java/JVM video angles:

- JDK/JEP changes: language features, virtual threads, structured concurrency, GC, Panama, Valhalla, Loom, security, and compatibility.
- JVM performance: GC behavior, startup, memory, profiling, JIT, native image, observability, and latency tuning.
- Backend Java: Spring Boot/Framework release changes, cloud native deployment, data access, messaging, resilience, and production pitfalls.
- Practical migration: what changes for existing services, what breaks, what to measure, and when to adopt.

Good backend video angles:

- Incident or regression mechanics: trigger, blast radius, detection, mitigation, rollout lesson.
- Scaling architecture: queues, caching, storage, consistency, sharding, replication, rate limits.
- Observability and reliability: tracing, SLOs, retry storms, backpressure, capacity planning.
- Security and platform: auth, supply chain, sandboxing, secret handling, least privilege.

## Technical Video Sources

Use when the video itself has enough substance, transcript, slides, code, or references:

- AI Engineer / Latent Space talks.
- Stanford, MIT, Berkeley, CMU technical lectures.
- Conference talks from KubeCon, Kafka Summit, PyCon, Strange Loop, QCon, AWS re:Invent, Google Cloud Next, Cloudflare Connect.
- Maintainer talks linked from official project blogs or docs.

Technical video rules:

- Prefer talks with transcript or slides.
- Extract the speaker's core model, not every anecdote.
- Cite the video URL and any linked slides/repo.
- Convert talk structure into: background, mechanism, tradeoff, practical takeaway, caveat.

## Weekly Technical Radar

The weekly radar is a separate curation format, not the normal single-source explainer. It can become a YouTube video or YouTube Community post when explicitly scheduled or requested.

Build it with:

```bash
python3 scripts/build_weekly_tech_radar.py --date YYYY-MM-DD --days 7
```

Use `reports/weekly-tech-radar/YYYY-MM-DD.md` as the planning artifact. The public output should:

- summarize the main technical lanes OpenClaw scanned this week.
- introduce the strongest picks and explain why they won: source authority, substance, viewer-understanding value, freshness, explainability, and source-diversity tradeoff.
- include a "worth knowing but not selected" section for strong runner-up items, source-repetitive items, duplicate-adjacent items, or topics that lost to a stronger source.
- include a "radar gaps" section: source-health failures, registry categories without accepted candidates, enabled sources with zero candidates, and manually known important releases not captured by the watcher.
- cite each discussed original source URL. Never cite the local weekly radar report, source-watch JSONL, HN page, daily-audio-pack, or internal report as the public source.
- avoid pretending the radar is exhaustive. Say what OpenClaw scanned and accepted, not what the whole internet contained.

If the weekly radar becomes a video, set `youtube/metadata.json.topic_format` to `weekly_tech_radar`, include `source_urls` with the original source URLs being introduced, and use a `本週來源：` section with each raw URL on its own line instead of the normal single-source `文章來源：` block. `scripts/lint_youtube_description_source.py` must still PASS before upload.

## Replacement Rules

If the first candidate is weak:

1. Try another source in the same category.
2. If the topic is still important but the main source is thin, use another authoritative source as the main source. Supplemental sources may verify the same topic, but public attribution must still identify one main original source.
3. If final long-form render is under 120 seconds, convert to Shorts when the concept is still clear.
4. If the source is unverifiable, outdated, or too shallow even for Shorts, reject it and record why.

## Output Requirements

For every selected topic, write the following into `source.json`:

```json
{
  "reader_value": {
    "target_viewer": "...",
    "why_now": "...",
    "viewer_question": "...",
    "useful_after_watching": "看完後，觀眾可以更容易理解...",
    "not_just_news": true
  },
  "candidate_score": {
    "source_authority": 3,
    "substance_depth": 4,
    "audience_value": 3,
    "timeliness": 2,
    "explainability": 3,
    "novelty_non_repeat": 2,
    "sourceability": 2,
    "risk_clarity": 1,
    "total": 20
  },
  "format_decision": "long-form | shorts | reject",
  "decision_reason": "why this source deserves a video"
}
```
