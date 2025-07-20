import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Vous pouvez ajouter ici des vérifications d'authentification
        console.log('📝 Génération du token pour:', pathname);
        
        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/avi'],
          tokenPayload: JSON.stringify({
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
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