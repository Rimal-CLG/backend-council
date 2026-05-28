import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ObservabilityService } from './observability.service';
import { AnalyticsService } from './analytics/analytics.service';
import { ObservabilityController } from './observability.controller';

@Module({
  imports: [PrismaModule],
  providers: [ObservabilityService, AnalyticsService],
  controllers: [ObservabilityController],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
