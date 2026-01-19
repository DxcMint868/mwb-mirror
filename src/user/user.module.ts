import { Module } from '@nestjs/common';
import { UserWebhookController } from '@/src/user/user-webhook.controller';
import { ClerkEventHandlerService } from '@/src/user/clerk-event-handler.service';
import { ClerkWebhookGuard } from '@/src/user/clerk-webhook.guard';
import { ProfileController } from '@/src/user/profile.controller';
import { ProfileService } from '@/src/user/profile.service';
import { TokenController } from '@/src/user/token.controller';
import { TokenService } from '@/src/user/token.service';
import { TokenBalanceGateway } from '@/src/user/token-balance.gateway';
import { AuthModule } from '@/src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UserWebhookController, ProfileController, TokenController],
  providers: [
    ClerkEventHandlerService,
    ClerkWebhookGuard,
    ProfileService,
    TokenService,
    TokenBalanceGateway,
  ],
  exports: [TokenBalanceGateway],
})
export class UserModule {}
