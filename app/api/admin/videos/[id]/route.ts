import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteVideo } from '@/lib/blob';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const video = await prisma.video.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    // Enregistrer l'activité
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE_VIDEO',
        details: `Vidéo "${video.title}" mise à jour`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la vidéo:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Récupérer la vidéo pour obtenir l'URL Vercel Blob
    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Vidéo non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer de Vercel Blob
    try {
      await deleteVideo(video.videoUrl);
      console.log('✅ Vidéo supprimée de Vercel Blob');
    } catch (error) {
      console.error('⚠️ Erreur lors de la suppression de Vercel Blob:', error);
      // Continuer même si la suppression de Vercel Blob échoue
    }

    // Supprimer de la base de données
    await prisma.video.delete({
      where: { id },
    });

    // Enregistrer l'activité
    await prisma.activityLog.create({
      data: {
        action: 'DELETE_VIDEO',
        details: `Vidéo "${video.title}" supprimée`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vidéo supprimée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la vidéo:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 