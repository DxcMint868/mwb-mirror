import {
  BadRequestException,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from '@/src/auth/clerk-auth.guard';
import { GetClerkSession } from '@/src/auth/get-clerk-session.decorator';
import { SessionAuthObject } from '@clerk/backend';
import { PrismaService } from '@/src/prisma/prisma.service';

@ApiTags('Testing')
@Controller('testing')
@ApiBearerAuth()
export class TestingController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('reset-readings')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary:
      'Reset user state for testing: free flip quota, tokens, and saved readings',
  })
  async resetReadings(@GetClerkSession() clerkSession: SessionAuthObject) {
    const userId = clerkSession.userId ?? null;

    if (!userId) {
      throw new BadRequestException('User ID not found in session');
    }

    // Reset user stats
    await this.prisma.user.update({
      where: { clerkUserId: userId },
      data: {
        lastFreeFlipAt: null,
        tokenBalance: 1000,
      },
    });

    return {
      success: true,
      message: 'User testing state reset successfully',
    };
  }
}
