# 03 — Multi-turn context assembly with/without thinking tokens

This demo shows a subtle but high-impact integration bug: **replaying hidden reasoning (`<think>`-style content) into future turns**.

## Learning objective

In under 5 minutes, a user should be able to:

1. Compare correct vs incorrect context packing side-by-side.
2. See both the **structured message array** and the **final serialized prompt** for each strategy.
3. Understand quality and token-cost impact when thinking text is accidentally retained.
4. Copy a production-safe checklist for history assembly.

## What this app demonstrates

- **Quality-first default**: the recommended path is visually framed as the default.
- **Cost visibility**: both paths show prompt token and estimated input cost.
- **Model fixtures**: Qwen3 and DeepSeek-R1 examples demonstrate the same pitfall in realistic traces.
- **Wire-format clarity**: each strategy exposes role-by-role messages plus flattened prompt preview.

## Correct assembly rule

When building the next request context:

- include: `system`, `user`, and assistant **visible reply text**,
- exclude: assistant hidden reasoning / thinking tokens.

## Running

Mount `App.jsx` into your existing React scaffold (Vite, Next.js client page, etc.) and run your usual dev command.

The file is intentionally self-contained for easy drop-in comparison with other pitfall pages.

## Logic tests (no React runtime required)

Run:

```bash
node --test 03-multiturn-thinking-context/contextAssembly.test.mjs
```

These tests validate the pitfall's core behavior:
- recommended packing excludes `<think>` tokens,
- anti-pattern packing includes `<think>` tokens,
- token estimate increases when hidden thinking is replayed,
- risk labels match the documented policy.
