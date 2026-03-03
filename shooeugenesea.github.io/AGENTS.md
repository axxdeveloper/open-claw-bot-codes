# AGENTS.md

## Startup Sync Rule

- At the start of every Codex session in this repo, run `./scripts/sync_macro_post_skill.sh`.
- Source of truth is `.claude/skills/macro-post`.
- Sync target is `<repo>/.codex/skills/macro-post` (always repo-local).
- If the sync command is blocked by sandbox permissions, request escalation and retry.
- Never modify files under `.claude/`; treat that directory as read-only.

## Local Skill

- `macro-post`: local repo skill at `.claude/skills/macro-post`.
