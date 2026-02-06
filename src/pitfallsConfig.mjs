export const DEMO_IDS = [
  "01-thinking-tool-interaction",
  "02-tool-call-format-babel",
  "03-multiturn-thinking-context",
  "04-stop-token-eos-gotchas",
  "05-system-prompt-handling",
  "06-streaming-parser-robustness",
];

export function resolveInitialDemoId(hashValue, fallback = DEMO_IDS[0]) {
  const cleaned = (hashValue ?? "").replace(/^#/, "");
  return DEMO_IDS.includes(cleaned) ? cleaned : fallback;
}

export function buildShareUrlFromLocation(locationLike, id) {
  if (!locationLike?.origin || !locationLike?.pathname || !id) return "";
  return `${locationLike.origin}${locationLike.pathname}#${id}`;
}
