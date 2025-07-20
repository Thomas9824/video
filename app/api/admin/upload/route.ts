import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadVideo, generateThumbnail } from '@/lib/blob';
import { isValidVideoType, isValidVideoSize, sanitizeFilename } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const isPublished = formData.get('isPublished') === 'true';

    if (!file || !title) {
      return NextResponse.json(
        { error: 'Fichier et titre requis' },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    if (!isValidVideoType(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Utilisez MP4, WebM ou AVI.' },
        { status: 400 }
      );
    }

    // Validation de la taille
    if (!isValidVideoSize(file.size)) {
      const maxSize = parseInt(process.env.MAX_FILE_SIZE || '524288000');
      return NextResponse.json(
        { error: `Fichier trop volumineux. Taille maximale: ${Math.round(maxSize / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    console.log(`🎬 Début de l'upload de "${title}" (${Math.round(file.size / 1024 / 1024)}MB)`);

    const filename = sanitizeFilename(file.name.replace(/\.[^/.]+$/, '')) + '_' + Date.now() + '.' + file.name.split('.').pop();

    // Upload vers Vercel Blob
    console.log('📤 Upload vers Vercel Blob...');
    const uploadResult = await uploadVideo(file, filename);
    console.log('✅ Upload Vercel Blob terminé:', uploadResult.url);

    // Générer une miniature
    let thumbnailUrl = '';
    try {
      console.log('🖼️  Génération de la miniature...');
      thumbnailUrl = await generateThumbnail();
      console.log('✅ Miniature générée:', thumbnailUrl);
    } catch (error) {
      console.error('⚠️  Erreur génération miniature:', error);
      // Continuer même si la miniature échoue
    }

    // Sauvegarder en base de données
    console.log('💾 Sauvegarde en base de données...');
    const video = await prisma.video.create({
      data: {
        title,
        description: description || '',
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        duration: null, // Vercel Blob ne fournit pas automatiquement la durée
        thumbnailUrl,
        videoUrl: uploadResult.url,
        cloudinaryId: uploadResult.pathname, // On utilise le pathname comme identifiant unique
        isPublished,
        uploadedById: session.user.id,
      },
    });

    // Enregistrer l'activité
    await prisma.activityLog.create({
      data: {
        action: 'UPLOAD_VIDEO',
        details: `Vidéo "${title}" uploadée avec Vercel Blob (${Math.round(file.size / 1024 / 1024)}MB)`,
        userId: session.user.id,
      },
    });

    console.log('✅ Upload terminé avec succès:', video.id);

    return NextResponse.json({
      success: true,
      video,
      message: 'Vidéo uploadée avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload de la vidéo: ' + (error instanceof Error ? error.message : 'Erreur inconnue') },
      { status: 500 }
    );
  }
} 