import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWirePayload, parseHarness, MODEL_RULES } from './logic.mjs';

test('native-system payload keeps separate system and user messages', () => {
  const payload = buildWirePayload('native-system', 'SYS', 'USER');
  assert.deepEqual(payload, {
    messages: [
      { role: 'system', content: 'SYS' },
      { role: 'user', content: 'USER' },
    ],
  });
});

test('preamble payload wraps policy markers in first user message', () => {
  const payload = buildWirePayload('preamble', 'SYS', 'USER');
  assert.equal(payload.messages[0].role, 'user');
  assert.match(payload.messages[0].content, /\[POLICY_START\][\s\S]*\[POLICY_END\]/);
});

test('parseHarness extracts policy from native system messages', () => {
  const parsed = parseHarness({
    messages: [
      { role: 'system', content: 'SYS' },
      { role: 'user', content: 'USER' },
    ],
  });

  assert.equal(parsed.extractedSystem, 'SYS');
  assert.equal(parsed.extractedTask, 'USER');
  assert.equal(parsed.warning, null);
});

test('parseHarness extracts policy block from preamble message', () => {
  const parsed = parseHarness({
    messages: [
      { role: 'user', content: '[POLICY_START]\nSYS\n[POLICY_END]\n\nUSER' },
    ],
  });

  assert.equal(parsed.extractedSystem, 'SYS');
  assert.equal(parsed.extractedTask, 'USER');
  assert.equal(parsed.warning, null);
});

test('parseHarness warns when no system role or policy markers found', () => {
  const parsed = parseHarness({
    messages: [{ role: 'user', content: 'Instruction preface: SYS\n\nUser request: USER' }],
  });

  assert.equal(parsed.extractedSystem, '(none extracted)');
  assert.match(parsed.warning, /did not find a dedicated system role/i);
});

test('every model rule points to a known policy template', () => {
  const knownTemplates = new Set(['native-system', 'preamble', 'no-system']);
  for (const [model, rule] of Object.entries(MODEL_RULES)) {
    assert.ok(knownTemplates.has(rule.policy), `${model} points to an unknown template`);
  }
});
