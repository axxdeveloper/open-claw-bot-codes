---
name: autoresearch-lab
description: Run and operate Karpathy-style autoresearch loops on a local repo (especially karpathy/autoresearch). Use when setting up autonomous LLM-training experiments, validating environment/data, launching 5-minute experiment runs, parsing run.log metrics, deciding keep/discard from val_bpb, and maintaining results.tsv without committing it.
---

# autoresearch-lab

Operate `karpathy/autoresearch` with a repeatable workflow.

## Repo + scope

- Default repo: `/Users/openclaw-user/.openclaw/workspace/repos/autoresearch`
- Only edit `train.py` during experiments.
- Never modify `prepare.py`.
- `program.md` is the human/agent operating policy.

## Setup checklist (before loop)

1. `cd /Users/openclaw-user/.openclaw/workspace/repos/autoresearch`
2. Ensure deps: `uv sync`
3. Ensure data/tokenizer exist under `~/.cache/autoresearch/`
   - If missing, run: `uv run prepare.py`
4. Create run branch: `git checkout -b autoresearch/<tag>`
5. Initialize `results.tsv` header (if absent):
   - `commit	val_bpb	memory_gb	status	description`

## Single experiment cycle

1. Make one focused change in `train.py`.
2. Commit the change.
3. Run one experiment (redirect all output):
   - `uv run train.py > run.log 2>&1`
4. Parse metrics with script:
   - `python3 skills/autoresearch-lab/scripts/extract_run_metrics.py run.log`
5. Decide:
   - Better `val_bpb` (lower): keep commit.
   - Worse/equal: `git reset --hard <pre-change-commit>`.
   - Crash: log crash row and revert.
6. Append result to `results.tsv` (do not commit this file).

## Run constraints

- Time budget target is 5-minute training, ~10-minute hard cap for full run.
- If run exceeds cap, kill and mark as failure.
- Keep complexity discipline: small, testable changes > sprawling hacks.

## Logging conventions

- `status` must be one of: `keep`, `discard`, `crash`.
- On crash, set `val_bpb=0.000000`, `memory_gb=0.0`.
- `memory_gb = peak_vram_mb / 1024`, round to one decimal.

## Useful commands

```bash
# quick metric peek
grep -E '^val_bpb:|^peak_vram_mb:' run.log

# show traceback on failure
tail -n 80 run.log

# branch safety
git branch --list 'autoresearch/*'
```

## Notes for OpenClaw usage

- Prefer background execution for long runs and report milestones.
- Summarize each run in human-readable form: what changed, metric delta, keep/discard.
- If user asks for overnight mode, confirm stop condition (count/time/manual stop) before starting.
