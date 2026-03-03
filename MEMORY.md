# MEMORY.md

## Stable project locations

- `macro-post` lives in repo: `shooeugenesea.github.io`
  - Source-of-truth skill: `shooeugenesea.github.io/.claude/skills/macro-post/SKILL.md`
  - Codex runtime copy: `shooeugenesea.github.io/.codex/skills/macro-post/SKILL.md`
  - Sync script: `shooeugenesea.github.io/scripts/sync_macro_post_skill.sh`
  - Existing research/install report: `shooeugenesea.github.io/macro-post-skill-report.md`

## Working agreements with Isaac

- Scheduling source of truth: **Google Calendar**.
- When Isaac gives schedule info, write to Google Calendar first.
- Daily schedule brief should read from Google Calendar.
- When reporting schedule to Isaac, include weekday labels (e.g., 3/6（五）).
- Task-list separation rule:
  - **Personal tasks (Isaac)** stay in default list `預設工作清單` (`MTgxMzE2ODIzNTI1NDczMTA3NDk6MDow`).
  - **Bot tasks** are split into 3 lists:
    - `IsaacBot 執行 list` (`UkUyd2JOckp6c1g2YzBYQQ`)
    - `IsaacBot 常駐 list` (`ZnB6TDhkc3pqUjJEeEZYMA`)
    - `IsaacBot 定期 list` (`bjZlUzREcUd2UV9aZzB2bg`)
  - Legacy `IsaacBot 任務板` remains as historical backlog/archive.
- Workflow rule (strict): for any bot-executed work, first create/update task in `IsaacBot 執行 list`, then execute, then mark the task completed.
- `[NOW] IsaacBot 目前正在做` policy: show only when there is at least one other active execution task; auto-close it when queue is empty.
- Long-term maintenance requirement: continuously maintain the Google Doc `IsaacBot 系統總覽與維護` with up-to-date status.
- For morning tech article brief: use **high-level conceptual explanation** with enough context (not overly short snippets).
- Preferred fixed structure for each tech news item: 核心概念 → 問題背景 → 運作模型 → 關鍵取捨 → 實際影響.
- Also wants daily economic market reports in the same structure for two windows: TW post-close and US post-close; include links and explain big up/down causes.
- Morning delivery order requirement: update Google Doc tabs (`最近行程` / `AI 新聞` / `美股` / `台股`) first, then send the user-facing morning notification.
- Response preference: when sharing file paths, prefer GitHub URL paths over local absolute filesystem paths.
- Writing style preference: tech blog style should differ from macro posts — use straightforward narrative, practical implementation notes, and include common pitfalls (地雷).
- Holdings to focus in daily market reports:
  - US: QQQ, VT, VTI, VGSH, VGIT
  - TW: 0050, 中鋼
- During current tuning phase, Isaac prefers **high-frequency, tight collaboration and active monitoring** (not low-interruption mode).
- Task update reliability protocol (adopted): for every Google Tasks add/update/done action, enforce write-after-read verification and report evidence fields (`list id`, `task id`, `status`, `read-back title/updated time`); if read-back mismatch, retry 2–3 times then report failure explicitly (no optimistic success claims).

## Reliability rule

When user references prior work/project names, first check this MEMORY.md and then verify paths in workspace before answering.
