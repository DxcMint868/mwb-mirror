-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'OMISE');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('MONTHLY', 'YEARLY', 'FLIP_TOKEN_1');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'PROMPT_PAY', 'TRUE_MONEY');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "token_balance" INTEGER NOT NULL DEFAULT 0,
    "last_free_flip_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_account" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_customer_id" TEXT NOT NULL,
    "default_payment_method_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package" (
    "id" TEXT NOT NULL,
    "type" "PackageType" NOT NULL,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "price_thb" DECIMAL(65,30) NOT NULL,
    "stripe_price_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "payment_provider" "PaymentProvider" NOT NULL,
    "provider_subscription_id" TEXT,
    "provider_metadata" JSONB,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "price_paid_thb" DECIMAL(65,30) NOT NULL,
    "payment_id" TEXT NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_purchase" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "price_paid_thb" DECIMAL(65,30) NOT NULL,
    "tokens_received" INTEGER NOT NULL,
    "payment_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_card" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "description" TEXT,
    "specialties" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "art" (
    "id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "art_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card" (
    "id" TEXT NOT NULL,
    "period_start" TIMESTAMPTZ NOT NULL,
    "period_end" TIMESTAMPTZ NOT NULL,
    "art_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_content" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "content_json" JSONB NOT NULL,

    CONSTRAINT "card_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "price_thb" DECIMAL(65,30) NOT NULL,
    "artist_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_content" (
    "id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_clerk_user_id_key" ON "user"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_account_clerk_user_id_provider_key" ON "payment_account"("clerk_user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "payment_account_provider_provider_customer_id_key" ON "payment_account"("provider", "provider_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_type_key" ON "package"("type");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_clerk_user_id_package_id_key" ON "subscription"("clerk_user_id", "package_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payment_provider_provider_subscription_id_key" ON "subscription"("payment_provider", "provider_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_period_start_period_end_key" ON "card"("period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "card_content_card_id_language_code_key" ON "card_content"("card_id", "language_code");

-- AddForeignKey
ALTER TABLE "payment_account" ADD CONSTRAINT "payment_account_clerk_user_id_fkey" FOREIGN KEY ("clerk_user_id") REFERENCES "user"("clerk_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_clerk_user_id_fkey" FOREIGN KEY ("clerk_user_id") REFERENCES "user"("clerk_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_clerk_user_id_fkey" FOREIGN KEY ("clerk_user_id") REFERENCES "user"("clerk_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_purchase" ADD CONSTRAINT "token_purchase_clerk_user_id_fkey" FOREIGN KEY ("clerk_user_id") REFERENCES "user"("clerk_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_purchase" ADD CONSTRAINT "token_purchase_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_purchase" ADD CONSTRAINT "token_purchase_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_card" ADD CONSTRAINT "saved_card_clerk_user_id_fkey" FOREIGN KEY ("clerk_user_id") REFERENCES "user"("clerk_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_card" ADD CONSTRAINT "saved_card_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "art" ADD CONSTRAINT "art_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card" ADD CONSTRAINT "card_art_id_fkey" FOREIGN KEY ("art_id") REFERENCES "art"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_content" ADD CONSTRAINT "card_content_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_content" ADD CONSTRAINT "product_content_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
