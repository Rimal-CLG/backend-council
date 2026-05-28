import * as path from 'path';
import { BadRequestException } from '@nestjs/common';

/**
 * Regex matching a UUID v4 string.
 * Used to validate repositoryId, executionId, and similar server-generated IDs.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Regex matching Multer-style file IDs: `fieldname-timestamp-random.ext`
 * Example: `file-1779946870472-518374840.log`
 */
const FILE_ID_REGEX = /^[a-zA-Z0-9_-]+-\d+-\d+\.[a-zA-Z0-9]+$/;

/**
 * Strip newlines, carriage returns, and other control characters from a string
 * to prevent log injection / log forging attacks.
 *
 * CodeQL rule: js/log-injection
 */
export function sanitizeForLog(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x1f\x7f]/g, '');
}

/**
 * Validate that `id` is a safe identifier — either a UUID or a Multer file ID.
 * Returns true if the id matches one of the allowed patterns.
 *
 * CodeQL rule: js/path-injection
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validate that `id` matches the Multer filename pattern.
 */
export function isValidFileId(id: string): boolean {
  return FILE_ID_REGEX.test(id);
}

/**
 * Resolve `untrustedSegment` within `baseDir` and verify the result
 * does not escape the base directory. Throws `BadRequestException`
 * if a path traversal is detected.
 *
 * CodeQL rules: js/path-injection, js/incomplete-url-substring-sanitization
 *
 * @returns The absolute, resolved path that is guaranteed to be inside `baseDir`.
 */
export function safePath(baseDir: string, untrustedSegment: string): string {
  // Reject obviously malicious inputs early
  if (path.isAbsolute(untrustedSegment)) {
    throw new BadRequestException(
      'Invalid path: absolute paths are not allowed',
    );
  }

  const resolvedBase = path.resolve(baseDir) + path.sep;
  const resolvedFull = path.resolve(baseDir, untrustedSegment);

  // The resolved path must start with the base directory + separator
  // to prevent escaping via `..` or symlink tricks.
  if (
    !resolvedFull.startsWith(resolvedBase) &&
    resolvedFull !== resolvedBase.slice(0, -1)
  ) {
    throw new BadRequestException('Invalid path: directory traversal detected');
  }

  return resolvedFull;
}

/**
 * Dangerous property names that must never be spread from untrusted JSON
 * into application objects (prototype pollution prevention).
 *
 * CodeQL rule: js/prototype-pollution
 */
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Filter out prototype-polluting keys from an object's own enumerable properties.
 * Returns a new object without the dangerous keys.
 */
export function filterDangerousKeys<T extends Record<string, unknown>>(
  obj: T,
): T {
  const filtered = {} as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!DANGEROUS_KEYS.has(key)) {
      filtered[key] = obj[key];
    }
  }
  return filtered as T;
}
