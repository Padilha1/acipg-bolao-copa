import { buildApp } from "./app.js";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";

const app = await buildApp();

try {
  await prisma.$connect();

  await app.listen({
    host: "0.0.0.0",
    port: env.PORT,
  });

  console.log(
    `Server running on port ${env.PORT}, connected to DB: ${new Date().toISOString()}`,
  );
} catch (error) {
  console.error(
    `Server failed to start or connect to DB: ${new Date().toISOString()}`,
  );
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
