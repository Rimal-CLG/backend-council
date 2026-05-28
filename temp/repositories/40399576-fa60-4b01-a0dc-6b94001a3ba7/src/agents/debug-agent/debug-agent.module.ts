import { Module } from '@nestjs/common';
import { DebugAgentController } from './debug-agent.controller';
import { DebugAgentService } from './debug-agent.service';

@Module({
  controllers: [DebugAgentController],
  providers: [DebugAgentService],
  exports: [DebugAgentService],
})
export class DebugAgentModule {}
