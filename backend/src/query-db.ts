import prisma from './config/database.js';
import fs from 'fs';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, passwordHash: true }
  });
  fs.writeFileSync('src/db-result.json', JSON.stringify({ users }, null, 2), 'utf-8');
}

main().catch(console.error);
