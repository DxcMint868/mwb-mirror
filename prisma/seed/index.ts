import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedArtists } from './artist';
import { seedArts } from './art';
import { seedCards } from './card';
import { seedUsers } from './user';
import { seedPackages } from './package';
import { seedPaymentAccounts } from './paymentAccount';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({
  adapter: adapter,
});

async function main() {
  console.log('Seeding packages...');
  await seedPackages(prisma);

  console.log('Seeding users...');
  await seedUsers(prisma);

  console.log('Seeding payment accounts...');
  await seedPaymentAccounts(prisma);

  console.log('Seeding artists...');
  await seedArtists(prisma);

  console.log('Seeding arts...');
  await seedArts(prisma, { isReuploadMode: false });

  console.log('Seeding cards and card contents...');
  await seedCards(prisma);
}

main()
  .catch(async (error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
