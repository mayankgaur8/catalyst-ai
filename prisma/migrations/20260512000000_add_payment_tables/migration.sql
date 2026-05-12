-- Add payment tracking fields to Subscription
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "provider"         TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingCycle"     TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "trialEndsAt"      TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "stripeSubId"      TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

-- Index for expiry-based queries (e.g. downgrade expired subs)
CREATE INDEX IF NOT EXISTS "Subscription_expiresAt_idx" ON "Subscription"("expiresAt");

-- PaymentOrder: tracks an order before payment is confirmed
CREATE TABLE IF NOT EXISTS "PaymentOrder" (
    "id"           TEXT         NOT NULL,
    "userId"       TEXT         NOT NULL,
    "provider"     TEXT         NOT NULL,
    "providerId"   TEXT         NOT NULL,
    "plan"         "Plan"       NOT NULL,
    "amount"       INTEGER      NOT NULL,
    "currency"     TEXT         NOT NULL DEFAULT 'INR',
    "status"       TEXT         NOT NULL DEFAULT 'created',
    "billingCycle" TEXT         NOT NULL DEFAULT 'monthly',
    "metadata"     JSONB,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentOrder_providerId_key" ON "PaymentOrder"("providerId");
CREATE INDEX IF NOT EXISTS "PaymentOrder_userId_idx"  ON "PaymentOrder"("userId");
CREATE INDEX IF NOT EXISTS "PaymentOrder_status_idx"  ON "PaymentOrder"("status");
CREATE INDEX IF NOT EXISTS "PaymentOrder_createdAt_idx" ON "PaymentOrder"("createdAt");

ALTER TABLE "PaymentOrder"
    ADD CONSTRAINT "PaymentOrder_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PaymentTransaction: immutable record of every captured payment
CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
    "id"              TEXT         NOT NULL,
    "userId"          TEXT         NOT NULL,
    "paymentOrderId"  TEXT,
    "provider"        TEXT         NOT NULL,
    "paymentId"       TEXT         NOT NULL,
    "providerOrderId" TEXT,
    "plan"            "Plan"       NOT NULL,
    "amount"          INTEGER      NOT NULL,
    "currency"        TEXT         NOT NULL DEFAULT 'INR',
    "status"          TEXT         NOT NULL,
    "idempotencyKey"  TEXT,
    "metadata"        JSONB,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_paymentId_key"      ON "PaymentTransaction"("paymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_idempotencyKey_key" ON "PaymentTransaction"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_userId_idx"   ON "PaymentTransaction"("userId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_status_idx"  ON "PaymentTransaction"("status");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_createdAt_idx" ON "PaymentTransaction"("createdAt");

ALTER TABLE "PaymentTransaction"
    ADD CONSTRAINT "PaymentTransaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
