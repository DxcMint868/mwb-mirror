import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SessionAuthObject } from '@clerk/backend';

export const GetClerkSession = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): any => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ clerkSession?: SessionAuthObject }>();
    const clerkSession = request['clerkSession'];

    return data
      ? clerkSession?.[data as keyof SessionAuthObject]
      : clerkSession;
  },
);
