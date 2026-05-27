import { z } from 'zod';
import { AiParseException } from '../exceptions/ai-parse.exception';

/**
 * Parses raw LLM text output into a validated, typed object.
 *
 * Handles:
 * - Markdown code fences (```json ... ``` and plain ``` ... ```)
 * - Backtick-wrapped multiline string values (non-standard JSON)
 * - Raw control characters inside JSON strings
 * - Schema validation via Zod `.safeParse()` (never throws on invalid schema)
 *
 * Throws `AiParseException` on any failure — never a generic Error.
 */
export class AiResponseParser {
  static parse<T>(text: string, schema: z.ZodSchema<T>): T {
    let jsonText = text;

    // 1. Strip markdown code fences if present (```json ... ``` or ``` ... ```)
    const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (markdownMatch?.[1]) {
      jsonText = markdownMatch[1].trim();
    }

    // 2. Extract the first JSON object from surrounding prose
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      throw new AiParseException(
        'No valid JSON object found in LLM response',
        text,
      );
    }

    jsonText = jsonText.slice(firstBrace, lastBrace + 1).trim();

    // 3. Convert backtick-wrapped multiline strings → valid JSON strings
    jsonText = jsonText.replace(
      /"([^"]+)"\s*:\s*`([\s\S]*?)`\s*(?=[,}\n])/g,
      (_match: string, key: string, content: string): string => {
        const escaped = content
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r');
        return `"${key}": "${escaped}"`;
      },
    );

    // 4. Escape raw control characters inside double-quoted strings
    jsonText = jsonText.replace(
      /"([^"\\]*(?:\\.[^"\\]*)*)"/g,
      (_match: string, content: string): string => {
        const cleaned = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${cleaned}"`;
      },
    );

    // 5. Parse JSON — surface a clean error on failure
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      throw new AiParseException(
        `Failed to parse LLM response as JSON: ${err instanceof Error ? err.message : String(err)}`,
        text,
      );
    }

    // 6. Validate against the Zod schema — defaults are applied automatically
    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new AiParseException(
        `LLM response failed schema validation: ${result.error.message}`,
        text,
      );
    }

    return result.data;
  }
}
