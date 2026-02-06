import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MODEL_FIXTURES,
  parseTokens,
  simulateTruncation,
  buildWarnings,
} from './simulator.mjs';

test('parseTokens trims and drops empty values', () => {
  assert.deepEqual(parseTokens(' a, ,b,, c '), ['a', 'b', 'c']);
});

test('simulateTruncation stops at earliest matching token', () => {
  const text = MODEL_FIXTURES.Qwen3.output;
  const result = simulateTruncation(text, ['<|im_end|>', '<|tool_end|>']);

  assert.equal(result.status, 'stopped');
  assert.equal(result.matched, '<|tool_end|>');
  assert.equal(result.didStop, true);
  assert.ok(!result.truncatedText.includes('<|tool_end|>'));
});

test('simulateTruncation reports runaway when no stop matches', () => {
  const text = MODEL_FIXTURES['Llama 4'].output;
  const result = simulateTruncation(text, ['<does_not_exist>']);

  assert.equal(result.status, 'runaway');
  assert.equal(result.didStop, false);
  assert.equal(result.matched, null);
  assert.equal(result.truncatedText, text);
});

test('buildWarnings flags missing EOS/recommended and irrelevant stops', () => {
  const warnings = buildWarnings('Gemma 3', ['<|im_end|>']);

  assert.ok(warnings.some((w) => w.includes('EOS token <eos> is missing')));
  assert.ok(warnings.some((w) => w.includes('Recommended stops missing')));
  assert.ok(
    warnings.some((w) =>
      w.includes('Stop token <|im_end|> does not appear in this model fixture output')
    )
  );
});

test('buildWarnings flags lookalike/sentencepiece token risk', () => {
  const warnings = buildWarnings('DeepSeek-V3', ['<｜end▁of▁sentence｜>']);
  assert.ok(
    warnings.some((w) =>
      w.includes('includes fullwidth/sentencepiece symbols')
    )
  );
});
