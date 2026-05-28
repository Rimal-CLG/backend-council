/**
 * Wraps a promise with a hard timeout.
 *
 * If the promise does not resolve within `timeoutMs` milliseconds,
 * a `TimeoutError` is thrown and the internal timer is cleared.
 *
 * @param promise   The async operation to protect.
 * @param timeoutMs Maximum allowed duration in milliseconds.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new TimeoutError(
          `Operation timed out after ${timeoutMs}ms. The LLM may be overloaded.`,
        ),
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  });
}

/** Thrown by `withTimeout` when the guarded promise exceeds its deadline. */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}
