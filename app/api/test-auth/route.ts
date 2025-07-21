import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    console.log('🧪 Test d\'authentification avec:', password);
    
    // Simuler exactement la logique d'auth.ts
    const inputValue = password;
    
    // 1. Test comme code d'accès
    console.log('🎫 Recherche en tant que code d\'accès...');
    const accessCode = await prisma.accessCode.findUnique({
      where: {
        code: inputValue,
        isActive: true,
      },
      include: {
        user: true,
      },
    });
    
    console.log('Résultat recherche code d\'accès:', accessCode ? {
      id: accessCode.id,
      code: accessCode.code,
      type: accessCode.type,
      isActive: accessCode.isActive,
      hasUser: !!accessCode.user
    } : 'Aucun code trouvé');
    
    // 2. Lister tous les codes pour debug
    const allCodes = await prisma.accessCode.findMany({
      select: {
        code: true,
        type: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log('📋 Tous les codes dans la DB:', allCodes);
    
    // 3. Test avec recherche case-insensitive
    const codeInsensitive = await prisma.accessCode.findFirst({
      where: {
        code: {
          equals: inputValue,
          mode: 'insensitive'
        },
        isActive: true,
      }
    });
    
    console.log('Code insensitive:', codeInsensitive);
    
    return NextResponse.json({
      inputValue,
      accessCodeFound: !!accessCode,
      accessCodeDetails: accessCode ? {
        id: accessCode.id,
        code: accessCode.code,
        type: accessCode.type,
        isActive: accessCode.isActive,
        hasUser: !!accessCode.user,
        expiresAt: accessCode.expiresAt
      } : null,
      allCodesInDB: allCodes,
      caseInsensitiveFound: !!codeInsensitive,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur test auth:', error);
    return NextResponse.json({
      error: 'Erreur lors du test d\'authentification',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Juste lister tous les codes pour debug rapide
    const codes = await prisma.accessCode.findMany();
    
    return NextResponse.json({
      message: 'Codes d\'accès dans la base de données',
      codes: codes.map(c => ({
        id: c.id,
        code: c.code,
        type: c.type,
        isActive: c.isActive,
        createdAt: c.createdAt,
        expiresAt: c.expiresAt
      })),
      total: codes.length
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Erreur lors de la récupération des codes',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}