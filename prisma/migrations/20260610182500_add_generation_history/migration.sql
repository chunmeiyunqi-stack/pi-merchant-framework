-- CreateEnum
CREATE TYPE "GenerationType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "generation_histories" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "pi_uid" TEXT,
    "type" "GenerationType" NOT NULL DEFAULT 'TEXT',
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT DEFAULT '',
    "image_url" TEXT,
    "video_url" TEXT,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,
    "duration_ms" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generation_histories_merchant_id_idx" ON "generation_histories"("merchant_id");

-- CreateIndex
CREATE INDEX "generation_histories_customer_id_idx" ON "generation_histories"("customer_id");

-- CreateIndex
CREATE INDEX "generation_histories_merchant_id_created_at_idx" ON "generation_histories"("merchant_id", "created_at");

-- CreateIndex
CREATE INDEX "generation_histories_pi_uid_idx" ON "generation_histories"("pi_uid");

-- CreateIndex
CREATE INDEX "generation_histories_type_status_created_at_idx" ON "generation_histories"("type", "status", "created_at");

-- AddForeignKey
ALTER TABLE "generation_histories" ADD CONSTRAINT "generation_histories_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_histories" ADD CONSTRAINT "generation_histories_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
