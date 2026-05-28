import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { AiModule } from './ai/ai.module';
import { UploadsModule } from './uploads/uploads.module';
import { WebsocketModule } from './websocket/websocket.module';
import { PrismaModule } from './prisma/prisma.module';
import {
  DatabaseAgentModule,
  SecurityAgentModule,
  DebugAgentModule,
  JudgeAgentModule,
} from './agents';
import { CouncilModule } from './council/council.module';
import { ContextModule } from './context/context.module';
import { RepositoryModule } from './repository/repository.module';
import { VerificationModule } from './verification/verification.module';
import { PatchModule } from './patch/patch.module';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [
    // Fix M-1: Rate limiting — max 5 requests per IP per 60 seconds globally.
    // This protects AI-triggering endpoints (/council/analyze, /verification, /patch/generate)
    // from being flooded, preventing API quota exhaustion and CPU overload from sandbox runs.
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 second window
        limit: 5,   // max 5 requests per window per IP
      },
    ]),
    OrchestratorModule,
    AiModule,
    UploadsModule,
    WebsocketModule,
    PrismaModule,
    DatabaseAgentModule,
    SecurityAgentModule,
    DebugAgentModule,
    JudgeAgentModule,
    CouncilModule,
    ContextModule,
    RepositoryModule,
    VerificationModule,
    PatchModule,
    ObservabilityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
