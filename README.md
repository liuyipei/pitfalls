# LLM Integration Pitfalls (2025–2026)

This repository is a practical learning lab: each folder contains a **single-file React app** that demonstrates one high-impact integration pitfall with modern open models (Qwen3, Llama 4, DeepSeek-R1/V3, Gemma 3, Mistral Large, Command-A, Phi-4).

The goal is not abstract theory. The goal is to help engineers quickly answer:

- “Why did my agent/parser break?”
- “What does this model actually emit?”
- “What should I change in my harness?”

---

## Proposed organization and prioritization

I agree with your prioritization and narrative arc. The top 3 are exactly where people lose the most time today.

### Tier 1 (build first): highest practical leverage

1. **Thinking mode × tool calling interaction**
   - Focus models: Qwen3, DeepSeek-R1
   - Why first: common hard failure mode (parser expects JSON/tool call, gets `<think>` first)
   - Interactive objective: show same prompt with thinking on/off and parser outcomes
   - Key design questions:
     1) Should users see a **single parser strategy** or compare multiple parser strategies?
        - Option A: one “recommended” robust parser only
        - Option B: naive parser vs regex parser vs state-machine parser
        - **Recommendation:** Option B for pedagogy (show failure progression), then highlight one production default.
     2) Should `<think>` content be displayed by default?
        - Option A: hidden by default, reveal toggle
        - Option B: always visible with warning styling
        - **Recommendation:** Option A to reduce noise for first-time users while still teaching the gotcha.

2. **Tool call format Babel across models**
   - Focus models: Qwen3, Llama 4, DeepSeek-V3, Mistral Large
   - Why second: most common multi-model agent compatibility issue
   - Interactive objective: one canonical tool intent rendered in each model’s syntax + normalization step
   - Key design questions:
     1) Should the page start from **model-native syntax** or from a **canonical intermediate schema**?
        - Option A: start with each raw model output and then normalize
        - Option B: start with canonical schema and “compile” to model-specific syntax
        - **Recommendation:** Option A first (matches real debugging workflow), then show Option B as architecture guidance.
     2) Should the output target one unified tool schema or multiple adapter profiles?
        - Option A: single normalized schema (name, args, call_id)
        - Option B: schema presets per runtime (LangChain, custom, OpenAI-compatible)
        - **Recommendation:** Option A in v1 for clarity; add Option B later as advanced mode.

3. **Multi-turn context assembly with/without thinking tokens**
   - Focus models: Qwen3, DeepSeek-R1
   - Why third: less visible than parser crashes, but big quality/cost regression if wrong
   - Interactive objective: side-by-side “correct vs incorrect” conversation packing and token impact
   - Key design questions:
     1) Should comparison optimize for **quality** or **token cost** in the UI default?
        - Option A: quality-first default with cost shown second
        - Option B: cost-first default with quality shown second
        - **Recommendation:** Option A because users misdiagnose quality drops more than raw token growth.
     2) Should context assembly be shown as final prompt string or structured message array?
        - Option A: final serialized prompt only
        - Option B: role-by-role message array + serialized preview
        - **Recommendation:** Option B to map directly to real chat API integrations.

### Tier 2 (build next): frequent production misconfiguration

4. **Stop token / EOS mismatch**
   - Focus models: Qwen3, Llama 4, DeepSeek-V3, Gemma 3
   - Interactive objective: simulator for stop-sequence config and runaway output behavior
   - Key design questions:
     1) Should we simulate **deterministic fixtures** or stochastic generation traces?
        - Option A: deterministic fixtures with known failure outcomes
        - Option B: pseudo-random traces to mimic real generation variability
        - **Recommendation:** Option A for reliability and reproducibility.
     2) Should stop token config be edited as free text or structured controls?
        - Option A: free-text list field
        - Option B: model-aware token picker + validation warnings
        - **Recommendation:** Option B to surface gotchas (e.g., fullwidth-token mismatches) early.

5. **System prompt role handling differences**
   - Focus models: Gemma 3, Llama 4, Qwen3, Command-A
   - Interactive objective: “what you wrote” vs “what model actually receives” visualizer
   - Key design questions:
     1) Should we present this as role-mapping theory or “wire-format diff”?
        - Option A: conceptual explanation cards only
        - Option B: side-by-side diff of user intent vs actual payload per model
        - **Recommendation:** Option B; concrete payloads are faster to internalize.
     2) Should recommendations be strict per-model rules or policy templates?
        - Option A: hardcoded model rules
        - Option B: reusable policy templates (e.g., no-system, preamble, native-system)
        - **Recommendation:** Option B so teams can apply logic to new models later.

