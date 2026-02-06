export const PARSERS = [
  { key: "naive", label: "Naive parser (expects first token to be tool call)" },
  { key: "regex", label: "Regex extractor (finds first <tool_call> block)" },
  { key: "state", label: "State-machine parser (ignore <think>, parse structured tags)" },
];

export const OUTPUT_FIXTURES = {
  Qwen3: {
    thinkingOn: `<think>Need weather. I should call the tool with Tokyo.</think>\n<tool_call>{"name":"weather_lookup","arguments":{"city":"Tokyo"}}</tool_call>`,
    thinkingOff: `<tool_call>{"name":"weather_lookup","arguments":{"city":"Tokyo"}}</tool_call>`,
  },
  "DeepSeek-R1": {
    thinkingOn: `<think>Need current conditions; tool usage preferred.</think>\nSure — I will fetch that now.\n<tool_call>{"name":"weather_lookup","arguments":{"city":"Tokyo"}}</tool_call>`,
    thinkingOff: `<tool_call>{"name":"weather_lookup","arguments":{"city":"Tokyo"}}</tool_call>`,
  },
};

export function parseNaive(raw) {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("<tool_call>")) {
    return { ok: false, type: "error", message: "ParserError: Expected <tool_call> at start of output." };
  }

  const end = trimmed.indexOf("</tool_call>");
  if (end === -1) {
    return { ok: false, type: "error", message: "Malformed <tool_call> block." };
  }

  const json = trimmed.slice("<tool_call>".length, end);
  return parseJSONResult(json);
}

export function parseRegex(raw) {
  const match = raw.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
  if (!match) {
    return { ok: false, type: "error", message: "No tool call block found." };
  }
  return parseJSONResult(match[1]);
}

export function parseStateMachine(raw) {
  let i = 0;
  while (i < raw.length) {
    if (raw.startsWith("<think>", i)) {
      const end = raw.indexOf("</think>", i);
      if (end === -1) return { ok: false, type: "error", message: "Malformed <think> block." };
      i = end + "</think>".length;
      continue;
    }

    if (raw.startsWith("<tool_call>", i)) {
      const end = raw.indexOf("</tool_call>", i);
      if (end === -1) return { ok: false, type: "error", message: "Malformed <tool_call> block." };
      const payload = raw.slice(i + "<tool_call>".length, end);
      return parseJSONResult(payload);
    }

    i += 1;
  }

  return { ok: false, type: "error", message: "No tool call found after scanning output." };
}

export function parseJSONResult(payload) {
  try {
    const parsed = JSON.parse(payload);
    return { ok: true, type: "tool_call", data: parsed };
  } catch (e) {
    return { ok: false, type: "error", message: `JSON parse error: ${e.message}` };
  }
}

export function runParser(parserKey, raw) {
  if (parserKey === "naive") return parseNaive(raw);
  if (parserKey === "regex") return parseRegex(raw);
  return parseStateMachine(raw);
}

export function stripThinkBlocks(raw) {
  return raw.replace(/<think>[\s\S]*?<\/think>\n?/g, "");
}
