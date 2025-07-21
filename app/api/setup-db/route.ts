import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🔄 Configuration de la base de données...');
    
    // 1. Test connection
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    // 2. Create tables using raw SQL (equivalent to prisma db push)
    console.log('🔄 Création des tables...');
    
    // Create User table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "email" TEXT,
        "name" TEXT,
        "role" TEXT NOT NULL DEFAULT 'USER',
        "password" TEXT,
        "passwordSetAt" TIMESTAMP(3),
        "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
        "passwordResetToken" TEXT,
        "passwordResetExpires" TIMESTAMP(3),
        "lastPasswordChange" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    `;
    
    // Create access_codes table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "access_codes" (
        "id" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "userId" TEXT,
        CONSTRAINT "access_codes_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "access_codes_code_key" ON "access_codes"("code");
    `;
    
    // Create other tables
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Video" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "filename" TEXT NOT NULL,
        "originalName" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        "size" INTEGER NOT NULL,
        "duration" INTEGER,
        "thumbnailUrl" TEXT,
        "videoUrl" TEXT NOT NULL,
        "cloudinaryId" TEXT,
        "isPublished" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "uploadedById" TEXT,
        CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ActivityLog" (
        "id" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "details" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT,
        CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
      );
    `;
    
    console.log('✅ Tables créées avec succès');
    
    // 3. Create default access codes
    console.log('🔄 Création des codes d\'accès par défaut...');
    
    const userCode = await prisma.accessCode.upsert({
      where: { code: 'user123' },
      update: {},
      create: {
        code: 'user123',
        type: 'USER',
        isActive: true,
      }
    });
    
    const adminCode = await prisma.accessCode.upsert({
      where: { code: 'admin456' },
      update: {},
      create: {
        code: 'admin456',
        type: 'ADMIN',
        isActive: true,
      }
    });
    
    console.log('✅ Codes d\'accès créés');
    
    // 4. Verify everything
    const allCodes = await prisma.accessCode.findMany();
    console.log('📋 Codes disponibles:', allCodes.map(c => `${c.code} (${c.type})`));
    
    return NextResponse.json({
      success: true,
      message: 'Base de données configurée avec succès',
      tables: ['User', 'access_codes', 'Video', 'ActivityLog'],
      codes: allCodes.map(c => ({ 
        code: c.code, 
        type: c.type, 
        isActive: c.isActive 
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la configuration de la base de données',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}