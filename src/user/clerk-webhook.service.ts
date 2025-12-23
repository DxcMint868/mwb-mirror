import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/src/prisma/prisma.service';
import { WebhookEvent } from '@clerk/backend';

@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleUserCreated(userData: WebhookEvent['data']) {
    this.logger.log(`Creating user: ${userData.id}`);

    if (!userData.id) {
      this.logger.error("Clerk user data is missing 'id' field");
      throw new BadRequestException('Missing user ID in webhook data');
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          clerkUserId: userData.id,
        },
      });

      this.logger.log(`User created successfully: ${user.id}`);
      return { success: true, userId: user.id };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create user: ${errorMessage}`);
      throw error;
    }
  }

  async handleUserDeleted(userData: WebhookEvent['data']) {
    this.logger.log(`Deleting user: ${userData.id}`);

    try {
      await this.prisma.user.delete({
        where: { clerkUserId: userData.id },
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete user: ${errorMessage}`);
      throw error;
    }
  }
}
