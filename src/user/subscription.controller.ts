import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '@/src/auth/clerk-auth.guard';
import { SubscriptionService } from '@/src/user/subscription.service';
import { SessionAuthObject } from '@clerk/backend';
import { GetClerkSession } from '@/src/auth/get-clerk-session.decorator';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';

@ApiTags('Subscription')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel a subscription by package type' })
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
    schema: {
      example: {
        id: 'sub_123',
        packageType: 'MONTHLY',
        packageName: {
          th: 'แพ็คเกจรายเดือน',
          en: 'Monthly Package',
        },
        isVoided: true,
        voidedAt: '2026-01-30T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing/invalid token or missing userId',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription or package not found',
  })
  async cancelSubscription(
    @GetClerkSession() clerkSession: SessionAuthObject,
    @Body() cancelSubscriptionDto: CancelSubscriptionDto,
  ) {
    if (!clerkSession?.userId) {
      throw new UnauthorizedException('Missing userId in auth session');
    }
    return this.subscriptionService.cancelSubscription(
      clerkSession.userId,
      cancelSubscriptionDto,
    );
  }
}
