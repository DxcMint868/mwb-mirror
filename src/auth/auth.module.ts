import { Module } from '@nestjs/common';
import { ClerkAuthGuard } from '@/src/auth/clerk-auth.guard';
import { ClerkAuthService } from '@/src/auth/clerk-auth.service';

@Module({
  providers: [ClerkAuthGuard, ClerkAuthService],
  exports: [ClerkAuthGuard, ClerkAuthService],
})
export class AuthModule { }
