import { Module } from '@nestjs/common';
import { PatchService } from './patch.service';
import { PatchGeneratorService } from './generators/patch-generator.service';
import { PatchValidatorService } from './validators/patch.validator';
import { PatchController } from './patch.controller';

@Module({
  controllers: [PatchController],
  providers: [PatchService, PatchGeneratorService, PatchValidatorService],
  exports: [PatchService],
})
export class PatchModule {}
