import { PrismaClient } from "@prisma/client";
import { cleanupDemoData } from "./cleanup-demo";

const prisma = new PrismaClient();

async function main() {
  await cleanupDemoData();
  console.log("Seed: demo data removed, no test users created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
