import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateTemporaryPassword, validatePassword } from '@/lib/password';

// PUT - Définir/Changer le mot de passe d'un utilisateur (Admin seulement)
export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { userId } = params;
    const body = await request.json();
    const { password, generateTemporary = false, mustChangePassword = false } = body;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    let finalPassword: string;
    let isTemporary = false;

    if (generateTemporary) {
      // Générer un mot de passe temporaire
      finalPassword = generateTemporaryPassword();
      isTemporary = true;
    } else if (password) {
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
      finalPassword = password;
    } else {
      return NextResponse.json(
        { error: 'Mot de passe ou génération automatique requis' },
        { status: 400 }
      );
    }

    // Hacher le mot de passe
    const hashedPassword = await hashPassword(finalPassword);

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordSetAt: new Date(),
        mustChangePassword: isTemporary || mustChangePassword,
        lastPasswordChange: new Date(),
        // Réinitialiser les tokens de reset si ils existent
        passwordResetToken: null,
        passwordResetExpires: null,
      }
    });

    // Logger l'action
    await prisma.activityLog.create({
      data: {
        action: 'PASSWORD_SET_BY_ADMIN',
        details: `Mot de passe ${isTemporary ? 'temporaire ' : ''}défini pour l'utilisateur ${user.email || user.id}`,
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Logger pour l'utilisateur cible aussi
    await prisma.activityLog.create({
      data: {
        action: 'PASSWORD_CHANGED_BY_ADMIN',
        details: `Mot de passe modifié par l'administrateur ${session.user.email || session.user.id}`,
        userId: userId,
      },
    });

    const response: any = {
      success: true,
      message: `Mot de passe ${isTemporary ? 'temporaire ' : ''}défini avec succès`,
      mustChangePassword: updatedUser.mustChangePassword,
    };

    // Retourner le mot de passe en clair seulement si temporaire
    if (isTemporary) {
      response.temporaryPassword = finalPassword;
      response.warning = 'Ce mot de passe temporaire doit être changé lors de la prochaine connexion';
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la définition du mot de passe:', error);
    
    await prisma.activityLog.create({
      data: {
        action: 'PASSWORD_SET_ERROR',
        details: `Erreur lors de la définition du mot de passe: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        userId: params.userId,
      },
    });

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer le mot de passe d'un utilisateur (réinitialisation)
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { userId } = params;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Supprimer le mot de passe (réinitialisation)
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: null,
        passwordSetAt: null,
        mustChangePassword: false,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastPasswordChange: null,
      }
    });

    // Logger l'action
    await prisma.activityLog.create({
      data: {
        action: 'PASSWORD_RESET_BY_ADMIN',
        details: `Mot de passe réinitialisé pour l'utilisateur ${user.email || user.id}`,
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'PASSWORD_RESET',
        details: `Mot de passe réinitialisé par l'administrateur ${session.user.email || session.user.id}`,
        userId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    
    await prisma.activityLog.create({
      data: {
        action: 'PASSWORD_RESET_ERROR',
        details: `Erreur lors de la réinitialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        userId: params.userId,
      },
    });

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}