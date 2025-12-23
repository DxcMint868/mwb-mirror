import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // return true;
    const request = context.switchToHttp().getRequest<Request>();

    try {
      const clerkClient = createClerkClient({
        secretKey: this.configService.get('CLERK_SECRET_KEY'),
      });
      const sessionClaims = await clerkClient.authenticateRequest(request, {
        jwtKey: this.configService.get('CLERK_JWT_PUBLIC_KEY'),
      });
      request['user'] = sessionClaims;
      return true;
    } catch (error) {
      this.logger.error(`Clerk token verification failed: ${error}`);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
