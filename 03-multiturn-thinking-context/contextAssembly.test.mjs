import test from "node:test";
import assert from "node:assert/strict";

import {
  MODEL_FIXTURES,
  buildPackedContext,
  estimateTokens,
  scoreQualityRisk,
  serializePrompt,
} from "./contextAssembly.mjs";

test("recommended packing excludes <think> spans", () => {
  const turns = MODEL_FIXTURES.qwen3.turns;
  const packed = buildPackedContext(turns, false);
  const prompt = serializePrompt(packed);

  assert.equal(prompt.includes("<think>"), false);
  assert.equal(prompt.includes("</think>"), false);
});

test("incorrect packing includes <think> spans", () => {
  const turns = MODEL_FIXTURES.qwen3.turns;
  const packed = buildPackedContext(turns, true);
  const prompt = serializePrompt(packed);

  assert.equal(prompt.includes("<think>"), true);
  assert.equal(prompt.includes("</think>"), true);
});

test("incorrect packing has higher token estimate for each fixture", () => {
  for (const fixture of Object.values(MODEL_FIXTURES)) {
    const correct = serializePrompt(buildPackedContext(fixture.turns, false));
    const incorrect = serializePrompt(buildPackedContext(fixture.turns, true));

    assert.ok(
      estimateTokens(incorrect) > estimateTokens(correct),
      `Expected incorrect path to have higher token count for ${fixture.label}`,
    );
  }
});

test("quality risk labels match expected policy", () => {
  assert.equal(scoreQualityRisk(false).label, "Low risk");
  assert.equal(scoreQualityRisk(true).label, "High risk");
});
