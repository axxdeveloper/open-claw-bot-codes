---
name: codex-xhigh-switch
description: Correctly use xhigh reasoning with Codex and OpenClaw. Use when users ask to switch to xhigh, troubleshoot xhigh failures, or verify whether xhigh is applied. Clarify that xhigh is reasoning effort (not a model id), then set model + reasoning separately.
---

# Codex xhigh 切換指南

## 核心規則

- 把 `xhigh` 視為**推理強度**，不要當成 model 名稱。
- 先選模型，再指定推理強度：
  - 模型例：`gpt-5.3-codex`
  - 推理強度：`xhigh`（或 OpenClaw 的 `thinking: high`）

## OpenClaw（sessions_spawn）

用這種寫法：

```json
{
  "mode": "run",
  "model": "openai-codex/gpt-5.3-codex",
  "thinking": "high",
  "task": "..."
}
```

不要用這種寫法：

```json
{
  "model": "xhigh"
}
```

## Codex CLI

### 正確

```bash
codex exec -m gpt-5.3-codex --full-auto "your task"
```

若要顯示目前模式，執行後確認輸出裡有：

- `model: gpt-5.3-codex`
- 推理等級為高（例如 `reasoning effort: high` / `xhigh`）

### 錯誤

```bash
codex exec -m xhigh "your task"
```

## 快速驗證（Smoke Test）

1. 先跑最小任務：

```bash
codex exec -m gpt-5.3-codex --full-auto "Reply with exactly: ok"
```

2. 若成功，再跑正式任務。

## 常見失敗原因

- 把 `xhigh` 當成模型 id。
- 子代理路由不穩（可先做 smoke test）。
- 帳號/提供者不支援特定模型（與 xhigh 本身分開看）。

## 回報格式（建議）

- model：`gpt-5.3-codex`
- reasoning：`xhigh/high`
- smoke test：pass/fail
- 正式任務：run id / commit / 輸出檔案
