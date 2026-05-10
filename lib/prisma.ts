import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { setDependencyStatus } from "@/lib/runtime/ops";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/catprep";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

pool.on("error", (error) => {
  setDependencyStatus("db", "degraded", error.message);
  console.error("[PrismaPool]", error.message);
});

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
