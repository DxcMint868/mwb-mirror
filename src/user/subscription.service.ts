import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async cancelSubscription(
    clerkUserId: string,
    cancelSubscriptionDto: CancelSubscriptionDto,
  ) {
    // Find the package by type
    const packageRecord = await this.prisma.package.findUnique({
      where: { type: cancelSubscriptionDto.packageType },
    });

    if (!packageRecord) {
      throw new NotFoundException(
        `Package not found with type: ${cancelSubscriptionDto.packageType}`,
      );
    }

    // Find the active subscription for this user and package
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        clerkUserId_packageId: {
          clerkUserId,
          packageId: packageRecord.id,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription not found for user ${clerkUserId} with package type ${cancelSubscriptionDto.packageType}`,
      );
    }

    // Mark the subscription as voided
    const voidedSubscription = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        is_voided: true,
        voided_at: new Date(),
      },
      include: {
        package: {
          select: {
            id: true,
            type: true,
            nameTh: true,
            nameEn: true,
          },
        },
      },
    });

    this.logger.log(
      `Subscription voided for user ${clerkUserId}, subscription ID: ${voidedSubscription.id}, package type: ${cancelSubscriptionDto.packageType}`,
    );

    return {
      id: voidedSubscription.id,
      packageType: voidedSubscription.package.type,
      packageName: {
        th: voidedSubscription.package.nameTh,
        en: voidedSubscription.package.nameEn,
      },
      isVoided: voidedSubscription.is_voided,
      voidedAt: voidedSubscription.voided_at,
    };
  }
}
