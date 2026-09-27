import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany().then(console.log).finally(() => prisma.$disconnect());
//# sourceMappingURL=get_users.js.map