### Tier 3 (still valuable, optional follow-up)

6. **Streaming + parser robustness under mixed content**
   - Focus models: Qwen3 + any model with tool calls
   - Why add this: many real failures happen only in stream mode (partial tags, interleaved text)
   - Interactive objective: token-by-token stream playback, then robust extraction strategy
   - Key design questions:
     1) Should the stream replay be real-time or step-through?
        - Option A: live playback with speed slider
        - Option B: token/chunk step-through debugger
        - **Recommendation:** Offer both, default to Option B for learning precision.
     2) Should extraction happen incrementally or only after completion in the demo?
        - Option A: end-of-stream parse only
        - Option B: incremental parse with partial-confidence states
        - **Recommendation:** Option B to reflect production agent behavior and failure modes.

---

## Folder plan (single-file React per pitfall)

```text
/01-thinking-tool-interaction
/02-tool-call-format-babel
/03-multiturn-thinking-context
/04-stop-token-eos-gotchas
/05-system-prompt-handling
/06-streaming-parser-robustness   (recommended addition)
```

Each folder should contain:

- `App.jsx` (single-file React demo)
- `README.md` (what this pitfall is + expected learning outcomes)
- Optional static fixtures (small JSON/text samples)

---

## Global pedagogy reminders

- **Keep it visual-first.** Prefer side-by-side comparisons, diffs, timelines, token/chunk playback, color-coded states, and failure highlights over long prose.
- **Teach vocabulary explicitly.** Every page should define terms users will see in docs/logs (e.g., *thinking mode*, *tool call*, *stop token*, *EOS*, *preamble*, *wire format*, *adapter*) using plain-language tooltips or a mini glossary.
- **Pair terms with examples.** When introducing a term, show one concrete raw snippet and one normalized interpretation.

## Design standard for each interactive page

Each app should use the same pedagogical structure:

1. **Setup panel**
   - model selector
   - toggles (thinking on/off, streaming, etc.)
   - parser/harness assumptions

2. **Raw model output panel**
   - syntax-highlighted output exactly as returned

3. **Harness interpretation panel**
   - what parser extracts (tool call, JSON, plain text)
   - explicit error state when assumptions fail

4. **“Why this fails” panel**
   - concise explanation of the confusion pattern

5. **“Fix” panel**
   - production-safe parsing/routing strategy
   - recommended config snippets (stop tokens, role mapping, etc.)

6. **Takeaway checklist**
   - 3–5 concrete rules to copy into real systems

---

## Suggested first implementation order

1. `01-thinking-tool-interaction`
2. `02-tool-call-format-babel`
3. `03-multiturn-thinking-context`
4. `04-stop-token-eos-gotchas`
5. `05-system-prompt-handling`
6. `06-streaming-parser-robustness`

This preserves your “problem → complication → consequence” narrative while quickly delivering high practical value.

---

## What I would add (in addition)

I’d add exactly one item to the core roadmap:

- **Streaming parser robustness** (Tier 3 above), because teams often test on non-streaming completions but deploy with streaming enabled, where malformed partial tags and boundary timing create new failure classes.

If you want, we can also add a small “meta” utility page later:

- **Model adapter contract tester** (input prompt + expected structured action, run against adapters, validate normalized output schema).

---

## Success criteria for this repository

A pitfall page is “done” when a user can, in under 5 minutes:

- reproduce the failure,
- understand why it happened,
- apply a concrete fix in their own harness.

That should be the bar for every folder.

---

## Implemented demo

- `04-stop-token-eos-gotchas` — deterministic stop/EOS mismatch simulator with model-aware token picker and validation warnings.


## Run in a browser without shell commands

If you want non-technical users to open this directly in a browser, the most practical approach is to publish the built static site to **GitHub Pages** (or Netlify/Vercel static hosting).

This repository now includes a Vite entrypoint (`index.html` + `src/PitfallsBrowserApp.jsx`) that provides one landing page for all five implemented demos and a placeholder for the sixth.

### Local development (for maintainers)

```bash
npm install
npm run dev
```

### Production static build

```bash
npm run build
```

Upload the generated `dist/` folder to any static host. End users then only need a URL and a browser.

### Browser-shell regression test coverage

Run `npm test` to validate both domain logic and browser-shell routing helpers (demo IDs, hash resolution, share-link generation).

### GitHub Pages quick setup

1. Push this repository to GitHub.
2. In **Settings → Pages**, enable deployment from GitHub Actions.
3. Add a workflow that runs `npm ci && npm run build` and publishes `dist/`.
4. Share the Pages URL with users.
