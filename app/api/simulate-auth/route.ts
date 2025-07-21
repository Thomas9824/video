import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    console.log('🧪 Simulation complète du processus d\'authentification');
    
    const inputValue = password;
    
    // 1. Chercher le code d'accès
    const accessCode = await prisma.accessCode.findUnique({
      where: {
        code: inputValue,
        isActive: true,
      },
      include: {
        user: true,
      },
    });
    
    if (!accessCode) {
      return NextResponse.json({
        success: false,
        error: 'Code d\'accès non trouvé',
        inputValue
      });
    }
    
    console.log('✅ Code d\'accès trouvé:', accessCode.code);
    
    // 2. Vérifier expiration
    if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Code d\'accès expiré',
        accessCode: {
          code: accessCode.code,
          expiresAt: accessCode.expiresAt
        }
      });
    }
    
    console.log('✅ Code d\'accès valide et non expiré');
    
    // 3. Créer ou récupérer l'utilisateur
    let user = accessCode.user;
    let userCreated = false;
    
    if (!user) {
      console.log('🔄 Création d\'un nouvel utilisateur...');
      try {
        user = await prisma.user.create({
          data: {
            role: accessCode.type === 'ADMIN' ? 'ADMIN' : 'USER',
          },
        });
        
        console.log('✅ Utilisateur créé:', user.id);
        userCreated = true;
        
        // 4. Lier l'utilisateur au code d'accès
        await prisma.accessCode.update({
          where: { id: accessCode.id },
          data: { userId: user.id },
        });
        
        console.log('✅ Code d\'accès lié à l\'utilisateur');
        
      } catch (createError) {
        console.error('❌ Erreur création utilisateur:', createError);
        return NextResponse.json({
          success: false,
          error: 'Erreur lors de la création de l\'utilisateur',
          details: createError instanceof Error ? createError.message : 'Erreur inconnue',
          accessCodeFound: true
        }, { status: 500 });
      }
    } else {
      console.log('✅ Utilisateur existant trouvé:', user.id);
    }
    
    // 5. Log d'activité
    try {
      await prisma.activityLog.create({
        data: {
          action: 'LOGIN_ACCESS_CODE',
          details: `Connexion avec code ${accessCode.type}`,
          userId: user.id,
        },
      });
      console.log('✅ Log d\'activité créé');
    } catch (logError) {
      console.log('⚠️ Erreur log (non critique):', logError);
    }
    
    // 6. Retourner les données utilisateur (format NextAuth)
    const authUser = {
      id: user.id,
      email: user.email || undefined,
      name: user.name || undefined,
      role: user.role as 'USER' | 'ADMIN',
    };
    
    console.log('✅ Authentification simulée réussie');
    
    return NextResponse.json({
      success: true,
      message: 'Authentification simulée réussie',
      user: authUser,
      userCreated,
      accessCode: {
        code: accessCode.code,
        type: accessCode.type
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur globale simulation auth:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la simulation d\'authentification',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}