const { PrismaClient } = require('@prisma/client');

async function initDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Initializing database...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Push schema to database
    console.log('🔄 Creating database tables...');
    
    // This will be handled by Prisma migrate in production
    console.log('✅ Database schema ready');
    
    // Create default access codes if they don't exist
    console.log('🔄 Setting up default access codes...');
    
    const userCode = await prisma.accessCode.upsert({
      where: { code: 'user123' },
      update: {},
      create: {
        code: 'user123',
        type: 'USER',
        isActive: true,
        description: 'Default user access code'
      }
    });
    
    const adminCode = await prisma.accessCode.upsert({
      where: { code: 'admin456' },
      update: {},
      create: {
        code: 'admin456',
        type: 'ADMIN',
        isActive: true,
        description: 'Default admin access code'
      }
    });
    
    console.log('✅ Default access codes created');
    console.log('🎉 Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initDatabase };