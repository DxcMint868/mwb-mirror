import { PrismaService } from '@/src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(clerkUserId: string) {
    const profile = await this.prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        subscriptions: {
          where: { endTime: { gt: new Date() } },
          select: {
            id: true,
            package: {
              select: {
                id: true,
                nameTh: true,
                nameEn: true,
                priceThb: true,
              },
            },
            startTime: true,
            endTime: true,
          },
        },
      },
    });
    if (!profile) {
      throw new NotFoundException(`User not found: ${clerkUserId}`);
    }
    return profile;
  }
}
