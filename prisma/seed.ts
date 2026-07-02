import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const developerPassword = await bcrypt.hash("developer123", 12);
  const clientPassword = await bcrypt.hash("client123", 12);

  const developer = await prisma.user.upsert({
    where: { email: "dev@devcrm.app" },
    update: {},
    create: {
      email: "dev@devcrm.app",
      password: developerPassword,
      role: Role.DEVELOPER,
      profile: {
        create: {
          firstName: "Alex",
          lastName: "Developer",
          company: "DevCRM Studio",
        },
      },
    },
    include: { profile: true },
  });

  const client = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      email: "client@example.com",
      password: clientPassword,
      role: Role.CLIENT,
      profile: {
        create: {
          firstName: "Maria",
          lastName: "Client",
          company: "Example Corp",
        },
      },
    },
    include: { profile: true },
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project" },
    update: {},
    create: {
      id: "seed-project",
      name: "Corporate Website",
      description: "Premium corporate website redesign",
      clientId: client.id,
    },
  });

  const order = await prisma.order.upsert({
    where: { id: "seed-order" },
    update: {},
    create: {
      id: "seed-order",
      projectId: project.id,
      title: "Homepage Redesign",
      description: "Modern homepage with animations",
      status: "IN_PROGRESS",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      position: 0,
    },
  });

  await prisma.task.upsert({
    where: { id: "seed-task" },
    update: {},
    create: {
      id: "seed-task",
      orderId: order.id,
      title: "Hero section update",
      description: "Update hero with new brand colors and typography",
      priority: "HIGH",
      status: "IN_PROGRESS",
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      position: 0,
    },
  });

  console.log("Seed completed:", { developer: developer.email, client: client.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
