import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Permettre l'accès pour tous les utilisateurs connectés (pas seulement admin)
    // car la page viewer doit pouvoir récupérer la description
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer la description de la page viewer
    const pageDescription = await prisma.pageSettings.findUnique({
      where: { key: 'viewer_description' }
    });

    return NextResponse.json({
      pageDescription: pageDescription?.value || 'Connectez-vous pour découvrir mes vlogs et voir comment je survis à Dublin ! Mes aventures du quotidien... on va bien rigoler ahahah'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { pageDescription } = await request.json();

    if (!pageDescription) {
      return NextResponse.json(
        { error: 'Description de page requise' },
        { status: 400 }
      );
    }

    // Mettre à jour ou créer la description
    const updatedSettings = await prisma.pageSettings.upsert({
      where: { key: 'viewer_description' },
      update: { 
        value: pageDescription,
        description: 'Description affichée sur la page viewer'
      },
      create: {
        key: 'viewer_description',
        value: pageDescription,
        description: 'Description affichée sur la page viewer'
      }
    });

    // Enregistrer l'activité
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE_PAGE_SETTINGS',
        details: `Description de la page viewer mise à jour`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      pageDescription: updatedSettings.value,
      message: 'Description mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 