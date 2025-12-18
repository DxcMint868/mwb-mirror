import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from "@nestjs/common";
import { verifyWebhook } from "@clerk/express/webhooks";
import { Logger } from "@nestjs/common";
import { type Request } from "express";

@Injectable()
export class ClerkWebhookGuard implements CanActivate {
    private readonly logger = new Logger(ClerkWebhookGuard.name);

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();

        try {
            const evt = await verifyWebhook(request);
            // Attach the verified event to the request for the controller to use
            request.body = evt;
        } catch (error) {
            this.logger.error(`Clerk webhook verification failed: ${error}`);
            throw new UnauthorizedException("Invalid clerk webhook signature");
        }

        return true;
    }
}
