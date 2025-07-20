import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePassword } from '@/lib/password';

// GET - Récupérer les détails d'un utilisateur spécifique
export async function GET(
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        _count: {
          select: {
            sessions: true,
            accessCodes: true,
            videos: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Enrichir avec des informations sur le statut du mot de passe
    const userWithStatus = {
      ...user,
      passwordStatus: {
        hasPassword: !!user.passwordSetAt,
        mustChangePassword: user.mustChangePassword,
        daysSinceLastChange: user.lastPasswordChange 
          ? Math.floor((Date.now() - user.lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        isPasswordExpired: user.lastPasswordChange 
          ? (Date.now() - user.lastPasswordChange.getTime()) > (90 * 24 * 60 * 60 * 1000)
          : false,
      }
    };

    return NextResponse.json({ user: userWithStatus });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour les informations d'un utilisateur
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
    const { email, name, role } = body;

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Empêcher la modification de son propre compte pour des raisons de sécurité
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Impossible de modifier son propre compte' },
        { status: 403 }
      );
    }

    // Validation du rôle
    if (role && !['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide. Doit être USER ou ADMIN' },
        { status: 400 }
      );
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé par un autre utilisateur' },
          { status: 409 }
        );
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(email !== undefined && { email: email || null }),
        ...(name !== undefined && { name: name || null }),
        ...(role !== undefined && { role }),
      }
    });

    // Logger la modification
    const changes = [];
    if (email !== undefined && email !== existingUser.email) changes.push(`email: ${existingUser.email} → ${email}`);
    if (name !== undefined && name !== existingUser.name) changes.push(`nom: ${existingUser.name} → ${name}`);
    if (role !== undefined && role !== existingUser.role) changes.push(`rôle: ${existingUser.role} → ${role}`);

    await prisma.activityLog.create({
      data: {
        action: 'USER_UPDATED',
        details: `Utilisateur modifié (${changes.join(', ')})`,
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'USER_PROFILE_UPDATED',
        details: `Profil modifié par l'administrateur: ${changes.join(', ')}`,
        userId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt,
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    
    await prisma.activityLog.create({
      data: {
        action: 'USER_UPDATE_ERROR',
        details: `Erreur lors de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        userId: params.userId,
      },
    });

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur
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
      where: { id: userId },
      include: {
        _count: {
          select: {
            videos: true,
            sessions: true,
            accessCodes: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Empêcher la suppression de son propre compte
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Impossible de supprimer son propre compte' },
        { status: 403 }
      );
    }

    // Logger avant suppression (car l'utilisateur n'existera plus après)
    await prisma.activityLog.create({
      data: {
        action: 'USER_DELETED',
        details: `Utilisateur supprimé: ${user.email || user.name || user.id} (${user._count.videos} vidéos, ${user._count.sessions} sessions, ${user._count.accessCodes} codes d'accès)`,
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Supprimer l'utilisateur (les relations seront gérées par les contraintes de clés étrangères)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
      deletedUser: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      impact: {
        videosCount: user._count.videos,
        sessionsCount: user._count.sessions,
        accessCodesCount: user._count.accessCodes,
      }
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    
    await prisma.activityLog.create({
      data: {
        action: 'USER_DELETE_ERROR',
        details: `Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        userId: params.userId,
      },
    });

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}