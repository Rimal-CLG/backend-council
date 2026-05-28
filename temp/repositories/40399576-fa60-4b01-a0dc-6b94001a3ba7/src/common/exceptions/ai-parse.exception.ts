/**
 * Thrown when the AI response parser cannot extract or validate
 * a JSON payload from the raw LLM output.
 *
 * Catching this specific type lets callers distinguish parsing
 * failures from network / timeout errors.
 */
export class AiParseException extends Error {
  constructor(
    message: string,
    /** The raw LLM text that triggered the failure — for server-side logging only. */
    public readonly rawResponse?: string,
  ) {
    super(message);
    this.name = 'AiParseException';
    // Ensures instanceof checks work correctly after transpilation.
    Object.setPrototypeOf(this, AiParseException.prototype);
  }
}
