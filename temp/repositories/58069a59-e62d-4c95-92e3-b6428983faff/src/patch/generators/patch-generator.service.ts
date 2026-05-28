import { Injectable, Logger } from '@nestjs/common';
import { JudgeResponse } from 'src/agents/judge-agent/schemas';
import { PatchResult } from '../interfaces/patch-result.interface';
import { PATCH_GENERATOR_PROMPT } from './prompts';
import { PatchResultSchema } from './schemas';
import { AiResponseParser, invokeGroq } from '@Common';
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
    const repositoryPath = path.join(this.REPO_BASE, repositoryId);

    // Extract unique files that the judge recommended to fix
    const targetFiles = Array.from(
      new Set(
        judgeResult.recommendedFixes.map((fix) => fix.file).filter(Boolean),
      ),
    );

    // Fetch original file contents to give the LLM context for 'before' states
    const fileContentsContext = targetFiles
      .map((filePath) => {
        const absolutePath = path.join(repositoryPath, filePath);
        let content = 'FILE NOT FOUND (May be a new file)';
        if (fs.existsSync(absolutePath)) {
          content = fs.readFileSync(absolutePath, 'utf8');
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
    this.logger.log(
      `[PatchGenerator] model=${modelId} promptLength=${prompt.length}`,
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
