import React, { useMemo, useState } from "react";
import {
  MODEL_FIXTURES,
  PRICE_PER_1K,
  buildPackedContext,
  estimateTokens,
  formatUsd,
  scoreQualityRisk,
  serializePrompt,
} from "./contextAssembly.mjs";

function Stat({ label, value }) {
  return (
    <div style={{ padding: 12, border: "1px solid #d4d4d8", borderRadius: 8, background: "white" }}>
      <div style={{ fontSize: 12, color: "#52525b" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function MessageList({ messages }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {messages.map((m) => (
        <div key={m.id} style={{ border: "1px solid #e4e4e7", borderRadius: 8, background: "#fff", padding: 10 }}>
          <div style={{ fontSize: 12, color: "#3f3f46", marginBottom: 6 }}>{m.role}</div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>{m.content}</pre>
        </div>
      ))}
    </div>
  );
}

function AssemblyColumn({ title, subtitle, messages }) {
  const prompt = useMemo(() => serializePrompt(messages), [messages]);
  const tokens = estimateTokens(prompt);
  const cost = (tokens / 1000) * PRICE_PER_1K;

  return (
    <section style={{ border: "1px solid #d4d4d8", borderRadius: 12, background: "#fafafa", padding: 12 }}>
      <h3 style={{ marginTop: 0, marginBottom: 6 }}>{title}</h3>
      <p style={{ marginTop: 0, color: "#52525b", fontSize: 13 }}>{subtitle}</p>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginBottom: 12 }}>
        <Stat label="Estimated prompt tokens" value={tokens.toLocaleString()} />
        <Stat label="Est. input cost" value={formatUsd(cost)} />
      </div>
      <h4 style={{ marginBottom: 8 }}>Structured message array</h4>
      <MessageList messages={messages} />
      <h4 style={{ marginTop: 12, marginBottom: 8 }}>Serialized prompt preview</h4>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", border: "1px solid #e4e4e7", borderRadius: 8, padding: 10, background: "white", fontSize: 12 }}>{prompt}</pre>
    </section>
  );
}

export default function App() {
  const [modelKey, setModelKey] = useState("qwen3");
  const model = MODEL_FIXTURES[modelKey];

  const correctMessages = useMemo(() => buildPackedContext(model.turns, false), [model]);
  const incorrectMessages = useMemo(() => buildPackedContext(model.turns, true), [model]);

  const correctPrompt = useMemo(() => serializePrompt(correctMessages), [correctMessages]);
  const incorrectPrompt = useMemo(() => serializePrompt(incorrectMessages), [incorrectMessages]);

  const correctTokens = estimateTokens(correctPrompt);
  const incorrectTokens = estimateTokens(incorrectPrompt);
  const tokenDelta = incorrectTokens - correctTokens;

  const correctRisk = scoreQualityRisk(false);
  const incorrectRisk = scoreQualityRisk(true);

  return (
    <main style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f4f5", minHeight: "100vh", color: "#18181b", padding: 20 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 16 }}>
        <header>
          <h1 style={{ marginBottom: 6 }}>03. Multi-turn context assembly with/without thinking tokens</h1>
          <p style={{ marginTop: 0, color: "#52525b" }}>
            Compare production-safe history packing (exclude hidden reasoning) vs a common anti-pattern (replay &lt;think&gt; spans). Quality-first default, with cost impact visible.
          </p>
        </header>

        <section style={{ border: "1px solid #d4d4d8", borderRadius: 12, background: "white", padding: 12 }}>
          <h2 style={{ marginTop: 0 }}>Setup panel</h2>
          <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "#3f3f46" }} htmlFor="model">
            Model
          </label>
          <select
            id="model"
            value={modelKey}
            onChange={(event) => setModelKey(event.target.value)}
            style={{ border: "1px solid #d4d4d8", borderRadius: 8, padding: 8, fontSize: 14, minWidth: 220 }}
          >
            {Object.entries(MODEL_FIXTURES).map(([key, fixture]) => (
              <option key={key} value={key}>
                {fixture.label}
              </option>
            ))}
          </select>
          <p style={{ marginBottom: 0, marginTop: 10, color: "#52525b", fontSize: 13 }}>{model.notes}</p>
        </section>

        <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <AssemblyColumn
            title="Correct assembly (recommended)"
            subtitle="Exclude assistant thinking tokens from history; keep only user-visible assistant text."
            messages={correctMessages}
          />
          <AssemblyColumn
            title="Incorrect assembly (anti-pattern)"
            subtitle="Replay full assistant output including hidden <think> spans into subsequent turns."
            messages={incorrectMessages}
          />
        </section>

        <section style={{ border: "1px solid #d4d4d8", borderRadius: 12, background: "white", padding: 12 }}>
          <h2 style={{ marginTop: 0 }}>Why this fails</h2>
          <ul style={{ marginTop: 0 }}>
            <li>
              <strong>Quality regression:</strong> when hidden reasoning is echoed into future prompts, the model can anchor on internal notes instead of user-facing intent.
            </li>
            <li>
              <strong>Token amplification:</strong> each turn re-injects verbose reasoning, causing avoidable context bloat.
            </li>
            <li>
              <strong>Operational risk:</strong> private reasoning-like text may become visible in downstream logs or responses.
            </li>
          </ul>
        </section>

        <section style={{ border: "1px solid #d4d4d8", borderRadius: 12, background: "white", padding: 12 }}>
          <h2 style={{ marginTop: 0 }}>Fix + takeaway checklist</h2>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginBottom: 10 }}>
            <Stat label="Token delta (incorrect - correct)" value={`${tokenDelta >= 0 ? "+" : ""}${tokenDelta}`} />
            <Stat label="Default optimization mode" value="Quality-first" />
            <Stat label="Correct path quality risk" value={correctRisk.label} />
            <Stat label="Incorrect path quality risk" value={incorrectRisk.label} />
          </div>
          <ol style={{ marginTop: 0 }}>
            <li>Store assistant-visible text separately from hidden reasoning fields.</li>
            <li>When assembling multi-turn context, include only user/system + assistant visible content.</li>
            <li>Track token budget deltas between packing strategies in CI or eval harnesses.</li>
            <li>Audit logs to ensure private reasoning markers are not persisted or replayed.</li>
          </ol>
          <p style={{ marginBottom: 0, color: "#3f3f46", fontSize: 13 }}>
            Correct path: {correctRisk.reason} Incorrect path: {incorrectRisk.reason}
          </p>
        </section>
      </div>
    </main>
  );
}
