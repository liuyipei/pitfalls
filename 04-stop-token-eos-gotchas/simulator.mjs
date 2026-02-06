export const MODEL_FIXTURES = {
  Qwen3: {
    eosToken: "<|im_end|>",
    recommendedStops: ["<|im_end|>", "<|tool_end|>"],
    output:
      'Sure — here is your JSON tool call.\n{"name":"search_docs","args":{"q":"stop token mismatch"}}\n<|tool_end|>\nAssistant note: waiting for tool result.\n<|im_end|>',
  },
  "Llama 4": {
    eosToken: "<|eot_id|>",
    recommendedStops: ["<|eot_id|>", "</tool_call>"],
    output:
      '<tool_call>{"name":"get_weather","args":{"city":"Tokyo"}}</tool_call>\nDone.\n<|eot_id|>',
  },
  "DeepSeek-V3": {
    eosToken: "<｜end▁of▁sentence｜>",
    recommendedStops: ["<｜end▁of▁sentence｜>", "<|tool_end|>"],
    output:
      'Action: call_tool\nArguments: {"ticker":"NVDA"}\n<|tool_end|>\nFollow-up explanation that should be cut.\n<｜end▁of▁sentence｜>',
  },
  "Gemma 3": {
    eosToken: "<eos>",
    recommendedStops: ["<eos>", "</function_call>"],
    output:
      '<function_call name="lookup">{"id":42}</function_call>\nAcknowledged.\n<eos>',
  },
};

export const ALL_STOP_OPTIONS = [
  "<|im_end|>",
  "<|tool_end|>",
  "<|eot_id|>",
  "</tool_call>",
  "<｜end▁of▁sentence｜>",
  "<eos>",
  "</function_call>",
  "<|im_end｜>",
  "<|eotid|>",
];

export function parseTokens(input) {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function simulateTruncation(text, stops) {
  let index = -1;
  let matched = null;

  for (const stop of stops) {
    const i = text.indexOf(stop);
    if (i !== -1 && (index === -1 || i < index)) {
      index = i;
      matched = stop;
    }
  }

  if (index === -1) {
    return {
      truncatedText: text,
      didStop: false,
      matched,
      status: "runaway",
    };
  }

  return {
    truncatedText: text.slice(0, index),
    didStop: true,
    matched,
    status: "stopped",
  };
}

export function buildWarnings(model, selectedStops) {
  const fixture = MODEL_FIXTURES[model];
  const warnings = [];
  const missingRecommended = fixture.recommendedStops.filter(
    (tok) => !selectedStops.includes(tok)
  );

  if (!selectedStops.includes(fixture.eosToken)) {
    warnings.push(
      `EOS token ${fixture.eosToken} is missing. Generation may continue into unrelated assistant text.`
    );
  }

  if (missingRecommended.length > 0) {
    warnings.push(
      `Recommended stops missing: ${missingRecommended.join(", ")}. Tool output boundaries may be parsed incorrectly.`
    );
  }

  selectedStops.forEach((stop) => {
    if (!fixture.output.includes(stop)) {
      warnings.push(
        `Stop token ${stop} does not appear in this model fixture output. It will never fire.`
      );
    }

    if (stop.includes("｜") || stop.includes("▁")) {
      warnings.push(
        `${stop} includes fullwidth/sentencepiece symbols. Copy exact bytes from provider docs to avoid lookalike mismatches.`
      );
    }
  });

  return Array.from(new Set(warnings));
}
