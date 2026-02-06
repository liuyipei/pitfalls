import React, { useMemo, useState } from "react";

import {
  ALL_STOP_OPTIONS,
  MODEL_FIXTURES,
  buildWarnings,
  parseTokens,
  simulateTruncation,
} from "./simulator.mjs";

export default function App() {
  const [model, setModel] = useState("Qwen3");
  const [selectedStops, setSelectedStops] = useState(
    MODEL_FIXTURES["Qwen3"].recommendedStops
  );
  const [freeTextStops, setFreeTextStops] = useState("");

  const fixture = MODEL_FIXTURES[model];

  const effectiveStops = useMemo(() => {
    const parsed = parseTokens(freeTextStops);
    return Array.from(new Set([...selectedStops, ...parsed]));
  }, [selectedStops, freeTextStops]);

  const result = useMemo(
    () => simulateTruncation(fixture.output, effectiveStops),
    [fixture.output, effectiveStops]
  );

  const warnings = useMemo(
    () => buildWarnings(model, effectiveStops),
    [model, effectiveStops]
  );

  function onModelChange(nextModel) {
    setModel(nextModel);
    setSelectedStops(MODEL_FIXTURES[nextModel].recommendedStops);
    setFreeTextStops("");
  }

  function toggleStop(token) {
    setSelectedStops((prev) =>
      prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token]
    );
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 24, maxWidth: 1200, margin: "0 auto", color: "#111827" }}>
      <h1>04 — Stop token / EOS mismatch</h1>
      <p>
        Deterministic simulator for how model-specific stop tokens affect truncation, parser boundaries, and runaway output.
      </p>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>1) Setup panel</h2>
        <label>
          Model:&nbsp;
          <select value={model} onChange={(e) => onModelChange(e.target.value)}>
            {Object.keys(MODEL_FIXTURES).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <p style={{ marginTop: 12, marginBottom: 8 }}><strong>Model-aware token picker</strong></p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALL_STOP_OPTIONS.map((token) => {
            const active = selectedStops.includes(token);
            const recommended = fixture.recommendedStops.includes(token);
            return (
              <button
                key={token}
                onClick={() => toggleStop(token)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: active ? "1px solid #2563eb" : "1px solid #d1d5db",
                  background: active ? "#dbeafe" : "#fff",
                  cursor: "pointer",
                }}
              >
                {token} {recommended ? "★" : ""}
              </button>
            );
          })}
        </div>

        <p style={{ marginTop: 12, marginBottom: 4 }}>Optional free-text stops (comma-separated):</p>
        <input
          value={freeTextStops}
          onChange={(e) => setFreeTextStops(e.target.value)}
          placeholder="e.g. ###, </assistant>"
          style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
        />
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>2) Raw model output panel</h2>
        <pre style={{ background: "#f9fafb", border: "1px solid #e5e7eb", padding: 12, overflowX: "auto" }}>{fixture.output}</pre>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>3) Harness interpretation panel</h2>
        <p>
          <strong>Active stops:</strong> {effectiveStops.join(", ") || "(none)"}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span style={{ color: result.status === "stopped" ? "#166534" : "#991b1b", fontWeight: 600 }}>
            {result.status === "stopped" ? `Stopped on ${result.matched}` : "Runaway (no stop matched)"}
          </span>
        </p>
        <pre style={{ background: "#f9fafb", border: "1px solid #e5e7eb", padding: 12, overflowX: "auto" }}>
          {result.truncatedText}
        </pre>
      </section>

      <section style={{ border: "1px solid #fcd34d", background: "#fffbeb", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>4) Why this fails</h2>
        {warnings.length === 0 ? (
          <p style={{ color: "#166534" }}>No immediate mismatch warnings for this fixture.</p>
        ) : (
          <ul>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ border: "1px solid #bbf7d0", background: "#f0fdf4", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>5) Fix panel</h2>
        <pre style={{ background: "#fff", border: "1px solid #d1fae5", padding: 12, overflowX: "auto" }}>{`// production-safe pattern
const modelConfig = {
  model: "${model}",
  stop: ${JSON.stringify(fixture.recommendedStops)},
  max_tokens: 512,
};

// enforce EOS in model profile, not per-request user input
validateStops(modelConfig.stop, modelProfile.requiredStops);
`}</pre>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
        <h2>6) Takeaway checklist</h2>
        <ul>
          <li>Store stop tokens per-model in a typed profile, not as ad-hoc prompt strings.</li>
          <li>Always include the model's EOS token in the stop list.</li>
          <li>Use deterministic fixtures in CI to catch regressions in stop behavior.</li>
          <li>Validate lookalike unicode tokens (fullwidth bars, sentencepiece underscores).</li>
          <li>Log which stop token actually fired for each production request.</li>
        </ul>
      </section>
    </div>
  );
}
