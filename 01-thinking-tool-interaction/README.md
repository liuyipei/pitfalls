# 01 — Thinking mode × tool calling interaction

This demo reproduces one of the most common integration failures with reasoning-capable open models:

- Harness expects tool call or JSON at token 1.
- Model emits `<think>...</think>` (or other preamble text) first.
- Naive parser crashes even though a valid tool call is present later in the output.

## Learning outcomes

In under 5 minutes, you should be able to:

1. Reproduce parser failure by enabling thinking mode.
2. Compare parser robustness levels (naive vs regex vs state-machine).
3. Apply a production-safe parsing strategy.

## How to use the page

1. Choose a model fixture (`Qwen3` or `DeepSeek-R1`).
2. Keep parser on **Naive parser**.
3. Toggle **Thinking mode enabled** on and off.
4. Notice:
   - Thinking off → parse succeeds.
   - Thinking on → naive parser fails.
5. Switch parser strategy to **State-machine parser** and verify stability with thinking on.

## Practical guidance

- Treat `<think>` and narrative text as non-authoritative routing content.
- Parse structured actions only after robust boundary detection.
- Keep strict JSON parsing for final tool payload validation.
- Log raw output + parsed action together for incident debugging.
