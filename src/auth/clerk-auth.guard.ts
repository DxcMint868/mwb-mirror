import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import {
  createClerkClient,
  type ClerkClient,
  type SessionAuthObject,
} from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private readonly clerkClient: ClerkClient;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.getOrThrow<string>('CLERK_SECRET_KEY');
    const publishableKey = this.configService.getOrThrow<string>(
      'CLERK_PUBLISHABLE_KEY',
    );

    this.clerkClient = createClerkClient({
      secretKey,
      publishableKey,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<ExpressRequest & { clerkSession?: SessionAuthObject }>();

    // Local dev-only bypass
    if (process.env.NODE_ENV === 'development') {
      const devUserId =
        request.get('x-dev-clerk-user-id') || process.env.DEV_CLERK_USER_ID;

      if (devUserId) {
        request['clerkSession'] = {
          userId: devUserId,
          sessionId: 'dev-session',
          orgId: null,
          orgRole: null,
          orgSlug: null,
          orgPermissions: [] as string[],
          factorVerificationAge: null,
          sessionClaims: {},
          sessionStatus: 'active',
          actor: null,
        } as unknown as SessionAuthObject;
        return true;
      }
    }

    try {
      // Log incoming authentication data
      const authHeader = request.get('authorization');
      const cookies = request.headers.cookie;

      this.logger.debug('=== Clerk Auth Debug ===');
      this.logger.debug(`Authorization Header: ${authHeader || 'NOT PRESENT'}`);
      this.logger.debug(`Cookies: ${cookies || 'NOT PRESENT'}`);

      const jwtKey =
        this.configService.get<string>('CLERK_JWK_PUBLIC_KEY') ||
        this.configService.getOrThrow<string>('CLERK_JWT_PUBLIC_KEY');

      // Express request.url is relative (/path),
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
          jwtKey,
        },
      );

      if (requestState.isAuthenticated) {
        const auth = requestState.toAuth();
        this.logger.debug(`Authentication successful - User ID: ${auth.userId}`);
        this.logger.debug(`Session ID: ${auth.sessionId}`);
        request['clerkSession'] = auth;
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
