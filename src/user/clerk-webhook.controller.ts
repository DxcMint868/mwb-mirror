import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ClerkWebhookGuard } from "./clerk-webhook.guard";
import { ClerkWebhookService } from "./clerk-webhook.service";
import { WebhookEvent } from "@clerk/backend";

@Controller("clerk-webhook")
export class ClerkWebhookController {
    constructor(private readonly webhooksService: ClerkWebhookService) {}

    @Post()
    @UseGuards(ClerkWebhookGuard)
    async handleClerkWebhook(@Body() event: WebhookEvent) {
        switch (event.type) {
            case "user.created":
                return this.webhooksService.handleUserCreated(event.data);
            case "user.deleted":
                return this.webhooksService.handleUserDeleted(event.data);
            default:
                return { received: true };
        }
    }
}
