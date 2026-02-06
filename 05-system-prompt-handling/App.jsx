import React, { useMemo, useState } from 'react';
import { MODEL_RULES, POLICY_TEMPLATES, buildWirePayload, parseHarness } from './logic.mjs';

const DEFAULT_SYSTEM =
  'You are a billing support assistant. Follow policy strictly. Never leak internal notes. Return concise answers.';
const DEFAULT_USER =
  'Customer says they were charged twice for invoice INV-2231. Ask one clarifying question, then propose next steps.';

const styles = {
  page: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
    margin: '0 auto',
    maxWidth: 1200,
    padding: 24,
    color: '#1f2937',
    lineHeight: 1.5,
  },
  grid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    marginTop: 16,
  },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    background: '#fff',
    padding: 14,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  h2: { fontSize: 17, margin: '0 0 8px' },
  label: { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 },
  textarea: {
    width: '100%',
    minHeight: 84,
    borderRadius: 8,
    border: '1px solid #d1d5db',
    padding: 10,
    fontSize: 13,
    resize: 'vertical',
  },
  select: {
    width: '100%',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    padding: '8px 10px',
    fontSize: 14,
    background: 'white',
  },
  code: {
    background: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    overflowX: 'auto',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  badge: {
    display: 'inline-block',
    fontSize: 12,
    background: '#eef2ff',
    color: '#3730a3',
    borderRadius: 999,
    padding: '4px 8px',
    marginBottom: 8,
  },
  diffAdded: { background: '#ecfdf3', padding: '2px 6px', borderRadius: 6 },
  diffRemoved: { background: '#fff1f2', padding: '2px 6px', borderRadius: 6 },
  checklist: { margin: 0, paddingLeft: 18 },
};

export default function App() {
  const [model, setModel] = useState('Gemma 3');
  const [overridePolicy, setOverridePolicy] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM);
  const [userPrompt, setUserPrompt] = useState(DEFAULT_USER);

  const recommendedPolicy = MODEL_RULES[model].policy;
  const activePolicy = overridePolicy || recommendedPolicy;

  const intentPayload = useMemo(
    () => ({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
    [systemPrompt, userPrompt],
  );

  const wirePayload = useMemo(
    () => buildWirePayload(activePolicy, systemPrompt, userPrompt),
    [activePolicy, systemPrompt, userPrompt],
  );

  const harness = useMemo(() => parseHarness(wirePayload), [wirePayload]);

  return (
    <div style={styles.page}>
      <h1 style={{ margin: 0 }}>System Prompt Role Handling Differences</h1>
      <p style={{ marginTop: 8 }}>
        Compare <strong>what you intended</strong> vs <strong>what the model actually receives</strong>.
        This demo highlights wire-format differences and shows a reusable policy-template approach.
      </p>

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.h2}>1) Setup panel</h2>
          <label style={styles.label}>Model</label>
          <select style={styles.select} value={model} onChange={(e) => setModel(e.target.value)}>
            {Object.keys(MODEL_RULES).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <p style={{ margin: '10px 0 6px' }}>
            Recommended template: <strong>{POLICY_TEMPLATES[recommendedPolicy].label}</strong>
          </p>
          <label style={styles.label}>Policy template override</label>
          <select
            style={styles.select}
            value={overridePolicy}
            onChange={(e) => setOverridePolicy(e.target.value)}
          >
            <option value="">Use model recommendation</option>
            {Object.entries(POLICY_TEMPLATES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>

          <p style={{ marginTop: 10, fontSize: 13, color: '#4b5563' }}>{MODEL_RULES[model].notes}</p>

          <label style={styles.label}>System instruction</label>
          <textarea
            style={styles.textarea}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />

          <label style={styles.label}>User message</label>
          <textarea
            style={styles.textarea}
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
          />
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>2) Raw model input panel (wire format)</h2>
          <span style={styles.badge}>{POLICY_TEMPLATES[activePolicy].label}</span>
          <pre style={styles.code}>{JSON.stringify(wirePayload, null, 2)}</pre>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>3) Harness interpretation panel</h2>
          <p style={{ marginTop: 0, fontSize: 13 }}>
            Parsed system instruction: <span style={styles.diffAdded}>{harness.extractedSystem}</span>
          </p>
          <p style={{ fontSize: 13 }}>
            Parsed user task: <span style={styles.diffAdded}>{harness.extractedTask}</span>
          </p>
          {harness.warning ? <p style={{ color: '#b91c1c', marginBottom: 0 }}>{harness.warning}</p> : null}
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>4) “Why this fails” panel</h2>
          <p style={{ marginTop: 0 }}>
            A harness that assumes every model keeps `role: system` will silently lose policy text when
            adapters flatten or remap messages.
          </p>
          <p>
            <span style={styles.diffRemoved}>Intent payload</span> can differ from
            <span style={styles.diffAdded}> transport payload</span>. Always validate the transport logs.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>5) Fix panel</h2>
          <p style={{ marginTop: 0 }}>
            Use explicit policy templates (`native-system`, `preamble`, `no-system`) and route models to a
            template instead of hardcoding per-model string surgery.
          </p>
          <pre style={styles.code}>{JSON.stringify(intentPayload, null, 2)}</pre>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>6) Takeaway checklist</h2>
          <ul style={styles.checklist}>
            <li>Inspect wire payloads, not only SDK-level message arrays.</li>
            <li>Represent role behavior as policy templates for reuse across new models.</li>
            <li>Fail closed when system policy is missing after transformation.</li>
            <li>Log parser warnings when policy markers are absent.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
