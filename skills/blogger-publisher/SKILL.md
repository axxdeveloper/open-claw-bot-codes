---
name: blogger-publisher
description: Publish article drafts or public posts to Blogger through the signed-in OpenClaw browser profile. Use when the user asks OpenClaw to post, draft, publish, cross-post, or send an article to Blogger/Blogspot using the currently logged-in Google account, especially for the TodayShip Blogger blog.
---

# Blogger Publisher

Use the existing OpenClaw browser login instead of Google OAuth. The default
target is the signed-in TodayShip Blogger admin page:

- Blog id: `746790007201931785`
- Admin URL: `https://www.blogger.com/blog/posts/746790007201931785`
- Public blog URL: `https://todayshipdoc.blogspot.com/`
- Expected Google account in the browser: `zwl9999999@gmail.com`

## Workflow

1. Create the article title and body as clean Blogger-ready HTML.
2. Run a dry-run check before writing:

   ```bash
   python3 skills/blogger-publisher/scripts/publish_blogger_browser.py --dry-run
   ```

3. Create or update a draft. Prefer draft first unless Isaac explicitly asked to publish immediately:

   ```bash
   python3 skills/blogger-publisher/scripts/publish_blogger_browser.py \
     --title "文章標題" \
     --html-file /path/to/body.html \
     --labels "AI,Backend"
   ```

4. Publish only when the user explicitly asked for public publishing or approved the prepared draft:

   ```bash
   python3 skills/blogger-publisher/scripts/publish_blogger_browser.py \
     --title "文章標題" \
     --html-file /path/to/body.html \
     --labels "AI,Backend" \
     --publish
   ```

5. After a publish attempt, verify the final Blogger result with the browser
   snapshot or the returned URL. Report the title, draft/edit URL, publish
   status, and any blocker.

## Recoverable No-Op Queue Rule

Isaac prefers avoiding empty outcomes. If a Blogger backfill run no-ops only
because another active video/render/upload/TTS/Studio/browser lane owns shared
resources, it should not stop at "no output".

- First check whether an existing retry or the next scheduled Blogger backfill
  run will execute soon enough and is clearly responsible for the same gap.
- If not, create or verify exactly one one-shot retry cron for the Blogger
  backfill, scheduled after the active lane's next safe window.
- Do not stack duplicate retry jobs for the same video/artifact/source.
- The queued retry must rerun the full guard before public action: active-lane
  scan, browser cleanup, account/profile check, dry-run, duplicate Blogger
  article lookup, public video availability, and public-page verification.
- Do not queue blindly when the candidate itself is invalid: unpublished video,
  duplicate Blogger article, weak/unsafe source, account/auth blocker, or
  ambiguous public-publish authorization. Report those as blocked/rejected with
  a concrete reason.
- User-facing no-op reports must say either `queued_retry` /
  `next_scheduled_retry` with the expected time, or why queueing is not safe.

## HTML Rules

- Pass HTML, not Markdown, to the helper. Convert paragraphs to `<p>...</p>`,
  lists to `<ul>/<ol>`, and source links to normal `<a href="...">...</a>`.
- If a visible URL appears in the article body, it must be clickable through an
  `<a href="...">...</a>` anchor. Do not rely on Blogger auto-linking raw
  plaintext URLs.
- Keep inline styles minimal. Blogger handles its own theme styling.
- Preserve source attribution inside the article body when the post is derived
  from an external article, video, report, or paper.
- Do not paste hidden prompts, internal notes, local file paths, private tokens,
  browser logs, or unpublished review notes into the public post.

## Explanation Rules

Use the same "assume the reader does not know this yet" stance as TodayShip
videos.

- The primary purpose of TodayShip Blogger articles is helping a broad public
  audience understand the original source or technical content. Do not open by
  targeting a list of roles such as aspiring engineers, PMs, business owners, or
  teachers. Do not write only for backend specialists or readers who already
  follow TodayShip.
- Treat search, cross-posting, and TodayShip video links as distribution aids,
  not the article's goal. The article should first make the source or technical
  concept understandable in Chinese: source object, plain definition, context,
  mechanism, concrete example, tradeoff/risk, source conclusion, and limitation.
