import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetBalanceDto } from './dto/set-balance.dto';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTokenBalance(clerkUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        tokenBalance: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${clerkUserId}`);
    }
    this.logger.debug('Found user: ', user);
    this.logger.log(
      `Token balance for user ${clerkUserId}: ${user.tokenBalance}`,
    );

    return { tokenBalance: user.tokenBalance };
  }

  async setTokenBalance(clerkUserId: string, setBalanceDto: SetBalanceDto) {
    // First check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!existingUser) {
      throw new NotFoundException(`User not found: ${clerkUserId}`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { clerkUserId },
      data: {
        tokenBalance: setBalanceDto.tokenBalance,
      },
      select: {
        tokenBalance: true,
      },
    });

    this.logger.log(
      `Token balance updated for user ${clerkUserId}: ${updatedUser.tokenBalance}`,
    );

    return { tokenBalance: updatedUser.tokenBalance };
  }
}
