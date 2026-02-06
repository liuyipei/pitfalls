import assert from 'node:assert/strict';
import {
  canonicalIntent,
  modelFixtures,
  naiveParser,
  normalizeToolCall,
} from '../toolParsers.mjs';

const expectedByModel = {
  Qwen3: canonicalIntent,
  'Llama 4': { name: 'get_weather', args: { city: 'Tokyo', unit: 'celsius' }, call_id: null },
  'DeepSeek-V3': canonicalIntent,
  'Mistral Large': { name: 'get_weather', args: { city: 'Tokyo', unit: 'celsius' }, call_id: null },
};

for (const [model, fixture] of Object.entries(modelFixtures)) {
  const normalized = normalizeToolCall(fixture.output, model);
  assert.deepEqual(normalized, expectedByModel[model], `${model} should normalize to canonical schema`);
}

assert.throws(() => naiveParser(modelFixtures.Qwen3.output), /Unexpected token|Expected OpenAI-style/);
assert.throws(() => naiveParser(modelFixtures['Llama 4'].output), /Unexpected token|Expected OpenAI-style/);

const deepSeekResult = naiveParser(modelFixtures['DeepSeek-V3'].output);
assert.deepEqual(deepSeekResult, canonicalIntent, 'naive parser should parse DeepSeek fixture');

assert.throws(() => normalizeToolCall('[]', 'Qwen3'), /No <tool_call> block found/);
assert.throws(() => normalizeToolCall('{}', 'UnknownModel'), /Unsupported model/);

console.log('All parser fixture tests passed.');
