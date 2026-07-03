import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Intentionally empty — no demo users or test data.
}

main()
  .finally(() => prisma.$disconnect());
