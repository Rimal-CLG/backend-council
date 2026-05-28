import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { JudgeResponse } from 'src/agents/judge-agent/schemas';
import { PatchResult } from '../interfaces/patch-result.interface';
import { PATCH_GENERATOR_PROMPT } from './prompts';
import { PatchResultSchema } from './schemas';
import {
  AiResponseParser,
  invokeGroq,
  sanitizeForLog,
  isValidUUID,
  safePath,
} from '@Common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PatchGeneratorService {
  private readonly logger = new Logger(PatchGeneratorService.name);
  private readonly REPO_BASE = path.join(process.cwd(), 'temp', 'repositories');

  async generate(
    repositoryId: string,
    judgeResult: JudgeResponse,
  ): Promise<PatchResult> {
    // Validate repositoryId to prevent path traversal (CodeQL: js/path-injection)
    if (!isValidUUID(repositoryId)) {
      throw new BadRequestException('Invalid repository identifier');
    }

    const repositoryPath = safePath(this.REPO_BASE, repositoryId);

    // Extract unique files that the judge recommended to fix
    const targetFiles = Array.from(
      new Set(
        judgeResult.recommendedFixes.map((fix) => fix.file).filter(Boolean),
      ),
    );

    // Fetch original file contents to give the LLM context for 'before' states
    const fileContentsContext = targetFiles
      .map((filePath) => {
        let content = 'FILE NOT FOUND (May be a new file)';
        try {
          // Validate each file path to prevent path traversal (CodeQL: js/path-injection)
          const absolutePath = safePath(repositoryPath, filePath);
          if (fs.existsSync(absolutePath)) {
            content = fs.readFileSync(absolutePath, 'utf8');
          }
        } catch {
          // Path traversal detected or file unreadable — skip silently
          content = 'FILE SKIPPED (Invalid path)';
        }
        return `File: ${filePath}\n\n${content}`;
      })
      .join('\n\n---\n\n');

    const prompt = `
      ${PATCH_GENERATOR_PROMPT}

      Judge's Final Recommendation:
      ${JSON.stringify(judgeResult, null, 2)}

      Original File Contents:
      ${fileContentsContext}
    `;

    const modelId = process.env.PATCH_AGENT_MODEL || 'llama-3.3-70b-versatile';
    // Sanitize log output (CodeQL: js/log-injection)
    this.logger.log(
      `[PatchGenerator] model=${sanitizeForLog(modelId)} promptLength=${prompt.length}`,
    );
    const rawText = await invokeGroq(prompt, modelId);

    const parsed = AiResponseParser.parse(rawText, PatchResultSchema);

    // Map to interface structure
    return {
      repositoryId,
      summary: parsed.summary,
      files: parsed.files.map((file) => ({
        path: file.path,
        action: file.action,
        reason: file.reason,
        before: file.before,
        after: file.after || '',
      })),
    };
  }
}
