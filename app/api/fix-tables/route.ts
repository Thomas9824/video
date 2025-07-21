import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🔄 Correction des tables...');
    
    // 1. Test connection
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    // 2. Drop existing tables with wrong names
    console.log('🗑️ Suppression des anciennes tables...');
    
    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS "User" CASCADE;`;
      console.log('✅ Table "User" supprimée');
    } catch (e) {
      console.log('ℹ️ Table "User" n\'existait pas');
    }
    
    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS "Video" CASCADE;`;
      console.log('✅ Table "Video" supprimée');
    } catch (e) {
      console.log('ℹ️ Table "Video" n\'existait pas');
    }
    
    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS "ActivityLog" CASCADE;`;
      console.log('✅ Table "ActivityLog" supprimée');
    } catch (e) {
      console.log('ℹ️ Table "ActivityLog" n\'existait pas');
    }
    
    // 3. Create tables with correct names (matching Prisma schema)
    console.log('🔄 Création des tables avec les bons noms...');
    
    // Create users table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
    `;
    
    // Create access_codes table (should already exist with correct name)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "access_codes" (
        "id" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT,
        CONSTRAINT "access_codes_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "access_codes_code_key" ON "access_codes"("code");
    `;
    
    // Create videos table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "videos" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "uploadedById" TEXT,
        CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
      );
    `;
    
    // Create activity_logs table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "activity_logs" (
        "id" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "details" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT,
        CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
      );
    `;
    
    // Create sessions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" TEXT NOT NULL,
        "sessionToken" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "sessions_sessionToken_key" ON "sessions"("sessionToken");
    `;
    
    console.log('✅ Tables créées avec les bons noms');
    
    // 4. Ensure access codes exist
    console.log('🔄 Vérification des codes d\'accès...');
    
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
    
    console.log('✅ Codes d\'accès vérifiés');
    
    // 5. Verify everything
    const allCodes = await prisma.accessCode.findMany();
    console.log('📋 Codes disponibles:', allCodes.map(c => `${c.code} (${c.type})`));
    
    return NextResponse.json({
      success: true,
      message: 'Tables corrigées avec succès - noms compatibles avec Prisma',
      tablesFixed: ['User → users', 'Video → videos', 'ActivityLog → activity_logs'],
      tablesCreated: ['users', 'access_codes', 'videos', 'activity_logs', 'sessions'],
      codes: allCodes.map(c => ({ 
        code: c.code, 
        type: c.type, 
        isActive: c.isActive 
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la correction des tables',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}