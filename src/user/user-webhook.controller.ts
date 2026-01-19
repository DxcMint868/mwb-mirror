import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ClerkWebhookGuard } from './clerk-webhook.guard';
import { ClerkEventHandlerService } from './clerk-event-handler.service';
import { WebhookEvent } from '@clerk/backend';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('users/webhook')
export class UserWebhookController {
  constructor(
    private readonly clerkEventHandlerService: ClerkEventHandlerService,
  ) {}

  @Post('clerk')
  @UseGuards(ClerkWebhookGuard)
  async handleClerkUserEvents(@Body() event: WebhookEvent) {
    switch (event.type) {
      case 'user.created':
        return this.clerkEventHandlerService.handleUserCreated(event.data);
      case 'user.deleted':
        return this.clerkEventHandlerService.handleUserDeleted(event.data);
      default:
        return { received: true };
    }
  }
}
