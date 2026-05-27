import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { UploadsModule } from './uploads/uploads.module';
import { WebsocketModule } from './websocket/websocket.module';
import { PrismaModule } from './prisma/prisma.module';
import { CouncilModule } from './council/council.module';
import { ContextModule } from './context/context.module';

/**
 * AppModule — root application module.
 *
 * Agent modules are no longer registered here.
 * They are scoped inside OrchestratorModule (via CouncilModule).
 * ContextModule is kept explicit for the standalone /context/build route.
 */
@Module({
  imports: [
    AiModule,
    UploadsModule,
    WebsocketModule,
    PrismaModule,
    CouncilModule, // → OrchestratorModule → all agent modules + ContextModule
    ContextModule, // explicit: /context/build standalone route
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