- Before the main explanation, introduce the author, speaker, research group,
  maintainer, or source-owning team when the public source identifies one. Say
  who they are, their role/org/project, and why that background matters to this
  source. For many-author papers, introduce the lead author/research
  group/institution when useful; for release notes, repos, or unsigned company
  posts, introduce the project, maintainer group, or official team. Keep it
  factual and short, and do not invent biographies.
- Isaac's 2026-05-16 direction: Blogger's fuller explanation style is the
  model for TodayShip's technical concept teaching across YouTube, Threads, and
  Blogger. Keep Blogger as the deepest written version: define terms, explain
  mechanism, show a concrete scenario, and name the tradeoff/risk in a way that
  future video scripts and Threads posts can compress.
- The article must stand alone without watching the video or already knowing the
  source topic.
- Before using a core term as a premise, explain what it is in plain Traditional
  Chinese.
- For each important concept, cover what it means, why it matters, how it works,
  one concrete example/scenario, and one tradeoff, failure mode, or practical
  decision implication.
- Do not only translate acronyms, paste benchmark numbers, or summarize the
  conclusion. Turn the source into a from-zero explainer.
- Use short paragraphs and concrete headings. A useful Blogger article should be
  easier to skim than a transcript: readers should quickly find background,
  mechanism, practical impact, limits/risks, and source links.
- For technical posts, include at least one section that maps the concept to a
  backend/AI/debug/architecture workflow. For practical styling posts, include
  concrete examples, visual language, and when the advice does or does not
  apply. Macro/finance/politics articles are not routine 小舟 Blogger topics; if
  Isaac explicitly requests one, define the key indicator or policy mechanism
  before inference and keep the conclusion educational/source-bounded.
- Before Blogger dry-run or public publish, save the generated article HTML and
  run:

  ```bash
  python3 /Users/openclaw-user/.openclaw/workspace/scripts/check_blogger_explainer_article.py <article.html> --require-youtube-url --json-out <run-dir>/blogger-explainer-check.json
  ```

  Treat FAIL as a publish blocker for video-derived Blogger backfills. Repair
  the article until it stands alone with definition, problem/context,
  mechanism, example/scenario, tradeoff/risk, source-backed implication, original
  source URL, and the TodayShip YouTube URL. For non-video standalone Blogger
  posts, omit `--require-youtube-url` but still require the explainer sections
  and original source URL.

## Blog-First Source Explainers

Use this lane when a strong original source has durable/search value, needs more
Chinese explanation than a single Threads source-intro can provide, or is
video-worthy but cannot get a video slot yet because video volume is limited.

- Write one standalone Blogger article for one main original source. The article
  should help readers understand the source's technical idea in Chinese, not
  advertise TodayShip.
- Do not frame blog-first as "not worth a video." It can be an earlier or
  lighter-weight comprehension layer for good sources that may later become
  videos.
- Treat readers who read English slowly as a core audience. Summarize and
  explain the English source faithfully enough that they can roughly understand
  the main technical idea, the evidence boundary, and whether to read the
  original source in full.
- Preserve the original source URL visibly in the article. If there is no
  TodayShip video, do not manufacture a video section or require a YouTube URL.
- Use the same broad-audience explanation target as above: define terms from
  zero, explain why the mechanism matters, show a realistic software-building or
  AI-evaluation scenario, and name the practical tradeoff or failure mode.
- Before Blogger dry-run or public publish, run
  `scripts/check_blogger_explainer_article.py` without `--require-youtube-url`
  and require PASS. If the checker is too narrow for a new source type, add a
  local review note that explicitly verifies definition, context, mechanism,
  example, tradeoff/risk, source-backed implication, and source credit.
- After public verification, a separate Threads post may share the Blogger
  article as a Chinese explainer. This is a distinct blog-first share, not a
  routine source-intro post.

## Public Persona Tone

The TodayShip public avatar is an original illustrated female persona. Blogger
articles should write with a clear, warm, female-feeling Taiwan Mandarin voice:

