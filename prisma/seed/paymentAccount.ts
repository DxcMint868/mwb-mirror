import type { PrismaClient } from '../../generated/prisma/client';
import { PaymentProvider } from '../../generated/prisma/client';

export async function seedPaymentAccounts(prisma: PrismaClient) {
  const accounts = [
    {
      clerkUserId: 'user_37FrhTJMfiBDe1UK6G2oeVpUMY2',
      provider: PaymentProvider.STRIPE,
      providerCustomerId: 'cus_Tn0JWXmGy1pCA0',
    },
    {
      clerkUserId: 'user_37vKmxWqe1ED1z1yeYu1Uyq9k4h',
      provider: PaymentProvider.STRIPE,
      providerCustomerId: 'cus_ToC4y8lDcsppMl',
    }
  ]

  for (const account of accounts) {
    await prisma.paymentAccount.upsert({
      where: {
        clerkUserId_provider: {
          clerkUserId: account.clerkUserId,
          provider: account.provider,
        },
      },
      create: account,
      update: account,
    })
  }
}