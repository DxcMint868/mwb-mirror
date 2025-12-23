import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { createClerkClient, type ClerkClient } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private readonly clerkClient: ClerkClient;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    const publishableKey = this.configService.get<string>(
      'CLERK_PUBLISHABLE_KEY',
    );

    this.clerkClient = createClerkClient({
      secretKey,
      publishableKey,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ExpressRequest>();

    try {
      const jwtKey = this.configService.get<string>('CLERK_JWT_PUBLIC_KEY');

      // Construct the absolute URL. Express request.url is relative (/path),
      // but Clerk Backend SDK expects a Web API Request object with an absolute URL.
      const protocol = request.protocol;
      const host = request.get('host');
      const fullUrl = `${protocol}://${host}${request.originalUrl || request.url}`;

      // Convert Express request to a Web API Request object that @clerk/backend expects
      const clerkRequest = new Request(fullUrl, {
        method: request.method,
        headers: new Headers(request.headers as any),
      });

      const requestState = await this.clerkClient.authenticateRequest(
        clerkRequest,
        {
          jwtKey: jwtKey || undefined,
        },
      );

      if (requestState.isAuthenticated) {
        // Attach the auth object to the request
        request['user'] = requestState.toAuth();
        return true;
      }

      this.logger.warn(
        `Clerk authentication failed: ${requestState.reason} ${requestState.message || ''}`,
      );
      throw new UnauthorizedException('Invalid authentication token');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `Clerk token verification failed: ${error.message || error}`,
      );
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
