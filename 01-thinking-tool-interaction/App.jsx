import React, { useMemo, useState } from "react";

const MODELS = ["Qwen3", "DeepSeek-R1"];
const PARSERS = [
  { key: "naive", label: "Naive parser (expects first token to be tool call)" },
  { key: "regex", label: "Regex extractor (finds first <tool_call> block)" },
  { key: "state", label: "State-machine parser (ignore <think>, parse structured tags)" },
];

const PROMPT = `You can call tools. If needed, call weather_lookup with {"city":"Tokyo"}.`;

const OUTPUT_FIXTURES = {
  Qwen3: {
    thinkingOn: `<think>Need weather. I should call the tool with Tokyo.</think>\n<tool_call>{"name":"weather_lookup","arguments":{"city":"Tokyo"}}</tool_call>`,
    thinkingOff: `<tool_call>{"name":"weather_lookup","arguments":{"city":"Tokyo"}}</tool_call>`,
  },
  "DeepSeek-R1": {
    thinkingOn: `<think>Need current conditions; tool usage preferred.</think>\nSure — I will fetch that now.\n<tool_call>{"name":"weather_lookup","arguments":{"city":"Tokyo"}}</tool_call>`,
    thinkingOff: `<tool_call>{"name":"weather_lookup","arguments":{"city":"Tokyo"}}</tool_call>`,
  },
};

function parseNaive(raw) {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("<tool_call>")) {
    return { ok: false, type: "error", message: "ParserError: Expected <tool_call> at start of output." };
  }
  const json = trimmed.slice("<tool_call>".length, trimmed.indexOf("</tool_call>"));
  return parseJSONResult(json);
}

function parseRegex(raw) {
  const match = raw.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
  if (!match) {
    return { ok: false, type: "error", message: "No tool call block found." };
  }
  return parseJSONResult(match[1]);
}

function parseStateMachine(raw) {
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

function parseJSONResult(payload) {
  try {
    const parsed = JSON.parse(payload);
    return { ok: true, type: "tool_call", data: parsed };
  } catch (e) {
    return { ok: false, type: "error", message: `JSON parse error: ${e.message}` };
  }
}

function runParser(parserKey, raw) {
  if (parserKey === "naive") return parseNaive(raw);
  if (parserKey === "regex") return parseRegex(raw);
  return parseStateMachine(raw);
}

const panel = {
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: 14,
  background: "#fff",
};

export default function App() {
  const [model, setModel] = useState("Qwen3");
  const [thinkingEnabled, setThinkingEnabled] = useState(true);
  const [showThinking, setShowThinking] = useState(false);
  const [parser, setParser] = useState("naive");

  const raw = OUTPUT_FIXTURES[model][thinkingEnabled ? "thinkingOn" : "thinkingOff"];
  const result = useMemo(() => runParser(parser, raw), [parser, raw]);

  const displayRaw = showThinking ? raw : raw.replace(/<think>[\s\S]*?<\/think>\n?/g, "");

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", maxWidth: 1200, margin: "24px auto", padding: "0 16px", color: "#111827" }}>
      <h1 style={{ marginBottom: 8 }}>Thinking mode × tool calling interaction</h1>
      <p style={{ marginTop: 0, color: "#4b5563" }}>
        Same user prompt, different harness assumptions. Toggle thinking mode to reproduce parser failures.
      </p>

      <div style={{ ...panel, marginBottom: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>1) Setup panel</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
          <label>
            Model
            <select value={model} onChange={(e) => setModel(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }}>
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label>
            Parser strategy
            <select value={parser} onChange={(e) => setParser(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }}>
              {PARSERS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 22 }}>
            <input type="checkbox" checked={thinkingEnabled} onChange={(e) => setThinkingEnabled(e.target.checked)} />
            Thinking mode enabled
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 22 }}>
            <input type="checkbox" checked={showThinking} onChange={(e) => setShowThinking(e.target.checked)} />
            Reveal &lt;think&gt; content
          </label>
        </div>
        <p style={{ marginBottom: 0, marginTop: 10 }}><strong>Prompt:</strong> {PROMPT}</p>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
        <section style={panel}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>2) Raw model output panel</h2>
          <pre style={{ whiteSpace: "pre-wrap", background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 8 }}>{displayRaw}</pre>
        </section>

        <section style={panel}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>3) Harness interpretation panel</h2>
          {result.ok ? (
            <div style={{ background: "#ecfdf5", border: "1px solid #10b981", borderRadius: 8, padding: 12 }}>
              <strong>Parsed tool call:</strong>
              <pre style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{JSON.stringify(result.data, null, 2)}</pre>
            </div>
          ) : (
            <div style={{ background: "#fef2f2", border: "1px solid #ef4444", borderRadius: 8, padding: 12 }}>
              <strong>Parser failed:</strong>
              <p style={{ marginBottom: 0 }}>{result.message}</p>
            </div>
          )}
        </section>
      </div>

      <div style={{ ...panel, marginTop: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>4) Why this fails</h2>
        <p style={{ marginBottom: 0 }}>
          With thinking mode ON, many models emit non-action text (often inside &lt;think&gt; tags) before tool calls. Naive parsers that assume the first token is structured data crash even though a valid tool call appears later.
        </p>
      </div>

      <div style={{ ...panel, marginTop: 14 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>5) Fix panel</h2>
        <ol style={{ marginBottom: 0 }}>
          <li>Do not require structured output at byte 0.</li>
          <li>Ignore or strip &lt;think&gt; content before extraction.</li>
          <li>Scan for tool call boundaries, then parse JSON strictly.</li>
          <li>Route parse failures to retry/repair logic, not silent fallback.</li>
        </ol>
      </div>

      <div style={{ ...panel, marginTop: 14, marginBottom: 30 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>6) Takeaway checklist</h2>
        <ul style={{ marginBottom: 0 }}>
          <li>Test every parser with thinking mode ON and OFF.</li>
          <li>Keep a model-agnostic intermediate tool call schema.</li>
          <li>Log both raw output and normalized action for debugging.</li>
          <li>Prefer state-machine parsing in production over first-token assumptions.</li>
        </ul>
      </div>
    </div>
  );
}
