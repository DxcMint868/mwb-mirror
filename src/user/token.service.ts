import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
