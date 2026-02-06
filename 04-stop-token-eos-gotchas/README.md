# 04 — Stop token / EOS mismatch

This single-file React app demonstrates a high-frequency integration bug: your harness sets the wrong stop tokens for a model, so generation either:

- never stops when it should (runaway output), or
- stops on the wrong boundary (tool payload gets truncated too early).

## Learning outcomes

In under 5 minutes, you should be able to:

1. See model-specific EOS/stop differences across Qwen3, Llama 4, DeepSeek-V3, and Gemma 3.
2. Reproduce runaway generation with a deterministic fixture by removing the correct EOS token.
3. Recognize lookalike-token issues (e.g., fullwidth separators and sentencepiece symbols).
4. Apply a safer production pattern: model-profiled stop lists with validation.

## What to look at in the UI

1. **Setup panel**
   - Model selector
   - Structured stop-token picker (with model-recommended tokens marked)
   - Optional free-text stop token field

2. **Raw model output panel**
   - Canonical deterministic fixture for each model

3. **Harness interpretation panel**
   - Effective active stops
   - Which stop token actually matched (if any)
   - Truncated output sent to downstream parser

4. **Why this fails panel**
   - Missing EOS warnings
   - Non-matching stop warnings
   - Unicode lookalike warnings

5. **Fix panel**
   - Config snippet showing per-model stop profile

6. **Takeaway checklist**
   - 5 production rules to copy into real integrations

## Local verification

Run deterministic logic tests for stop parsing, truncation behavior, and warning diagnostics:

```bash
node --test 04-stop-token-eos-gotchas/simulator.test.mjs
```
