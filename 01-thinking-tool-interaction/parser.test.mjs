import test from "node:test";
import assert from "node:assert/strict";

import {
  OUTPUT_FIXTURES,
  parseNaive,
  parseRegex,
  parseStateMachine,
  runParser,
  stripThinkBlocks,
} from "./parser.mjs";

test("naive parser fails when thinking preamble appears first", () => {
  const result = parseNaive(OUTPUT_FIXTURES.Qwen3.thinkingOn);
  assert.equal(result.ok, false);
  assert.match(result.message, /Expected <tool_call>/);
});

test("naive parser succeeds when thinking mode is off", () => {
  const result = parseNaive(OUTPUT_FIXTURES.Qwen3.thinkingOff);
  assert.equal(result.ok, true);
  assert.equal(result.data.name, "weather_lookup");
  assert.equal(result.data.arguments.city, "Tokyo");
});

test("regex parser extracts tool call after think + narrative text", () => {
  const result = parseRegex(OUTPUT_FIXTURES["DeepSeek-R1"].thinkingOn);
  assert.equal(result.ok, true);
  assert.equal(result.data.name, "weather_lookup");
});

test("state-machine parser handles interleaved text and think block", () => {
  const result = parseStateMachine(OUTPUT_FIXTURES["DeepSeek-R1"].thinkingOn);
  assert.equal(result.ok, true);
  assert.deepEqual(result.data.arguments, { city: "Tokyo" });
});

test("state-machine parser reports malformed think block", () => {
  const result = parseStateMachine("<think>open block only");
  assert.equal(result.ok, false);
  assert.match(result.message, /Malformed <think> block/);
});

test("all parsers return JSON errors when payload is invalid", () => {
  const bad = '<tool_call>{"name":}</tool_call>';
  for (const parserKey of ["naive", "regex", "state"]) {
    const result = runParser(parserKey, bad);
    assert.equal(result.ok, false);
    assert.match(result.message, /JSON parse error/);
  }
});

test("stripThinkBlocks removes think content and preserves tool call", () => {
  const input = OUTPUT_FIXTURES.Qwen3.thinkingOn;
  const stripped = stripThinkBlocks(input);
  assert.doesNotMatch(stripped, /<think>/);
  assert.match(stripped, /<tool_call>/);
});
