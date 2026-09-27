const privacyPatterns = [
  /customer\s+(name|names|email|emails|details|records|data)/i,
  /email\s+address/i,
  /who\s+(is|are)\s+(the\s+)?customer/i,
  /individual\s+(order|customer)/i,
  /order\s+(history|details)\s+for/i,
  /personal(ly)?\s+identifiable/i
];

const injectionPatterns = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /reveal\s+(the\s+)?system\s+prompt/i,
  /show\s+(me\s+)?(the\s+)?database/i,
  /dump\s+(the\s+)?data/i,
  /bypass\s+(the\s+)?policy/i,
  /execute\s+(arbitrary|raw)\s+sql/i
];

export type PolicyDecision = { allowed: true } | { allowed: false; code: 'privacy' | 'prompt_injection'; message: string };

export function evaluateUserQuestion(question: string): PolicyDecision {
  if (privacyPatterns.some((pattern) => pattern.test(question))) {
    return { allowed: false, code: 'privacy', message: 'I can’t provide customer-level or personally identifying data. I can help with anonymous totals and aggregated sales trends instead.' };
  }
  if (injectionPatterns.some((pattern) => pattern.test(question))) {
    return { allowed: false, code: 'prompt_injection', message: 'I can’t follow requests to bypass my data and privacy rules. I can answer supported aggregate questions about the sales data.' };
  }
  return { allowed: true };
}
