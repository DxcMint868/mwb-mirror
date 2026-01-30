import {
  Body,
  Controller,
  Get,
  Patch,
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
import { TokenService } from '@/src/user/token.service';
import { SessionAuthObject } from '@clerk/backend';
import { GetClerkSession } from '@/src/auth/get-clerk-session.decorator';
import { SetBalanceDto } from './dto/set-balance.dto';

@ApiTags('Token')
@Controller('tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get token balance of the current user' })
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Token balance',
    schema: {
      example: { tokenBalance: 100 },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing/invalid token or missing userId',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getTokenBalance(@GetClerkSession() clerkSession: SessionAuthObject) {
    if (!clerkSession?.userId) {
      throw new UnauthorizedException('Missing userId in auth session');
    }
    return this.tokenService.getTokenBalance(clerkSession.userId);
  }

  @Patch('balance')
  @ApiOperation({ summary: "Set the current user's token balance" })
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Token balance updated successfully',
    schema: {
      example: { tokenBalance: 150 },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing/invalid token or missing userId',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async setTokenBalance(
    @GetClerkSession() clerkSession: SessionAuthObject,
    @Body() setBalanceDto: SetBalanceDto,
  ) {
    if (!clerkSession?.userId) {
      throw new UnauthorizedException('Missing userId in auth session');
    }
    return this.tokenService.setTokenBalance(
      clerkSession.userId,
      setBalanceDto,
    );
  }
}
