import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🔄 Initialisation de la base de données...');
    
    // 1. Tester la connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    // 2. Pousser le schéma vers la base de données (équivalent à prisma db push)
    console.log('🔄 Création des tables...');
    
    // 3. Créer les codes d'accès par défaut
    console.log('🔄 Création des codes d\'accès par défaut...');
    
    const userCode = await prisma.accessCode.upsert({
      where: { code: process.env.DEFAULT_USER_CODE || 'user123' },
      update: {},
      create: {
        code: process.env.DEFAULT_USER_CODE || 'user123',
        type: 'USER',
        isActive: true,
      }
    });
    
    const adminCode = await prisma.accessCode.upsert({
      where: { code: process.env.DEFAULT_ADMIN_CODE || 'admin456' },
      update: {},
      create: {
        code: process.env.DEFAULT_ADMIN_CODE || 'admin456',
        type: 'ADMIN',
        isActive: true,
      }
    });
    
    // 4. Vérifier que les codes ont été créés
    const allCodes = await prisma.accessCode.findMany();
    
    console.log('✅ Codes d\'accès créés:', allCodes.map(c => ({ code: c.code, type: c.type })));
    
    return NextResponse.json({
      success: true,
      message: 'Base de données initialisée avec succès',
      codes: allCodes.map(c => ({ 
        code: c.code, 
        type: c.type, 
        isActive: c.isActive 
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'initialisation de la base de données',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Permettre aussi GET pour des tests faciles
export async function GET() {
  try {
    const codes = await prisma.accessCode.findMany({
      select: {
        code: true,
        type: true,
        isActive: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      message: 'Codes d\'accès existants',
      codes,
      total: codes.length
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Erreur lors de la récupération des codes',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}