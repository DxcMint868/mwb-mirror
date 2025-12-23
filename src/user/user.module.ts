import { Module } from '@nestjs/common';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkWebhookService } from './clerk-webhook.service';
import { ClerkWebhookGuard } from './clerk-webhook.guard';

@Module({
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService, ClerkWebhookGuard],
})
export class UserModule {}
