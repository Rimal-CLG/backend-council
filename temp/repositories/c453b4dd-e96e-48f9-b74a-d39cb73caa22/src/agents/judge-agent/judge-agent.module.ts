import { Module } from '@nestjs/common';
import { JudgeAgentController } from './judge-agent.controller';
import { JudgeAgentService } from './judge-agent.service';

@Module({
  controllers: [JudgeAgentController],
  providers: [JudgeAgentService],
  exports: [JudgeAgentService],
})
export class JudgeAgentModule {}
