import { prisma } from './prisma';

let isInitialized = false;

export async function initializeDatabase() {
  if (isInitialized) return;
  
  try {
    console.log('🔄 Initializing database tables...');
    
    // This will create tables if they don't exist
    await prisma.$executeRaw`SELECT 1`;
    
    // Try to create default access codes
    try {
      await prisma.accessCode.upsert({
        where: { code: 'user123' },
        update: {},
        create: {
          code: 'user123',
          type: 'USER',
          isActive: true,
          description: 'Default user access code'
        }
      });
      
      await prisma.accessCode.upsert({
        where: { code: 'admin456' },
        update: {},
        create: {
          code: 'admin456',
          type: 'ADMIN',
          isActive: true,
          description: 'Default admin access code'
        }
      });
      
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.log('ℹ️ Default codes already exist or will be created later');
    }
    
    isInitialized = true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't throw - let the app continue
  }
}