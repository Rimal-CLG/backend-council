import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const totalAnalyses = await this.prisma.analysisExecution.count();

    const aggregations = await this.prisma.analysisExecution.aggregate({
      _avg: {
        totalDurationMs: true,
        finalConfidence: true,
      },
    });

    const verificationStats = await this.prisma.verificationExecution.aggregate(
      {
        _count: { id: true },
      },
    );

    const successfulVerifications =
      await this.prisma.verificationExecution.count({
        where: {
          buildPassed: true,
          lintPassed: true,
          testsPassed: true,
        },
      });

    return {
      totalAnalyses,
      averageDurationMs: aggregations._avg.totalDurationMs || 0,
      averageConfidence: aggregations._avg.finalConfidence || 0,
      totalVerifications: verificationStats._count.id,
      successfulVerifications,
      verificationSuccessRate:
        verificationStats._count.id > 0
          ? successfulVerifications / verificationStats._count.id
          : 0,
    };
  }

  async getRecentExecutions(take: number = 10, skip: number = 0) {
    return this.prisma.analysisExecution.findMany({
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        agents: true,
        verification: true,
      },
    });
  }

  async getExecutionById(executionId: string) {
    return this.prisma.analysisExecution.findUnique({
      where: { executionId },
      include: {
        agents: true,
        verification: true,
      },
    });
  }

  async getAgentAnalytics() {
    const agentGroups = await this.prisma.agentExecution.groupBy({
      by: ['agentName'],
      _count: { id: true },
      _avg: {
        durationMs: true,
        confidence: true,
      },
    });

    const results = await Promise.all(
      agentGroups.map(async (group) => {
        const acceptedCount = await this.prisma.agentExecution.count({
          where: {
            agentName: group.agentName,
            accepted: true,
          },
        });

        const decidedCount = await this.prisma.agentExecution.count({
          where: {
            agentName: group.agentName,
            accepted: { not: null },
          },
        });

        return {
          agentName: group.agentName,
          totalRuns: group._count.id,
          averageDurationMs: group._avg.durationMs || 0,
          averageConfidence: group._avg.confidence || 0,
          acceptanceRate: decidedCount > 0 ? acceptedCount / decidedCount : 0,
        };
      }),
    );

    return results.sort((a, b) => b.totalRuns - a.totalRuns);
  }
}
