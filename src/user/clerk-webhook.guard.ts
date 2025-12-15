import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { ConfigService } from "@nestjs/config";
import { createHmac } from "crypto";

@Injectable()
export class ClerkWebhookGuard implements CanActivate {
    constructor(private configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const webhookSecret = this.configService.get<string>(
            "CLERK_WEBHOOK_SECRET",
        );

        if (!webhookSecret) {
            throw new UnauthorizedException("Webhook secret not configured");
        }

        // Clerk sends these headers for signature verification
        const svixId = request.headers["svix-id"] as string;
        const svixTimestamp = request.headers["svix-timestamp"] as string;
        const svixSignature = request.headers["svix-signature"] as string;

        if (!svixId || !svixTimestamp || !svixSignature) {
            throw new UnauthorizedException(
                "Missing webhook signature headers",
            );
        }

        // Verify the webhook signature
        const payload = JSON.stringify(request.body);
        const signedContent = `${svixId}.${svixTimestamp}.${payload}`;

        // Clerk uses base64-encoded secret
        const secret = webhookSecret.startsWith("whsec_")
            ? Buffer.from(webhookSecret.slice(6), "base64")
            : webhookSecret;

        const expectedSignature = createHmac("sha256", secret)
            .update(signedContent)
            .digest("base64");

        // Clerk sends multiple signatures, check if any match
        const signatures = svixSignature.split(" ");
        const isValid = signatures.some((sig) => {
            const [version, signature] = sig.split(",");
            return version === "v1" && signature === expectedSignature;
        });

        if (!isValid) {
            throw new UnauthorizedException("Invalid clerk webhook signature");
        }

        // Check timestamp to prevent replay attacks (within 5 minutes)
        const timestamp = parseInt(svixTimestamp, 10);
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestamp) > 300) {
            throw new UnauthorizedException("Clerk webhook timestamp too old");
        }

        return true;
    }
}
