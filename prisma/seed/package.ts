import Stripe from 'stripe';
import { PrismaClient, PackageType } from '../../generated/prisma/client';

/**
 * Seeds packages by creating Stripe products/prices first,
 * then inserting the packages into the database with the Stripe Price IDs
 */
export async function seedPackages(prisma: PrismaClient) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    console.warn(
      'STRIPE_SECRET_KEY not found. Skipping Stripe product creation.',
    );
    console.warn('   Packages will be created without Stripe Price IDs.');
  }

  const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, { apiVersion: '2025-12-15.clover' })
    : null;

  if (!stripe) {
    console.error('  ✗ Stripe not configured. Skipping Stripe product creation.');
    return;
  }

  const connectedAccountId = process.env.STRIPE_CONNECTED_ACCOUNT_ID;
  const stripeOptions = connectedAccountId
    ? { stripeAccount: connectedAccountId }
    : {};

  // Package definitions
  const packages = [
    {
      id: 'qx6wsz8ugcpf1a0lrnue63qv',
      type: PackageType.MONTHLY,
      nameTh: 'แพ็คเกจรายเดือน',
      nameEn: 'Monthly Card Reading Package',
      priceThb: 198,
      stripeProduct: {
        name: 'Monthly Card Reading Package',
        description: 'Unlimited card readings for 1 month',
      },
      stripePrice: {
        id: 'price_1SpZuDPFcI0F05No0akAUH5f',
        unit_amount: 19800, // 198 THB in satang
        currency: 'thb',
        recurring: { interval: 'month' as const },
      },
    },
    {
      id: 'xr8yrdrmob4hmxccbuct9f8m',
      type: PackageType.YEARLY,
      nameTh: 'แพ็คเกจรายปี',
      nameEn: 'Yearly Card Reading Package',
      priceThb: 1599,
      stripeProduct: {
        name: 'Yearly Card Reading Package',
        description: 'Unlimited card readings for 1 year',
      },
      stripePrice: {
        id: 'price_1SpZuEPFcI0F05NosJeAe79O',
        unit_amount: 159900, // 1599 THB in satang
        currency: 'thb',
        recurring: { interval: 'year' as const },
      },
    },
    {
      id: 'q3be6sv0iz16w1m43vl0drnr',
      type: PackageType.FLIP_TOKEN_1,
      nameTh: '1 โทเค็นพลิกการ์ด',
      nameEn: '1 Flip Token',
      priceThb: 18,
      stripeProduct: {
        name: '1 Flip Token',
        description: 'Single card flip token',
      },
      stripePrice: {
        id: 'price_1SpMxYPFcI0F05NoIHer0JrB',
        unit_amount: 1800, // 18 THB in satang
        currency: 'thb',
      },
    },
  ];

  for (const pkg of packages) {
    console.log(`\n Processing package: ${pkg.nameEn} (${pkg.type})`);

    let stripePriceId: string | null = pkg.stripePrice?.id ?? null;

    // Create Stripe product and price if Stripe is configured
    try {
      if (!stripePriceId) {
        console.log('Package doesn\'t have a Stripe Price ID, creating product and price...');
        console.log('  → Creating Stripe product...');

        const product = await stripe.products.create(
          {
            name: pkg.stripeProduct.name,
            description: pkg.stripeProduct.description,
            metadata: {
              packageType: pkg.type,
            },
          },
          stripeOptions,
        );
        console.log(`  ✓ Stripe product created: ${product.id}`);

        console.log('  → Creating Stripe price...');
        const price = await stripe.prices.create(
          {
            product: product.id,
            ...pkg.stripePrice,
            metadata: {
              packageType: pkg.type,
            },
          },
          stripeOptions,
        );
        console.log(`  ✓ Stripe price created: ${price.id}`);
        stripePriceId = price.id;
      }
    } catch (error) {
      console.error(`  ✗ Error creating Stripe product/price:`, error);
      console.warn(`  Continuing without Stripe Price ID for ${pkg.type}`);
    }

    // Upsert package in database
    console.log('  → Upserting package in database...');
    await prisma.package.upsert({
      where: { type: pkg.type },
      create: {
        type: pkg.type,
        nameTh: pkg.nameTh,
        nameEn: pkg.nameEn,
        priceThb: pkg.priceThb,
        stripePriceId,
      },
      update: {
        nameTh: pkg.nameTh,
        nameEn: pkg.nameEn,
        priceThb: pkg.priceThb,
        stripePriceId,
      },
    });
    console.log(`  ✓ Package saved to database`);
  }

  console.log('\nAll packages seeded successfully!');
}