- sound approachable, thoughtful, and helpful, not stiff or corporate
- keep technical explanations precise and credible; do not make the article cute
  at the cost of clarity
- use gentle first-person phrasing when natural, such as `我會這樣看` or `這裡
  先抓住一件事`
- do not claim real personal experiences, biography, identity, or credentials
  for the avatar
- avoid gender stereotypes, flirtation, pickup framing, or pretending to be a
  real human woman

## TodayShip Video-to-Article Rules

When Isaac asks to turn TodayShip videos into Blogger posts, use already-public
YouTube videos and local article-video artifacts as the source of truth.

- Write one Blogger article for one public video. Do not make roundups.
- Use the video topic as the article topic, but rewrite the title for search and
  engineering-learner readability when helpful.
- The article should not be a raw transcript. It should be an article a reader
  can search for and read to understand the source:
  - what the topic/source object is, assuming the reader starts from zero
  - what problem the topic addresses
  - why this source exists now
  - the core mechanism or concept
  - source-backed implications
  - tradeoffs, limitations, or risks
  - link to the TodayShip YouTube video
  - explicit credit to the original article/video/paper/repo/release source
- Preserve the original source URL visibly in the article. Label it as
  `文章來源` or `影片來源` depending on the source type.
- Link to the public YouTube video, but do not present TodayShip as the original
  source when the video was derived from another article, paper, repo, release,
  or interview.
- If the source video was too short or high-level, do not mirror that weakness.
  Use the original source and local artifact notes to expand the explanation so
  the Blogger article repairs the missing concept detail.
- Prefer labels such as `Backend`, `AI`, `Database`, `Infrastructure`,
  `Observability`, `Security`, `Architecture`, or source-specific labels.

## Writing Quality Learning

Use Blogger publishing gaps to learn how to write better articles, not only to
mirror videos.

For each article, leave a local note under
`reports/blogger-publishing/YYYY-MM-DD/` with:

- source video URL and original source URL
- target search intent: what a reader might type when trying to understand this
  source, term, release, paper, or interview
- title choice and why it is searchable
- one-sentence source-understanding value
- source-credit check result
- readability check: headings, short paragraphs, no unexplained jargon
- beginner explanation check: each key concept says what it is, why it matters,
  how it works, and a concrete example or failure mode
- improvement note for the next Blogger article

Judge improvement with local evidence first:

- the public post has a clear title and first paragraph
- source credit is visible and correct
- article can stand alone without watching the video
- article does not assume the reader already understands core terms or source
  context
- a reader can identify the source object, core mechanism, source-backed
  conclusion, important limitation, and at least one technical tradeoff after
  reading

## Cross-Surface Link Record

Blogger articles are no longer auto-shared in Threads source-intro posts. Keep
the cross-surface record reliable for bookkeeping, dedupe, and internal
comprehension context only:

- Write `publish-result.json` under
  `reports/blogger-publishing/YYYY-MM-DD/<artifact-basename>/` whenever possible,
  using the same basename as the source article-video artifact.
- Include a verified public article URL as `public_url`; if the helper nests it,
  also keep it under `public_verification.public_url`.
- Include the original source URL as `source_url` or `original_source_url`.
- Include the TodayShip video URL as `video_url` or `source_video_url` when the
  article is derived from a video.
- Only treat the article as verified internal context after public-page
  verification passes or returns a successful HTTP status.
- Do not treat `publish-result.json` as permission to add the Blogger URL to a
  Threads source-intro post. Threads should keep only the original source URL
  and optional TodayShip YouTube note.

## Safety

- The helper uses the visible signed-in Blogger UI. If the browser is logged out
  or on a different account, stop and ask Isaac to sign in again.
- Default mode creates a draft. `--publish` is the only mode that clicks the
  public publish flow.
- If Blogger shows an unexpected confirmation dialog, CAPTCHA, account switcher,
  policy warning, or permissions error, stop after the first failed attempt and
  report the blocker. Do not keep clicking publish.
- When the user asks for "發表" and the context is ambiguous, create a draft and
  ask for publish confirmation unless the user clearly asked for public publish.
