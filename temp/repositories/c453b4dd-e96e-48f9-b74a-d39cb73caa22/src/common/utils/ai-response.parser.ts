import { z } from 'zod';

export class AiResponseParser {
  static parse<T>(text: string, schema: z.ZodSchema<T>): T {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      throw new Error('No valid JSON object found in response');
    }

    let jsonText = text.slice(firstBrace, lastBrace + 1).trim();

    // Clean backtick-wrapped multiline string values (invalid JSON) into valid JSON strings
    jsonText = jsonText.replace(
      /"([^"]+)"\s*:\s*`([\s\S]*?)`\s*(?=[,}\n])/g,
      (match: string, key: string, content: string): string => {
        const escaped = content
          .replace(/\\/g, '\\\\') // Escape backslashes
          .replace(/"/g, '\\"') // Escape double quotes
          .replace(/\n/g, '\\n') // Escape newlines
          .replace(/\r/g, '\\r'); // Escape carriage returns
        return `"${key}": "${escaped}"`;
      },
    );

    // Clean raw control characters (newlines, carriage returns, tabs) inside standard double-quoted JSON string values
    jsonText = jsonText.replace(
      /"([^"\\]*(?:\\.[^"\\]*)*)"/g,
      (match: string, content: string): string => {
        const cleanedContent = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${cleanedContent}"`;
      },
    );

    const parsed: unknown = JSON.parse(jsonText);

    // Auto-populate default fields from BaseAgentSchema and agent-specific schemas if missing in the parsed LLM response
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;

      // BaseAgentSchema fields
      if (obj.confidence === undefined || typeof obj.confidence !== 'number') {
        obj.confidence = 0.9;
      }
      if (obj.summary === undefined || typeof obj.summary !== 'string') {
        const rootCause =
          typeof obj.rootCause === 'string' ? obj.rootCause : '';
        obj.summary = rootCause || 'Analysis completed successfully.';
      }
      if (
        obj.recommendations === undefined ||
        !Array.isArray(obj.recommendations)
      ) {
        obj.recommendations = [];
      }

      // Security agent specific fields
      if (
        obj.securityIssues === undefined ||
        !Array.isArray(obj.securityIssues)
      ) {
        obj.securityIssues = [];
      }
      if (obj.severity === undefined || typeof obj.severity !== 'string') {
        obj.severity = 'LOW';
      }
      if (obj.secureCode === undefined || typeof obj.secureCode !== 'string') {
        obj.secureCode = '';
      }

      // Database agent specific fields
      if (obj.rootCause === undefined || typeof obj.rootCause !== 'string') {
        obj.rootCause = '';
      }
      if (obj.issues === undefined || !Array.isArray(obj.issues)) {
        obj.issues = [];
      }
      if (
        obj.optimizedCode === undefined ||
        typeof obj.optimizedCode !== 'string'
      ) {
        obj.optimizedCode = '';
      }

      // Debug agent specific fields
      if (obj.errorType === undefined || typeof obj.errorType !== 'string') {
        obj.errorType = '';
      }
      if (
        obj.affectedFiles === undefined ||
        !Array.isArray(obj.affectedFiles)
      ) {
        obj.affectedFiles = [];
      }
      if (obj.fixes === undefined || !Array.isArray(obj.fixes)) {
        obj.fixes = [];
      }

      // Judge agent specific fields
      if (
        obj.finalRootCause === undefined ||
        typeof obj.finalRootCause !== 'string'
      ) {
        obj.finalRootCause = '';
      }
      if (obj.keyFindings === undefined || !Array.isArray(obj.keyFindings)) {
        obj.keyFindings = [];
      }
      if (
        obj.securityRisks === undefined ||
        !Array.isArray(obj.securityRisks)
      ) {
        obj.securityRisks = [];
      }
      if (
        obj.recommendedFixes === undefined ||
        !Array.isArray(obj.recommendedFixes)
      ) {
        obj.recommendedFixes = [];
      }
    }

    return schema.parse(parsed);
  }
}
