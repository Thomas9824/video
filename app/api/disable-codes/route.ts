import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🔒 Désactivation des codes d\'accès par défaut...');
    
    // 1. Test connection
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    // 2. Désactiver les codes par défaut
    const disabledCodes = await prisma.accessCode.updateMany({
      where: {
        code: {
          in: ['user123', 'admin456']
        }
      },
      data: {
        isActive: false
      }
    });
    
    console.log(`✅ ${disabledCodes.count} codes désactivés`);
    
    // 3. Vérifier le statut
    const allCodes = await prisma.accessCode.findMany({
      select: {
        code: true,
        type: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log('📋 Statut des codes:', allCodes.map(c => `${c.code} (${c.type}) - ${c.isActive ? 'ACTIF' : 'INACTIF'}`));
    
    return NextResponse.json({
      success: true,
      message: 'Codes d\'accès par défaut désactivés avec succès',
      disabledCount: disabledCodes.count,
      codes: allCodes.map(c => ({ 
        code: c.code, 
        type: c.type, 
        isActive: c.isActive,
        status: c.isActive ? 'ACTIF' : 'INACTIF'
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la désactivation:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la désactivation des codes',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    // Lister tous les codes pour vérification
    const codes = await prisma.accessCode.findMany({
      select: {
        code: true,
        type: true,
        isActive: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      message: 'Statut actuel des codes d\'accès',
      codes: codes.map(c => ({
        code: c.code,
        type: c.type,
        isActive: c.isActive,
        status: c.isActive ? 'ACTIF' : 'INACTIF',
        createdAt: c.createdAt
      })),
      total: codes.length,
      active: codes.filter(c => c.isActive).length,
      inactive: codes.filter(c => !c.isActive).length
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Erreur lors de la récupération des codes',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}