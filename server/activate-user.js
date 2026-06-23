// Quick script to activate test user
import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

async function activateUser() {
  try {
    const user = await prisma.users.update({
      where: { email: 'testuser@email.com' },
      data: { is_active: true }
    });
    console.log('✅ User activated:', user.name, user.email);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

activateUser();
