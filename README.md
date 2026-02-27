# open-claw-bot-codes

## Google Docs Tab Tools

These scripts provide utilities to list/create/write Google Docs tabs using the Google Docs API.

### Included scripts

- `scripts/google_docs_tab_write.py`
  - list tabs: `--list-tabs`
  - write to one tab by `--tab-title` or `--tab-id`
  - modes: `--mode replace|append`
- `scripts/google_docs_update_four_tabs.py`
  - one-shot update for 4 tabs: 最近行程 / AI 新聞 / 美股 / 台股
- `scripts/google_docs_create_tab_mvt.py`
  - minimal test for creating a new tab
- `scripts/google_docs_tab_write_mvt.py`
  - minimal test for verifying writes only affect target tab

### Requirements

- Python 3.9+
- `gog` CLI installed and authenticated (`gog auth login`)
- Google Docs API access with a valid Doc ID

### Quick usage

```bash
python3 scripts/google_docs_tab_write.py --help
python3 scripts/google_docs_update_four_tabs.py --help
python3 scripts/google_docs_create_tab_mvt.py --help
python3 scripts/google_docs_tab_write_mvt.py --help
```
