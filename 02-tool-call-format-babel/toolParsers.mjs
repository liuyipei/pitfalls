export const canonicalIntent = {
  name: 'get_weather',
  args: { city: 'Tokyo', unit: 'celsius' },
  call_id: 'call_42',
};

export const modelFixtures = {
  Qwen3: {
    output: `<tool_call>\n{"name":"get_weather","arguments":{"city":"Tokyo","unit":"celsius"},"id":"call_42"}\n</tool_call>`,
    adapter: (raw) => {
      const match = raw.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/);
      if (!match) throw new Error('No <tool_call> block found.');
      const parsed = JSON.parse(match[1]);
      return {
        name: parsed.name,
        args: parsed.arguments,
        call_id: parsed.id,
      };
    },
    gotcha:
      'Many harnesses assume OpenAI-style `tool_calls` arrays and ignore tag-wrapped JSON.',
    fix: 'Support tagged payload extraction before JSON decode, then normalize to one schema.',
  },
  'Llama 4': {
    output: `Assistant: I will call a tool now.\n<function=get_weather>{"city":"Tokyo","unit":"celsius"}</function>`,
    adapter: (raw) => {
      const match = raw.match(/<function=([^>]+)>([\s\S]*?)<\/function>/);
      if (!match) throw new Error('No <function=...> payload found.');
      return {
        name: match[1],
        args: JSON.parse(match[2]),
        call_id: null,
      };
    },
    gotcha:
      'Name and args are split across tag metadata + inline JSON; naive JSON-first parsers fail.',
    fix: 'Use model-specific extractor for function-tag syntax, then backfill missing call_id.',
  },
  'DeepSeek-V3': {
    output: `{"tool_calls":[{"type":"function","id":"call_42","function":{"name":"get_weather","arguments":"{\\"city\\":\\"Tokyo\\",\\"unit\\":\\"celsius\\"}"}}]}`,
    adapter: (raw) => {
      const parsed = JSON.parse(raw);
      const call = parsed.tool_calls?.[0];
      if (!call) throw new Error('No tool call in `tool_calls[0]`.');
      return {
        name: call.function.name,
        args: JSON.parse(call.function.arguments),
        call_id: call.id,
      };
    },
    gotcha:
      'Arguments can be a JSON string inside a JSON object (double decode required).',
    fix: 'Decode envelope JSON, then decode `function.arguments` string separately.',
  },
  'Mistral Large': {
    output: `[{"name":"get_weather","arguments":{"city":"Tokyo","unit":"celsius"}}]`,
    adapter: (raw) => {
      const parsed = JSON.parse(raw);
      const call = parsed?.[0];
      if (!call) throw new Error('No tool call in top-level array.');
      return {
        name: call.name,
        args: call.arguments,
        call_id: call.id ?? null,
      };
    },
    gotcha:
      'Raw payload may be an array without role/content wrapper; strict chat parsers reject it.',
    fix: 'Allow direct array payloads and normalize absent fields to null/defaults.',
  },
};

export const naiveParser = (raw) => {
  const parsed = JSON.parse(raw);
  const call = parsed.tool_calls?.[0];
  if (!call) throw new Error('Expected OpenAI-style `tool_calls[0]`.');
  return {
    name: call.function.name,
    args: JSON.parse(call.function.arguments),
    call_id: call.id,
  };
};

export const normalizeToolCall = (raw, model) => {
  const fixture = modelFixtures[model];
  if (!fixture) throw new Error(`Unsupported model: ${model}`);
  const parsed = fixture.adapter(raw);
  return {
    name: parsed.name,
    args: parsed.args ?? {},
    call_id: parsed.call_id ?? null,
  };
};
