// ── Prompt safety filter ──────────────────────────────────────────────────────

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+|the\s+)?(previous|above|prior|system|earlier)(\s+\w+)?\s+instructions?/i,
  /you\s+are\s+now\s+/i,
  /pretend\s+(you\s+are|to\s+be)\s+/i,
  /act\s+as\s+(if\s+|though\s+)?you('re|\s+are)\s+/i,
  /forget\s+(everything|all|your|the|prior)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /developer\s+mode/i,
  /override\s+(your\s+)?(programming|instructions|rules)/i,
  /system\s+prompt\s*:/i,
  /<\|im_start\|>/i,       // ChatML injection
  /\[INST\]/i,              // Llama instruction injection
];

const PII_PATTERNS: RegExp[] = [
  /\b\d{10}\b/,                                          // 10-digit phone
  /\b[A-Z]{5}\d{4}[A-Z]\b/,                              // Indian PAN card
  /\b\d{12}\b/,                                          // Aadhaar
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,        // Credit card
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,        // Email address
];

export interface FilterResult {
  blocked: boolean;
  reason?: string;
}

export function filterPrompt(prompt: string): FilterResult {
  if (!prompt || typeof prompt !== "string") {
    return { blocked: true, reason: "empty_prompt" };
  }

  if (prompt.length > 4000) {
    return { blocked: true, reason: "prompt_too_long" };
  }

  // Repeated character flood (e.g. "aaaaaaa...") — common DoS / evasion pattern
  if (/(.)\1{49,}/.test(prompt)) {
    return { blocked: true, reason: "repeated_chars" };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      return { blocked: true, reason: "injection_attempt" };
    }
  }

  for (const pattern of PII_PATTERNS) {
    if (pattern.test(prompt)) {
      return { blocked: true, reason: "pii_detected" };
    }
  }

  return { blocked: false };
}
