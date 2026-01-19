import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import {
  createClerkClient,
  type ClerkClient,
  type SessionAuthObject,
} from '@clerk/backend';
import { ConfigService } from '@nestjs/config';

/**
 * Shared Clerk authentication service for both HTTP and WebSocket
 */
@Injectable()
export class ClerkAuthService {
  private readonly logger = new Logger(ClerkAuthService.name);
  public readonly clerkClient: ClerkClient;

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

  /**
   * Verify a JWT token and return the authenticated user ID
   */
  async verifyToken(token: string): Promise<string> {
    // Development mode bypass
    if (process.env.NODE_ENV === 'development') {
      const devUserId = process.env.DEV_CLERK_USER_ID;
      if (devUserId) {
        this.logger.debug(`Dev mode: Using user ID ${devUserId}`);
        return devUserId;
      }
    }

    const jwtToken = token.startsWith('Bearer ') ? token.substring(7) : token;

    const jwtKey =
      this.configService.get<string>('CLERK_JWK_PUBLIC_KEY') ||
      this.configService.get<string>('CLERK_JWT_PUBLIC_KEY');

    try {
      // Create a minimal Web API Request for Clerk authentication
      const clerkRequest = new Request('https://api.example.com/ws-auth', {
        method: 'GET',
        headers: new Headers({
          authorization: `Bearer ${jwtToken}`,
        }),
      });

      // Authenticate the request
      const requestState = await this.clerkClient.authenticateRequest(
        clerkRequest,
        {
          jwtKey: jwtKey || undefined,
        },
      );

      if (!requestState.isAuthenticated) {
        throw new UnauthorizedException(
          `Authentication failed: ${requestState.reason}`,
        );
      }

      const auth = requestState.toAuth();
      if (!auth.userId) {
        throw new UnauthorizedException('No userId in authentication token');
      }

      return auth.userId;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Token verification failed: ${error.message || error}`);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
