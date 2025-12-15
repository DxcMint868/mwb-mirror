import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ClerkUser } from "./types/clerk-user.interface";

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): ClerkUser => {
        const request = ctx.switchToHttp().getRequest<{ user: ClerkUser }>();
        return request.user;
    },
);
