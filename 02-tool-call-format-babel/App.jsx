import React, { useMemo, useState } from 'react';
import { canonicalIntent, modelFixtures, naiveParser, normalizeToolCall } from './toolParsers.mjs';

const pretty = (value) => JSON.stringify(value, null, 2);

export default function App() {
  const [model, setModel] = useState('Qwen3');
  const [sourceMode, setSourceMode] = useState('raw-first');

  const fixture = modelFixtures[model];

  const harnessResult = useMemo(() => {
    try {
      return {
        status: 'error',
        parser: 'Naive parser',
        value: naiveParser(fixture.output),
      };
    } catch (error) {
      try {
        return {
          status: 'ok',
          parser: 'Adapter parser',
          value: normalizeToolCall(fixture.output, model),
        };
      } catch (adapterError) {
        return {
          status: 'fatal',
          parser: 'Adapter parser',
          value: adapterError.message,
        };
      }
    }
  }, [fixture, model]);

  const normalized = useMemo(() => {
    if (sourceMode === 'canonical-first') {
      return canonicalIntent;
    }
    if (harnessResult.status === 'ok' || harnessResult.status === 'error') {
      return harnessResult.value;
    }
    return null;
  }, [harnessResult, sourceMode]);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 24, lineHeight: 1.4 }}>
      <h1>02 — Tool call format Babel across models</h1>
      <p>
        Compare raw tool-call syntax across models, then normalize everything into one canonical
        shape: <code>{`{ name, args, call_id }`}</code>.
      </p>

      <section style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <h2>1) Setup panel</h2>
        <label>
          Model:&nbsp;
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {Object.keys(modelFixtures).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Teaching flow:&nbsp;
          <select value={sourceMode} onChange={(e) => setSourceMode(e.target.value)}>
            <option value="raw-first">Raw model output ➜ normalize (recommended)</option>
            <option value="canonical-first">Canonical schema ➜ adapters compile output</option>
          </select>
        </label>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2>2) Raw model output panel</h2>
        <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8 }}>
          {fixture.output}
        </pre>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2>3) Harness interpretation panel</h2>
        <p>
          <strong>Status:</strong>{' '}
          {harnessResult.status === 'ok'
            ? '✅ Naive parser failed, adapter succeeded.'
            : harnessResult.status === 'error'
              ? '⚠️ Naive parser unexpectedly succeeded.'
              : '❌ Adapter failed.'}
        </p>
        <p>
          <strong>Winning parser:</strong> {harnessResult.parser}
        </p>
        <pre style={{ background: '#111827', color: '#f9fafb', padding: 12, borderRadius: 8 }}>
          {pretty(harnessResult.value)}
        </pre>

        <h3>Normalized output</h3>
        <pre style={{ background: '#1f2937', color: '#f3f4f6', padding: 12, borderRadius: 8 }}>
          {normalized ? pretty(normalized) : 'Normalization unavailable.'}
        </pre>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2>4) Why this fails</h2>
        <p>{fixture.gotcha}</p>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2>5) Fix</h2>
        <p>{fixture.fix}</p>
        <pre style={{ background: '#ecfeff', padding: 12, borderRadius: 8 }}>
{`function normalizeToolCall(raw, model) {
  const parsed = modelSpecificExtractors[model](raw);
  return {
    name: parsed.name,
    args: parsed.args ?? {},
    call_id: parsed.call_id ?? null,
  };
}`}
        </pre>
      </section>

      <section>
        <h2>6) Takeaway checklist</h2>
        <ul>
          <li>Never assume one wire format for all models.</li>
          <li>Treat extraction and normalization as separate steps.</li>
          <li>Store a canonical tool-call schema internally.</li>
          <li>Log raw payload + normalized payload for debugging.</li>
          <li>Test adapters with fixture snapshots before production rollout.</li>
        </ul>
      </section>
    </div>
  );
}
