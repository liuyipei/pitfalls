import test from "node:test";
import assert from "node:assert/strict";
import { buildShareUrlFromLocation, DEMO_IDS, resolveInitialDemoId } from "./pitfallsConfig.mjs";

test("DEMO_IDS includes all six roadmap IDs in order", () => {
  assert.deepEqual(DEMO_IDS, [
    "01-thinking-tool-interaction",
    "02-tool-call-format-babel",
    "03-multiturn-thinking-context",
    "04-stop-token-eos-gotchas",
    "05-system-prompt-handling",
    "06-streaming-parser-robustness",
  ]);
});

test("resolveInitialDemoId accepts a valid hash", () => {
  assert.equal(resolveInitialDemoId("#04-stop-token-eos-gotchas"), "04-stop-token-eos-gotchas");
});

test("resolveInitialDemoId falls back when hash is unknown", () => {
  assert.equal(resolveInitialDemoId("#unknown-demo"), "01-thinking-tool-interaction");
});

test("buildShareUrlFromLocation builds stable hash URL", () => {
  const locationLike = { origin: "https://example.com", pathname: "/pitfalls/" };
  assert.equal(
    buildShareUrlFromLocation(locationLike, "02-tool-call-format-babel"),
    "https://example.com/pitfalls/#02-tool-call-format-babel"
  );
});

test("buildShareUrlFromLocation returns empty string for incomplete data", () => {
  assert.equal(buildShareUrlFromLocation({}, "02-tool-call-format-babel"), "");
  assert.equal(buildShareUrlFromLocation({ origin: "https://example.com", pathname: "/pitfalls/" }, ""), "");
});
