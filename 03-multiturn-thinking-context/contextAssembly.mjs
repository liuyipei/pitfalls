export const MODEL_FIXTURES = {
  qwen3: {
    label: "Qwen3",
    notes:
      "Qwen3 can emit explicit reasoning spans when thinking mode is enabled. These spans should not be replayed back as assistant-visible context.",
    turns: [
      {
        role: "system",
        content:
          "You are a production reliability copilot. Prefer concise diagnostics and concrete next steps.",
      },
      {
        role: "user",
        content: "Our API p95 jumped from 420ms to 980ms after a deploy. Where should I start?",
      },
      {
        role: "assistant",
        content:
          "Start with change diff + saturation checks: error rate, CPU, DB queue depth, and downstream latency. Compare before/after deploy windows.",
        thinking:
          "Need to suggest quick triage sequence. Mention golden signals and deploy correlation; avoid overlong explanation.",
      },
      {
        role: "user",
        content: "DB queue depth doubled and one endpoint now does 2 extra joins. Give me an immediate mitigation plan.",
      },
      {
        role: "assistant",
        content:
          "Mitigate in this order: 1) rollback endpoint change, 2) cap concurrency on affected route, 3) add temporary cache on hot query, 4) verify p95 + error budget recovery.",
        thinking:
          "Keep answer procedural. If context includes this hidden rationale in future turns, model may anchor on internal notes.",
      },
    ],
  },
  deepseekR1: {
    label: "DeepSeek-R1",
    notes:
      "DeepSeek-R1 often returns substantial internal reasoning text. Incorrect history packing causes token blow-up and can degrade response focus.",
    turns: [
      {
        role: "system",
        content: "You are an incident commander assistant. Be direct, risk-ranked, and action-first.",
      },
      {
        role: "user",
        content: "Our retrieval pipeline started returning stale chunks. What is the most likely root cause category?",
      },
      {
        role: "assistant",
        content:
          "Most likely category: index refresh or sync lag between write path and vector store read replicas.",
        thinking:
          "Consider ingestion race conditions, TTL invalidation, replica lag, and eventual consistency timelines. Prioritize by recent deploys and queue health.",
      },
      {
        role: "user",
        content: "Given that write queue lag is 18 minutes, draft a customer-safe status update.",
      },
      {
        role: "assistant",
        content:
          "We identified delayed indexing affecting freshness for a subset of results. We are processing backlog now and monitoring recovery; no data loss is expected.",
        thinking:
          "Must remain calm and avoid admitting uncertain scope. Mention mitigation + monitoring.",
      },
    ],
  },
};

export const TOKEN_RATIO = 4;
export const PRICE_PER_1K = 0.0025;

export function estimateTokens(text) {
  return Math.ceil(text.length / TOKEN_RATIO);
}

export function formatUsd(value) {
  return `$${value.toFixed(4)}`;
}

export function buildPackedContext(turns, includeThinking) {
  return turns.map((turn, index) => {
    if (turn.role !== "assistant") {
      return {
        ...turn,
        id: index,
      };
    }

    const content = includeThinking && turn.thinking
      ? `${turn.content}\n\n<think>${turn.thinking}</think>`
      : turn.content;

    return {
      id: index,
      role: turn.role,
      content,
      hasThinking: Boolean(turn.thinking),
    };
  });
}

export function serializePrompt(messages) {
  return messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");
}

export function scoreQualityRisk(includeThinking) {
  return includeThinking
    ? {
        label: "High risk",
        reason:
          "Hidden reasoning is replayed as visible assistant context, so future generations may overfit or leak private chain-of-thought style content.",
      }
    : {
        label: "Low risk",
        reason:
          "Only user-visible assistant replies are packed. This preserves turn intent without contaminating future responses with internal reasoning traces.",
      };
}
