import { Controller, Post, Param } from '@nestjs/common';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post(':repositoryId')
  async verifyRepository(@Param('repositoryId') repositoryId: string) {
    return this.verificationService.verifyRepository(repositoryId);
  }
}
