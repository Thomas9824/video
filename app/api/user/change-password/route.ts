import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, validatePassword } from '@/lib/password';

// POST - Changer son propre mot de passe
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword) {
      return NextResponse.json(
        { error: 'Nouveau mot de passe requis' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur actuel
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Si l'utilisateur a déjà un mot de passe, vérifier l'ancien
    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Mot de passe actuel requis' },
          { status: 400 }
        );
      }

      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        // Logger la tentative de changement avec mauvais mot de passe
        await prisma.activityLog.create({
          data: {
            action: 'PASSWORD_CHANGE_FAILED',
            details: 'Tentative de changement de mot de passe avec mauvais mot de passe actuel',
            userId: session.user.id,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
          },
        });

        return NextResponse.json(
          { error: 'Mot de passe actuel incorrect' },
          { status: 400 }
        );
      }
    }

    // Valider le nouveau mot de passe
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Nouveau mot de passe invalide',
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (user.password && await verifyPassword(newPassword, user.password)) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit être différent du mot de passe actuel' },
        { status: 400 }
      );
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        passwordSetAt: new Date(),
        mustChangePassword: false, // Réinitialiser le flag de changement obligatoire
        lastPasswordChange: new Date(),
        // Réinitialiser les tokens de reset si ils existent
        passwordResetToken: null,
        passwordResetExpires: null,
      }
    });

    // Logger le changement réussi
    await prisma.activityLog.create({
      data: {
        action: 'PASSWORD_CHANGED_BY_USER',
        details: 'Mot de passe modifié par l\'utilisateur lui-même',
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    
    await prisma.activityLog.create({
      data: {
        action: 'PASSWORD_CHANGE_ERROR',
        details: `Erreur lors du changement de mot de passe: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        userId: request.headers.get('user-id') || undefined,
      },
    });

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}