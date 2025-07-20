import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePassword, generateTemporaryPassword } from '@/lib/password';

// GET - Récupérer la liste des utilisateurs avec leurs statuts de mot de passe
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer tous les utilisateurs avec leurs informations de mot de passe
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        passwordSetAt: true,
        mustChangePassword: true,
        lastPasswordChange: true,
        // Ne pas inclure le mot de passe haché pour des raisons de sécurité
        _count: {
          select: {
            sessions: true,
            accessCodes: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Enrichir les données avec des informations sur le statut du mot de passe
    const enrichedUsers = users.map(user => ({
      ...user,
      passwordStatus: {
        hasPassword: !!user.passwordSetAt,
        mustChangePassword: user.mustChangePassword,
        daysSinceLastChange: user.lastPasswordChange 
          ? Math.floor((Date.now() - user.lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        isPasswordExpired: user.lastPasswordChange 
          ? (Date.now() - user.lastPasswordChange.getTime()) > (90 * 24 * 60 * 60 * 1000) // 90 jours
          : false,
      }
    }));

    // Logger l'accès à la liste des utilisateurs
    await prisma.activityLog.create({
      data: {
        action: 'USERS_LIST_ACCESSED',
        details: 'Liste des utilisateurs consultée',
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json({
      users: enrichedUsers,
      total: users.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, role = 'USER', password, generateTemporary = false } = body;

    // Validation des données requises
    if (!email && !name) {
      return NextResponse.json(
        { error: 'Email ou nom requis' },
        { status: 400 }
      );
    }

    if (role && !['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide. Doit être USER ou ADMIN' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Un utilisateur avec cet email existe déjà' },
          { status: 409 }
        );
      }
    }

    let hashedPassword = null;
    let temporaryPassword = null;

    // Gestion du mot de passe
    if (password && !generateTemporary) {
      // Utiliser le mot de passe fourni
      const validation = validatePassword(password);
      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: 'Mot de passe invalide',
            details: validation.errors 
          },
          { status: 400 }
        );
      }
      hashedPassword = await hashPassword(password);
    } else if (generateTemporary) {
      // Générer un mot de passe temporaire
      temporaryPassword = generateTemporaryPassword();
      hashedPassword = await hashPassword(temporaryPassword);
    }

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email: email || null,
        name: name || null,
        role,
        password: hashedPassword,
        passwordSetAt: hashedPassword ? new Date() : null,
        mustChangePassword: !!temporaryPassword,
        lastPasswordChange: hashedPassword ? new Date() : null,
      }
    });

    // Logger la création
    await prisma.activityLog.create({
      data: {
        action: 'USER_CREATED',
        details: `Utilisateur créé: ${email || name || newUser.id}${temporaryPassword ? ' avec mot de passe temporaire' : ''}`,
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    const response: any = {
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
        hasPassword: !!hashedPassword,
        mustChangePassword: newUser.mustChangePassword,
      }
    };

    // Retourner le mot de passe temporaire si généré
    if (temporaryPassword) {
      response.temporaryPassword = temporaryPassword;
      response.warning = 'Conservez ce mot de passe temporaire - il ne sera plus affiché';
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
    await prisma.activityLog.create({
      data: {
        action: 'USER_CREATION_ERROR',
        details: `Erreur lors de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      },
    });

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}