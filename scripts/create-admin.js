const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function run() {
  const prisma = new PrismaClient();
  try {
    const password_hash = await bcrypt.hash('CampusHub!234', 10);
    const adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
    if (!adminRole) {
      throw new Error('admin role missing');
    }

    const user = await prisma.user.upsert({
      where: { email: 'admin@campushub.local' },
      update: {
        password_hash,
        is_active: true,
        role_id: adminRole.role_id,
        name: 'CampusHub Admin',
      },
      create: {
        name: 'CampusHub Admin',
        email: 'admin@campushub.local',
        password_hash,
        role_id: adminRole.role_id,
        is_active: true,
      },
    });

    console.log('Upserted admin:', user);
  } catch (err) {
    console.error('FAILED', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
