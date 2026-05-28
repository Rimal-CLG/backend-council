import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
