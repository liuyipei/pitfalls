import React, { useMemo, useState } from "react";
import ThinkingToolInteractionApp from "../01-thinking-tool-interaction/App.jsx";
import ToolCallFormatBabelApp from "../02-tool-call-format-babel/App.jsx";
import MultiturnThinkingContextApp from "../03-multiturn-thinking-context/App.jsx";
import StopTokenEosGotchasApp from "../04-stop-token-eos-gotchas/App.jsx";
import SystemPromptHandlingApp from "../05-system-prompt-handling/App.jsx";
import { buildShareUrlFromLocation, resolveInitialDemoId } from "./pitfallsConfig.mjs";

const demos = [
  {
    id: "01-thinking-tool-interaction",
    title: "01) Thinking mode × tool calling interaction",
    status: "Implemented",
    Component: ThinkingToolInteractionApp,
  },
  {
    id: "02-tool-call-format-babel",
    title: "02) Tool call format Babel across models",
    status: "Implemented",
    Component: ToolCallFormatBabelApp,
  },
  {
    id: "03-multiturn-thinking-context",
    title: "03) Multi-turn context assembly with/without thinking tokens",
    status: "Implemented",
    Component: MultiturnThinkingContextApp,
  },
  {
    id: "04-stop-token-eos-gotchas",
    title: "04) Stop token / EOS mismatch",
    status: "Implemented",
    Component: StopTokenEosGotchasApp,
  },
  {
    id: "05-system-prompt-handling",
    title: "05) System prompt role handling differences",
    status: "Implemented",
    Component: SystemPromptHandlingApp,
  },
  {
    id: "06-streaming-parser-robustness",
    title: "06) Streaming + parser robustness under mixed content",
    status: "Planned",
    Component: null,
  },
];

const shellStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  color: "#0f172a",
  fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
};

const navButton = (active) => ({
  width: "100%",
  textAlign: "left",
  borderRadius: 8,
  border: active ? "1px solid #2563eb" : "1px solid #cbd5e1",
  background: active ? "#dbeafe" : "#fff",
  padding: "10px 12px",
  cursor: "pointer",
  fontSize: 14,
});

export default function PitfallsBrowserApp() {
  const [selectedId, setSelectedId] = useState(() => {
    const hashValue = typeof window !== "undefined" ? window.location.hash : "";
    return resolveInitialDemoId(hashValue, demos[0].id);
  });

  const selected = useMemo(() => demos.find((d) => d.id === selectedId) ?? demos[0], [selectedId]);

  const SelectedComponent = selected.Component;

  function handleSelect(id) {
    setSelectedId(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  }

  return (
    <div style={shellStyle}>
      <header style={{ borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "16px" }}>
          <h1 style={{ margin: 0, fontSize: 26 }}>LLM Integration Pitfalls — Browser Edition</h1>
          <p style={{ margin: "6px 0 0", color: "#475569" }}>
            A single-page launcher so all demos can be opened directly in a browser (no shell commands required).
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: 16, display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <aside style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", padding: 12, height: "fit-content" }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Pitfalls</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {demos.map((demo) => (
              <button key={demo.id} type="button" style={navButton(demo.id === selected.id)} onClick={() => handleSelect(demo.id)}>
                <div style={{ fontWeight: 600 }}>{demo.title}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Status: {demo.status}</div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: 10, borderRadius: 8, background: "#f1f5f9", fontSize: 13 }}>
            <strong>Shareable link:</strong>
            <div style={{ wordBreak: "break-all", marginTop: 4 }}>{typeof window === "undefined" ? "" : buildShareUrlFromLocation(window.location, selected.id)}</div>
          </div>
        </aside>

        <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff" }}>
          {SelectedComponent ? (
            <SelectedComponent />
          ) : (
            <div style={{ padding: 24 }}>
              <h2 style={{ marginTop: 0 }}>{selected.title}</h2>
              <p>This pitfall is intentionally listed but not yet implemented in this repository.</p>
              <p style={{ marginBottom: 0, color: "#475569" }}>
                Recommendation: add a token/chunk step-through viewer and incremental parser state panel.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
