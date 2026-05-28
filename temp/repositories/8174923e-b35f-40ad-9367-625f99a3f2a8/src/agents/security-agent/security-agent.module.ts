import { Module } from '@nestjs/common';
import { SecurityAgentController } from './security-agent.controller';
import { SecurityAgentService } from './security-agent.service';

@Module({
  controllers: [SecurityAgentController],
  providers: [SecurityAgentService],
  exports: [SecurityAgentService],
})
export class SecurityAgentModule {}
