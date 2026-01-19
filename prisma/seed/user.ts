import { PrismaClient } from '@/generated/prisma/client';
import 'dotenv/config';

export async function seedUsers(prisma: PrismaClient) {
  const users = [
    {
      clerkUserId: 'user_37vKmxWqe1ED1z1yeYu1Uyq9k4h',
      tokenBalance: 420,
    },
    {
      clerkUserId: 'user_37pR8W4iRY2xV9kjB9b5ouL9bMT',
    },
    {
      clerkUserId: 'user_37jbCqY3k8ng67KgmlTzSKwERw6',
    },
    {
      clerkUserId: 'user_37FrhTJMfiBDe1UK6G2oeVpUMY2',
    },
    {
      clerkUserId: 'user_37EojJ3PY8Jc0InVq38KJfqiU6r',
    },
    {
      clerkUserId: 'user_37CtJykd8XxIEydMgCFVhVnk5Ou',
    },
  ];

  const devClerkUserId = process.env.DEV_CLERK_USER_ID;
  if (devClerkUserId) {
    const alreadyHasDevUser = users.some(
      (user) => user.clerkUserId === devClerkUserId,
    );
    if (!alreadyHasDevUser) {
      users.push({
        clerkUserId: devClerkUserId,
      });
    }
  }

  for (const user of users) {
    await prisma.user.upsert({
      where: { clerkUserId: user.clerkUserId },
      update: {
        ...user,
      },
      create: {
        ...user,
      },
    });
    console.log(`Created/Updated user: ${user.clerkUserId}`);
  }
}
