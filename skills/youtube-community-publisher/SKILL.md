---
name: youtube-community-publisher
description: Prepare or publish source-first YouTube Community Posts for TodayShip through the signed-in OpenClaw browser profile. Use when verifying Posts access, drafting source-intro community posts, or recording YouTube Community post URLs.
---

# YouTube Community Publisher

Use the signed-in OpenClaw browser profile and the TodayShip YouTube channel.

- Expected Google account: `zwl9999999@gmail.com`
- Browser profile: managed OpenClaw Chrome `Profile 2`
- Public persona: `小舟 | TodayShip`
- Ledger: `reports/youtube-community-source-intros/posted-sources.jsonl`

## Platform Facts

Official YouTube Help checked on 2026-05-29:

- Posts can be text, image, GIF, video, poll, quiz, or music posts.
- Posts may appear on the channel Home/Posts surfaces, viewer home, subscriptions feed, and some image posts may appear in Shorts feed.
- Posts are unavailable for supervised accounts and channels set as Made for Kids.
- YouTube limits how many posts a channel can create in a 24-hour period.
- Posts are managed in YouTube Studio under Content -> Posts.

Primary docs:

- `https://support.google.com/youtube/answer/9409631`
- `https://support.google.com/youtube/answer/7124474`
- `https://support.google.com/youtube/answer/15739414`

## Source-Intro Scope

YouTube Community source-intro posts use 小舟's routine source-introduction scope:

- Allowed: technical, AI, backend/software, and engineering-company/operator sources.
- Do not intentionally use other topic types as filler.
- Use an original public source as the main subject. Source-watch, HN, Isaac Note, local reports, Blogger articles, and TodayShip videos are context, not the main source.
- `source.json.topic_domain` must be `technical`; put finer labels such as `backend_database`, `ai_agents`, `infra_sre`, or `operator_interview` in `topic_subdomain`.
- Default routine source-intro posts do not append Blogger/Blogspot links.
- Exception from Isaac on 2026-05-31: when a TodayShip Blogger article has been published, a YouTube Community blog cross-post may include the Blogger URL as the Chinese explainer link, while still including the original source URL and keeping the original source as the factual subject.
- If a TodayShip video already exists for the same source, add only a small final note with the YouTube URL.

Posts should help viewers understand one source-backed idea, conclusion,
limitation, or implication. Do not publish teasers that only say a source is
interesting.

## Cadence And Safety

- Conservative default: at most 3 source-intro posts per day, at least 2 hours apart.
- Skip when a video render/upload/TTS/YouTube Studio/public verification lane is active, or when browser/account/Profile 2 health is uncertain.
- Stop for the day after any YouTube Studio account, Posts access, composer, quota/rate-limit, or browser automation anomaly.
- The first run after setup should verify Posts access only. Public posting starts only after a PASS access artifact exists.

## Draft Gate

Before opening a YouTube composer, save the draft as `draft.txt` and run both
checks:

```bash
python3 /Users/openclaw-user/.openclaw/workspace/scripts/check_youtube_community_source_intro_scope.py \
  draft.txt \
  --source-json source.json \
  --posted-ledger /Users/openclaw-user/.openclaw/workspace/reports/youtube-community-source-intros/posted-sources.jsonl \
  --json-out youtube-community-scope-check.json

python3 /Users/openclaw-user/.openclaw/workspace/scripts/check_youtube_community_source_intro_explainer.py \
  draft.txt \
  --json-out youtube-community-explainer-check.json
```

For a blog cross-post, run the explainer checker with
`--allow-blogger-crosspost`.

Both must PASS.

The draft must include:

- 3-6 short readable blocks.
- The source object or core term in plain language.
- One compact mechanism, boundary, or limitation.
- One source-backed conclusion, result, change, implication, or failure mode.
- The original source URL on its own raw line.
- For a blog cross-post only: the Blogger URL on its own raw line, clearly framed
  as 小舟's Chinese explainer article rather than the primary source.
- Optional TodayShip video note with the raw YouTube URL on its own line.

Avoid question-framed takeaways such as `先問...`; state the signal, mechanism,
metric, boundary, or conclusion directly.

## Browser Workflow

1. Run active-lane and cleanup checks:

   ```bash
   python3 /Users/openclaw-user/.openclaw/workspace/scripts/check_browser_playwright_cleanup.py --strict
   python3 /Users/openclaw-user/.openclaw/workspace/scripts/assert_google_profile.py --profile "Profile 2" --json
   ```

2. Verify Posts access without publishing:
   - Open YouTube Studio with the managed browser profile.
   - Confirm the account/channel context is TodayShip / `zwl9999999@gmail.com`.
   - Confirm Content -> Posts is available or YouTube Create -> Create post opens the post composer.
   - Record the result under `reports/youtube-community-source-intros/YYYY-MM-DD/posts-access-check-<HHMM>.json`.

3. Publish only after gates and access check pass:
   - Re-check the ledger immediately before clicking Post.
   - Paste the approved draft.
   - Click Post once.
   - Verify the public post URL from the channel Posts tab or Studio Content -> Posts.
   - Append one JSONL record to the ledger:
     `date`, `source_url`, `youtube_community_url`, `artifact_dir`, `run_dir`,
     `topic`, `angle`, `youtube_url`, `status`.

4. Cleanup:
   - Close task-only tabs/contexts.
   - Run `check_browser_playwright_cleanup.py --strict`.

## Final Report

Report:

- status: `published_public_verified`, `access_verified_pending_next_slot`, `no_op`, or `blocked`
- source URL
- YouTube Community post URL when published
- optional TodayShip video URL
- gate results
- access/public verification status
- cleanup status
- next scheduled retry when recoverable
