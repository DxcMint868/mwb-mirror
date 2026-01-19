import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@/src/prisma/prisma.service';
import { ClerkAuthService } from '@/src/auth/clerk-auth.service';

/**
 * WebSocket Gateway for real-time token balance updates
 *
 * Frontend usage:
 * ```typescript
 * import { io } from 'socket.io-client';
 *
 * const socket = io('http://localhost:3000/token-balance', {
 *   auth: { token: '<clerk-jwt>' }
 * });
 *
 * // Subscribe to your own token balance updates (no clerkUserId needed)
 * socket.emit('subscribe');
 *
 * // Listen for token balance updates
 * socket.on('token-balance:update', (data) => {
 *   console.log('New token balance:', data.tokenBalance);
 * });
 * ```
 */
@WebSocketGateway({
  namespace: 'token-balance',
  cors: {
    origin: process.env.FRONTEND_URL?.split(',').map((s) => s.trim()) ?? [],
    credentials: true,
  },
})
export class TokenBalanceGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TokenBalanceGateway.name);

  // clerkUserId -> Set of socket IDs
  private subscriptions = new Map<string, Set<string>>();

  // socketId -> authenticated clerkUserId
  private socketAuth = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkAuthService: ClerkAuthService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const clerkUserId = await this.clerkAuthService.verifyToken(token);

      // Store authenticated user ID for this socket
      this.socketAuth.set(client.id, clerkUserId);

      this.logger.log(
        `Client ${client.id} authenticated as user: ${clerkUserId}`,
      );
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Get user ID before removing auth
    const clerkUserId = this.socketAuth.get(client.id);

    // Clean up auth
    this.socketAuth.delete(client.id);

    // Clean up subscriptions
    if (clerkUserId) {
      const clients = this.subscriptions.get(clerkUserId);
      if (clients) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.subscriptions.delete(clerkUserId);
        }
      }
    }
  }

  /**
   * Subscribe to token balance updates for authenticated user only
   * No clerkUserId parameter needed - automatically uses authenticated user
   */
  @SubscribeMessage('subscribe')
  async handleSubscribe(@ConnectedSocket() client: Socket) {
    // Get authenticated user ID from socket
    const clerkUserId = this.socketAuth.get(client.id);

    if (!clerkUserId) {
      this.logger.warn(`Unauthenticated subscribe attempt from ${client.id}`);
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    this.logger.log(`Client ${client.id} subscribing to user ${clerkUserId}`);

    // Add client to subscription list
    if (!this.subscriptions.has(clerkUserId)) {
      this.subscriptions.set(clerkUserId, new Set());
    }
    this.subscriptions.get(clerkUserId)!.add(client.id);

    // Join a room for this user
    client.join(`user:${clerkUserId}`);

    // Send current token balance immediately
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkUserId },
        select: {
          clerkUserId: true,
          tokenBalance: true,
          updatedAt: true,
        },
      });

      if (!user) {
        client.emit('error', { message: 'User not found' });
        return;
      }

      client.emit('token-balance:update', {
        clerkUserId: user.clerkUserId,
        tokenBalance: user.tokenBalance,
        timestamp: user.updatedAt,
      });

      this.logger.log(
        `Sent initial token balance to client ${client.id}: ${user.tokenBalance}`,
      );
    } catch (error) {
      this.logger.error(`Error fetching user: ${error.message}`);
      client.emit('error', { message: 'Failed to fetch token balance' });
    }
  }

  /**
   * Unsubscribe from token balance updates
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket) {
    const clerkUserId = this.socketAuth.get(client.id);

    if (!clerkUserId) {
      return;
    }

    this.logger.log(
      `Client ${client.id} unsubscribing from user ${clerkUserId}`,
    );

    // Remove client from subscription list
    const clients = this.subscriptions.get(clerkUserId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.subscriptions.delete(clerkUserId);
      }
    }

    // Leave the room
    client.leave(`user:${clerkUserId}`);
  }

  /**
   * Broadcast token balance update to all subscribed clients
   * Called by services when token balance changes
   */
  broadcastTokenBalanceUpdate(
    clerkUserId: string,
    tokenBalance: number,
    additionalData?: Record<string, any>,
  ) {
    this.logger.log(
      `Broadcasting token balance update: ${clerkUserId} -> ${tokenBalance}`,
    );

    this.server.to(`user:${clerkUserId}`).emit('token-balance:update', {
      clerkUserId,
      tokenBalance,
      timestamp: new Date(),
      ...additionalData,
    });
  }
}
