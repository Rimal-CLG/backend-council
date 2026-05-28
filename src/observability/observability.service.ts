import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  StartAnalysisEvent,
  CompleteAnalysisEvent,
  AgentExecutionEvent,
  VerificationExecutionEvent,
} from './interfaces/observability-events.interface';

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordAnalysisStart(event: StartAnalysisEvent): Promise<void> {
    try {
      await this.prisma.analysisExecution.create({
        data: {
          executionId: event.executionId,
          repositoryId: event.repositoryId,
          totalDurationMs: 0,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to record analysis start for ${event.executionId}`,
        err,
      );
    }
  }

  async recordAnalysisComplete(event: CompleteAnalysisEvent): Promise<void> {
    try {
      await this.prisma.analysisExecution.update({
        where: { executionId: event.executionId },
        data: {
          totalDurationMs: event.totalDurationMs,
          finalConfidence: event.finalConfidence,
          finalRecommendation: event.finalRecommendation,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to record analysis complete for ${event.executionId}`,
        err,
      );
    }
  }

  async recordAgentExecution(event: AgentExecutionEvent): Promise<void> {
    try {
      const analysis = await this.prisma.analysisExecution.findUnique({
        where: { executionId: event.executionId },
      });

      if (!analysis) {
        this.logger.warn(
          `Cannot record agent execution: Analysis ${event.executionId} not found`,
        );
        return;
      }

      await this.prisma.agentExecution.create({
        data: {
          analysisId: analysis.id,
          agentName: event.agentName,
          durationMs: event.durationMs,
          confidence: event.confidence,
          tokensUsed: event.tokensUsed,
          success: event.success,
          accepted: event.accepted,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to record agent execution for ${event.executionId} - ${event.agentName}`,
        err,
      );
    }
  }

  async recordVerificationExecution(
    event: VerificationExecutionEvent,
  ): Promise<void> {
    try {
      const analysis = await this.prisma.analysisExecution.findUnique({
        where: { executionId: event.executionId },
      });

      if (!analysis) {
        this.logger.warn(
          `Cannot record verification execution: Analysis ${event.executionId} not found`,
        );
        return;
      }

      await this.prisma.verificationExecution.create({
        data: {
          analysisId: analysis.id,
          buildPassed: event.buildPassed,
          lintPassed: event.lintPassed,
          testsPassed: event.testsPassed,
          durationMs: event.durationMs,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to record verification execution for ${event.executionId}`,
        err,
      );
    }
  }

  async markAgentFindingAccepted(
    executionId: string,
    agentName: string,
    accepted: boolean,
  ): Promise<void> {
    try {
      const analysis = await this.prisma.analysisExecution.findUnique({
        where: { executionId },
      });

      if (!analysis) return;

      // Find the specific agent execution for this analysis
      const agentExec = await this.prisma.agentExecution.findFirst({
        where: {
          analysisId: analysis.id,
          agentName: agentName,
        },
      });

      if (agentExec) {
        await this.prisma.agentExecution.update({
          where: { id: agentExec.id },
          data: { accepted },
        });
      }
    } catch (err) {
      this.logger.error(
        `Failed to mark agent finding accepted for ${executionId} - ${agentName}`,
        err,
      );
    }
  }

  /**
   * Fix L-3: Health check for the Prisma/DB connection.
   * A simple SELECT 1 is sufficient to confirm connectivity.
   * This is exposed via the /health endpoint so silent DB failures are detectable.
   */
  async checkHealth(): Promise<{ status: 'ok' | 'error'; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      this.logger.error('Database health check failed', err);
      return { status: 'error', latencyMs: Date.now() - start };
    }
  }
}
