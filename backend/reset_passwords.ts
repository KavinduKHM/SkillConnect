import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  await prisma.user.updateMany({
    where: {
      email: {
        in: ['admin@skillconnect.com', 'asheni@skillconnect.com', 'sharer@test.com']
      }
    },
    data: {
      passwordHash
    }
  });
  console.log('Successfully reset passwords for all accounts to: password123');
}

run().finally(() => prisma.$disconnect());
