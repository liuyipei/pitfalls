# 02 — Tool call format Babel across models

This single-file React demo shows why one tool-call parser breaks when teams switch models.

## Learning outcomes

In under 5 minutes, a user should be able to:

1. Compare the same tool intent as emitted by Qwen3, Llama 4, DeepSeek-V3, and Mistral Large.
2. See why a naive parser that expects only one JSON shape fails.
3. Apply a model-specific extraction step before normalizing to a canonical schema:

```json
{ "name": "...", "args": { }, "call_id": "... or null" }
```

## What the page includes

1. **Setup panel**: model selector + pedagogy flow toggle (raw-first vs canonical-first)
2. **Raw model output panel**: model-native payload fixture
3. **Harness interpretation panel**: parser status + normalized object
4. **Why this fails panel**: one concise pitfall explanation per model
5. **Fix panel**: production-safe normalization pattern
6. **Takeaway checklist**: concrete integration rules

## Notes

- The app intentionally includes a brittle `naiveParser` to show failure modes.
- The per-model adapters are tiny on purpose so teams can port the pattern into any stack.

## Better testing coverage

- Parser fixtures are isolated in `toolParsers.mjs` so they can be tested without rendering React.
- `tests/toolParsers.test.mjs` validates:
  - expected normalization per model,
  - known naive-parser failure modes,
  - error handling for malformed payloads and unknown models.

Run tests with:

```bash
node 02-tool-call-format-babel/tests/toolParsers.test.mjs
```
