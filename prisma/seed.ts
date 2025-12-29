import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Define roles
  const roles = [
    { name: 'admin', description: 'Administrator with full system access' },
    { name: 'staff', description: 'Staff member with event management access' },
    { name: 'user', description: 'Regular user with basic access' },
  ];

  // Create roles
  for (const role of roles) {
    const existing = await prisma.role.findUnique({
      where: { name: role.name },
    });

    if (!existing) {
      await prisma.role.create({
        data: {
          name: role.name,
        },
      });
      console.log(`✓ Created role: ${role.name}`);
    } else {
      console.log(`✓ Role already exists: ${role.name}`);
    }
  }

  // Seed a default admin user only when no users exist
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const adminRole =
      (await prisma.role.findUnique({ where: { name: 'admin' } })) ||
      (await prisma.role.create({ data: { name: 'admin' } }));

    const defaultPassword = 'CampusHub!234';
    const password_hash = await bcrypt.hash(defaultPassword, 10);

    await prisma.user.create({
      data: {
        name: 'CampusHub Admin',
        email: 'admin@campushub.local',
        password_hash,
        role_id: adminRole.role_id,
        is_active: true,
      },
    });
    console.log('✓ Created default admin user: admin@campushub.local');
  } else {
    console.log('✓ Users already exist; default admin seed skipped');
  }

  console.log('\n✅ Database seed completed successfully!');
  console.log('\nRoles summary:');
  const allRoles = await prisma.role.findMany();
  allRoles.forEach((r) => {
    console.log(`  - ${r.name} (ID: ${r.role_id})`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
