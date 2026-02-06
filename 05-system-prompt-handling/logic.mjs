export const MODEL_RULES = {
  'Gemma 3': {
    policy: 'preamble',
    notes:
      'Many adapters flatten system guidance into a prefixed developer/user preamble. Keep instruction hierarchy explicit.',
  },
  'Llama 4': {
    policy: 'native-system',
    notes:
      'Supports a dedicated system role in most chat runtimes. Avoid duplicating the same instruction in user content.',
  },
  Qwen3: {
    policy: 'native-system',
    notes:
      'Generally supports system role, but wrappers can still remap. Verify transport payload logs, not just SDK calls.',
  },
  'Command-A': {
    policy: 'no-system',
    notes:
      'Some deployments perform best when policy text is placed in a controlled preamble instead of a separate system message.',
  },
};

export const POLICY_TEMPLATES = {
  'native-system': {
    label: 'Native system role',
    description: 'Send system content in a first-class `system` message.',
  },
  preamble: {
    label: 'Preamble template',
    description: 'Inject policy at the top of the first user turn with clear delimiters.',
  },
  'no-system': {
    label: 'No-system template',
    description: 'Merge policy into an instruction preface for models/runtimes without stable system-role handling.',
  },
};

export function buildWirePayload(template, systemPrompt, userPrompt) {
  if (template === 'native-system') {
    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };
  }

  if (template === 'preamble') {
    return {
      messages: [
        {
          role: 'user',
          content: `[POLICY_START]\n${systemPrompt}\n[POLICY_END]\n\n${userPrompt}`,
        },
      ],
    };
  }

  return {
    messages: [
      {
        role: 'user',
        content: `Instruction preface: ${systemPrompt}\n\nUser request: ${userPrompt}`,
      },
    ],
  };
}

export function parseHarness(payload) {
  const first = payload.messages[0];

  if (first.role === 'system') {
    return {
      extractedSystem: first.content,
      extractedTask: payload.messages[1]?.content ?? '(missing user message)',
      warning: null,
    };
  }

  const policyBlock = first.content.match(/\[POLICY_START\]([\s\S]*?)\[POLICY_END\]/);
  if (policyBlock) {
    return {
      extractedSystem: policyBlock[1].trim(),
      extractedTask: first.content.replace(/\[POLICY_START\][\s\S]*?\[POLICY_END\]/, '').trim(),
      warning: null,
    };
  }

  return {
    extractedSystem: '(none extracted)',
    extractedTask: first.content,
    warning:
      'Parser did not find a dedicated system role or policy markers. Risk: policy text may be ignored by downstream routing.',
  };
}
