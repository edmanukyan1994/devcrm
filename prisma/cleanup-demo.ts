import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_CLIENT_EMAIL = "client@example.com";
const SEED_IDS = ["seed-project", "seed-order", "seed-task"];

export async function cleanupDemoData() {
  await prisma.task.deleteMany({ where: { id: { in: SEED_IDS } } });
  await prisma.order.deleteMany({ where: { id: { in: SEED_IDS } } });
  await prisma.project.deleteMany({ where: { id: { in: SEED_IDS } } });

  const demoClient = await prisma.user.findUnique({ where: { email: DEMO_CLIENT_EMAIL } });
  if (demoClient) {
    await prisma.user.delete({ where: { id: demoClient.id } });
    console.log("Removed demo client:", DEMO_CLIENT_EMAIL);
  }

  console.log("Demo data cleanup done");
}

if (process.argv[1]?.includes("cleanup-demo")) {
  cleanupDemoData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
