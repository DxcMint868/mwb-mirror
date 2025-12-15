import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from "@nestjs/common";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { Request } from "express";

@Injectable()
export class ClerkAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException("No authentication token provided");
        }

        try {
            const sessionClaims = await clerkClient.verifyToken(token);
            request["user"] = sessionClaims;
            return true;
        } catch (error) {
            throw new UnauthorizedException("Invalid authentication token");
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(" ") ?? [];
        return type === "Bearer" ? token : undefined;
    }
}
