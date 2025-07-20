import { put, del } from '@vercel/blob';

export const uploadVideo = async (file: File, filename: string) => {
  try {
    console.log(`📤 Upload vers Vercel Blob: ${filename}`);
    
    const blob = await put(filename, file, {
      access: 'public',
      handleUploadUrl: '/api/upload/video',
    });

    console.log('✅ Upload Vercel Blob terminé:', blob.url);
    
    return {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload Vercel Blob:', error);
    throw error;
  }
};

export const deleteVideo = async (url: string) => {
  try {
    console.log(`🗑️ Suppression de Vercel Blob: ${url}`);
    
    await del(url);
    
    console.log('✅ Suppression terminée');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de la suppression Vercel Blob:', error);
    throw error;
  }
};

export const generateThumbnail = async (videoUrl: string) => {
  // Pour l'instant, on génère une URL de placeholder
  // Dans une version plus avancée, on pourrait utiliser un service de génération de miniatures
  const title = encodeURIComponent('Miniature Vidéo');
  return `https://via.placeholder.com/400x300/0066cc/ffffff?text=${title}`;
}; 