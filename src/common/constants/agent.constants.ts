/** Default Groq model used when no env-specific override is set. */
export const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/** Maximum milliseconds to wait for a single LLM API call before timing out. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** LLM sampling temperature — low value keeps responses deterministic. */
export const DEFAULT_TEMPERATURE = 0.1;

/** Maximum tokens the LLM may generate per response. */
export const DEFAULT_MAX_TOKENS = 4_096;
