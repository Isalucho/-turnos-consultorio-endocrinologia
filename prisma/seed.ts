import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Administración";

  if (!email || !password) {
    throw new Error(
      "Definí ADMIN_EMAIL y ADMIN_PASSWORD en tu .env antes de correr el seed.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", name },
    create: {
      email,
      name,
      passwordHash,
      role: "ADMIN",
      phone: "-",
      dni: "-",
    },
  });

  console.log(`Usuario admin listo: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
