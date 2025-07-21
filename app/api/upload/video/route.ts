import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Taille maximale: 100MB (réduite de 500MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Types MIME autorisés avec validation stricte
const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/webm', 
  'video/avi'
];

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé - droits administrateur requis' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        console.log('📝 Génération du token pour:', pathname, 'par:', session.user.id);
        
        // Validation du nom de fichier
        if (!pathname || pathname.length > 255) {
          throw new Error('Nom de fichier invalide');
        }

        // Validation de l'extension
        const allowedExtensions = ['.mp4', '.webm', '.avi'];
        const hasValidExtension = allowedExtensions.some(ext => 
          pathname.toLowerCase().endsWith(ext)
        );
        
        if (!hasValidExtension) {
          throw new Error('Extension de fichier non autorisée');
        }
        
        return {
          allowedContentTypes: ALLOWED_MIME_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE,
          tokenPayload: JSON.stringify({
            uploadedAt: new Date().toISOString(),
            uploadedBy: session.user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('✅ Upload terminé:', blob.url);
        
        // Ici on pourrait mettre à jour la base de données si nécessaire
        // Pour l'instant, on laisse l'API principale gérer cela
        
        try {
          console.log('🔄 Upload terminé avec succès');
        } catch (error) {
          console.error('❌ Erreur lors de la finalisation:', error);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 400 }
    );
  }
} 