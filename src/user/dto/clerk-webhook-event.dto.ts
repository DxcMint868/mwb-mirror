export class ClerkWebhookEventDto {
    type: string;
    data: {
        id: string;
        email_addresses?: Array<{ email_address: string }>;
        created_at: number;
        [key: string]: any;
    };
}
