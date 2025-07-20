'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut, Video as VideoIcon, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface Video {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
}

export default function ViewerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageDescription, setPageDescription] = useState('Connectez-vous pour découvrir mes vlogs et voir comment je survis à Dublin ! Mes aventures du quotidien... on va bien rigoler ahahah');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role === 'ADMIN') {
      router.push('/admin/dashboard');
      return;
    }

    fetchVideos();
    fetchPageSettings();
  }, [session, status, router]);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des vidéos');
      }
      const data = await response.json();
      setVideos(data.videos);
      if (data.videos.length > 0) {
        setCurrentVideo(data.videos[0]);
        setCurrentIndex(0);
      }
    } catch (error) {
      setError('Impossible de charger les vidéos');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPageSettings = async () => {
    try {
      const response = await fetch('/api/admin/page-settings');
      if (response.ok) {
        const data = await response.json();
        // Utiliser la description retournée par l'API
        setPageDescription(data.pageDescription);
      }
    } catch (error) {
      // En cas d'erreur, garder la description par défaut
      console.log('Impossible de récupérer les paramètres de la page');
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handlePreviousVideo = () => {
    if (videos.length === 0) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : videos.length - 1;
    setCurrentIndex(newIndex);
    setCurrentVideo(videos[newIndex]);
  };

  const handleNextVideo = () => {
    if (videos.length === 0) return;
    const newIndex = currentIndex < videos.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setCurrentVideo(videos[newIndex]);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[rgb(34,45,134)] border-t-transparent mx-auto mb-4"></div>
          <p className="text-black">Chargement de la vidéo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-6 text-lg">{error}</p>
          <button
            onClick={fetchVideos}
            className="px-6 py-3 bg-[rgb(34,45,134)] text-white rounded-lg hover:bg-[rgb(34,45,134)] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Header avec logo et déconnexion */}
      <header className="p-8">
        <div className="flex items-center justify-between">
          {/* Logo géométrique */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[rgb(34,45,134)]"></div>
            <div className="w-8 h-8 bg-[rgb(170,160,58)] rounded-full"></div>
          </div>

          {/* Bouton de déconnexion */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-black text-white text-sm  hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            déconnexion
          </button>
        </div>
      </header>

      {/* Ligne de séparation pleine largeur */}
      <hr className="border-black border-t-[1px]" />

      {/* Titre principal */}
      <div className="px-8 py-8">
        <h1 className="text-6xl lg:text-7xl font-normal leading-tight">
          <span className="text-[rgb(34,45,134)]">02</span>{' '}
          <span className="text-black">Vidéo</span>
        </h1>
      </div>

      {/* Contenu principal en grid */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-16 px-8 py-12 max-w-7xl mx-auto min-h-[60vh]">
        {/* Colonne de gauche - Lecteur vidéo (2 colonnes) */}
        <div className="lg:col-span-2 w-full h-full bg-white min-h-[400px] p-8 flex flex-col justify-center">
          {videos.length === 0 ? (
            <div className="text-center">
              <h2 className="text-2xl font-normal text-black mb-4">Aucune vidéo</h2>
              <p className="text-black">
                Aucune vidéo disponible pour le moment.
              </p>
            </div>
          ) : (
            currentVideo && (
              <>
                <video
                  key={currentVideo.id}
                  className="w-full aspect-video mb-6 bg-black"
                  controls
                  autoPlay
                  poster={currentVideo.thumbnailUrl}
                >
                  <source src={currentVideo.videoUrl} type="video/mp4" />
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
                
                <h2 className="text-xl font-normal text-black mb-2">
                  {currentVideo.title}
                </h2>
                
                {currentVideo.description && (
                  <p className="text-black text-sm mb-4">
                    {currentVideo.description}
                  </p>
                )}

                {/* Navigation entre vidéos */}
                {videos.length > 1 && (
                  <div className="flex justify-between items-center text-sm">
                    <button
                      onClick={handlePreviousVideo}
                      className="flex items-center gap-1 px-3 py-2 bg-[#FA9819] text-white rounded-lg hover:bg-[#e8860f] transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      avant dernière vidéo
                    </button>
                    
                    <span className="text-black">
                      {currentIndex + 1} / {videos.length}
                    </span>
                    
                    <button
                      onClick={handleNextVideo}
                      className="flex items-center gap-1 px-3 py-2 bg-[#FA9819] text-white rounded-lg hover:bg-[#e8860f] transition-colors"
                    >
                      prochaine vidéo
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )
          )}
        </div>

        {/* Colonne de droite - Description dynamique (1 colonne) */}
        <div className="lg:col-span-1 flex bg-[rgb(208,208,230)] rounded-3xl flex-col justify-center">
          {/* Texte de description */}
          <div className="p-8 text-1xl lg:text-1xl leading-relaxed font-normal">
            <p className="text-black">
              {pageDescription}
            </p>
          </div>
        </div>
      </main>

      {/* Pied de page */}
      <footer className="fixed bottom-0 left-2">
        <p className="text-black text-sm">Thomas Mionnet © 2025</p>
      </footer>
    </div>
  );
} 