import Groq from 'groq-sdk';
import { withTimeout } from './timeout.util';
import {
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TIMEOUT_MS,
} from '../constants/agent.constants';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        'The GROQ_API_KEY environment variable is missing or empty. ' +
          'Please add GROQ_API_KEY=<your_key> to your .env file.',
      );
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

/**
 * Invokes the Groq LLM with the provided prompt and returns the raw text response.
 *
 * Every call is automatically protected by a timeout (default 30 s).
 * Throws `TimeoutError` if the deadline is exceeded, or `Error` if the
 * API returns an empty response.
 */
export async function invokeGroq(
  prompt: string,
  modelId: string,
  temperature = DEFAULT_TEMPERATURE,
  maxTokens = DEFAULT_MAX_TOKENS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  const client = getGroqClient();

  const chatCompletion = await withTimeout(
    client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: modelId,
      temperature,
      max_tokens: maxTokens,
    }),
    timeoutMs,
  );

  const content = chatCompletion.choices[0]?.message?.content;
  if (!content) {
    throw new Error(
      'LLM returned an empty response — no content in choices[0]',
    );
  }
  return content;
}
