import {
  Controller,
  Get,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from '@/src/user/profile.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '@/src/auth/clerk-auth.guard';
import { SessionAuthObject } from '@clerk/backend';
import { GetClerkSession } from '@/src/auth/get-clerk-session.decorator';

@ApiTags('Profile')
@Controller('profile')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    schema: {
      example: {
        tokenBalance: 100,
        lastFreeFlipAt: '2026-01-04T11:56:52.059Z',
        subscriptions: [
          {
            id: '1',
            package: {
              id: '1',
              nameTh: 'แพ็คเกจรายเดือน',
              nameEn: 'Monthly Package',
              priceThb: 100,
              duration: 'month',
            },
            startTime: '2026-01-04T11:56:52.059Z',
            endTime: '2027-01-04T11:56:52.059Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@GetClerkSession() clerkSession: SessionAuthObject) {
    if (!clerkSession?.userId) {
      throw new UnauthorizedException('Missing userId in auth session');
    }
    return this.profileService.getProfile(clerkSession.userId);
  }
}
