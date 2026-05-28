import { Injectable } from '@nestjs/common';
import { AgentContext } from '../../common/interfaces/agent-context.interface';

@Injectable()
export class AgentContextBuilderService {
  private readonly MAX_FILES_PER_AGENT = 5;
  private readonly MAX_CHARS_PER_FILE = 10000;
  private readonly MAX_TOTAL_CHARS = 100000;

  public buildContexts(baseContext: AgentContext): {
    databaseAgentContext: AgentContext;
    securityAgentContext: AgentContext;
    debugAgentContext: AgentContext;
  } {
    return {
      databaseAgentContext: this.filterContext(baseContext, [
        'schema',
        'prisma',
        'repository',
        'transaction',
        'entity',
      ]),
      securityAgentContext: this.filterContext(baseContext, [
        'auth',
        'guard',
        'jwt',
        'middleware',
        'env',
        'strategy',
      ]),
      debugAgentContext: this.filterContext(baseContext, [
        'service',
        'controller',
        'log',
        'exception',
        'stack',
        'module',
      ]),
    };
  }

  private filterContext(
    context: AgentContext,
    keywords: string[],
  ): AgentContext {
    // Use structuredClone instead of JSON.parse(JSON.stringify()) to prevent
    // prototype pollution — structuredClone strips __proto__ keys automatically.
    // (CodeQL: js/prototype-pollution)
    const cloned: AgentContext = structuredClone(context);

    let filesSelected = 0;
    let filesRejected = 0;
    let totalScore = 0;
    let totalContextSize = 0;

    if (cloned.files && cloned.files.length > 0) {
      // 1. Filter by keywords matching filename or selectionReason
      let candidateFiles = cloned.files.filter((file) => {
        const matchesName = keywords.some((k) =>
          file.filename.toLowerCase().includes(k.toLowerCase()),
        );
        const matchesReason = file.selectionReason
          ? keywords.some((k) =>
              file.selectionReason!.toLowerCase().includes(k.toLowerCase()),
            )
          : false;

        if (
          matchesName ||
          matchesReason ||
          file.filename.endsWith('package.json')
        )
          return true;

        filesRejected++;
        return false;
      });

      // 2. Sort by score descending (already sorted from RankingService, but just to be safe)
      candidateFiles.sort((a, b) => (b.score || 0) - (a.score || 0));

      // 3. Slice to budget limits
      candidateFiles = candidateFiles.slice(0, this.MAX_FILES_PER_AGENT);
      filesRejected +=
        cloned.files.length - filesRejected - candidateFiles.length;

      // 4. Truncate files if they exceed individual limit
      candidateFiles = candidateFiles.map((file) => {
        if (file.content.length > this.MAX_CHARS_PER_FILE) {
          file.content =
            file.content.substring(0, this.MAX_CHARS_PER_FILE) +
            '\n...[TRUNCATED FOR CONTEXT BUDGET]';
        }
        return file;
      });

      // 5. Check global limit, truncate if necessary
      let currentTotal = JSON.stringify(cloned).length;
      for (const file of candidateFiles) {
        const charCount = file.content.length;
        if (currentTotal + charCount > this.MAX_TOTAL_CHARS) {
          const allowedChars = Math.max(0, this.MAX_TOTAL_CHARS - currentTotal);
          file.content =
            file.content.substring(0, allowedChars) +
            '\n...[TRUNCATED TO PREVENT OOM]';
          currentTotal += allowedChars;
        } else {
          currentTotal += charCount;
        }

        filesSelected++;
        totalScore += file.score || 0;
      }

      totalContextSize = currentTotal;
      cloned.files = candidateFiles;
    }

    cloned.executionMetadata = {
      filesSelected,
      filesRejected,
      averageScore: filesSelected > 0 ? totalScore / filesSelected : 0,
      totalContextSize,
    };

    return cloned;
  }
}
