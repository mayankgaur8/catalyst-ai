-- AlterTable
ALTER TABLE "Memory" ADD COLUMN     "embedding" JSONB;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "embedding" JSONB;
