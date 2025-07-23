import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🔄 Désactivation des codes d\'accès par défaut...');
    
    // Désactiver les codes par défaut
    const userCodeUpdate = await prisma.accessCode.updateMany({
      where: { 
        code: { in: ['user123', process.env.DEFAULT_USER_CODE || 'user123'] }
      },
      data: { isActive: false }
    });
    
    const adminCodeUpdate = await prisma.accessCode.updateMany({
      where: { 
        code: { in: ['admin456', process.env.DEFAULT_ADMIN_CODE || 'admin456'] }
      },
      data: { isActive: false }
    });
    
    // Vérifier le statut final
    const allCodes = await prisma.accessCode.findMany();
    
    console.log('✅ Codes désactivés:', {
      userCodes: userCodeUpdate.count,
      adminCodes: adminCodeUpdate.count
    });
    
    return NextResponse.json({
      success: true,
      message: 'Codes d\'accès par défaut désactivés avec succès',
      updated: {
        userCodes: userCodeUpdate.count,
        adminCodes: adminCodeUpdate.count
      },
      codes: allCodes.map(c => ({ 
        code: c.code, 
        type: c.type, 
        isActive: c.isActive 
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
  }
}

// GET pour vérifier le statut
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
      message: 'Statut actuel des codes d\'accès',
      codes,
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