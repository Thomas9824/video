'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import PhysicsPreview from '../../components/physics/gravity';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        // Rediriger selon le rôle
        if (session.user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/viewer');
        }
      }
    };
    
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Identifiants invalides');
      } else {
        // Récupérer la session pour connaître le rôle
        const session = await getSession();
        if (session?.user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/viewer');
        }
      }
    } catch (err) {
      setError('Une erreur s\'est produite lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(245,245,245)] font-[family-name:var(--font-geist-sans)]">
      {/* Header avec logo */}
      <header className="p-8">
        <div className="flex items-center">
          {/* Logo géométrique */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[rgb(34,45,134)]"></div>
            <div className="w-8 h-8 bg-[rgb(170,160,58)] rounded-full"></div>
          </div>
        </div>
      </header>

            {/* Ligne de séparation pleine largeur */}
      <hr className="border-black border-t-[1px]" />

      {/* Titre principal */}
      <div className="px-8 py-8">
        <h1 className="text-6xl lg:text-7xl font-normal leading-tight">
          <span className="text-[rgb(34,45,134)]">01</span>{' '}
          <span className="text-black">Connexion</span>
        </h1>
      </div>

      {/* Contenu principal en grid */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-16 px-8 py-12 max-w-7xl mx-auto min-h-[60vh]">
        {/* Colonne de gauche - rectangle avec animation physique */}
        <div className="w-full h-full bg-[rgb(208,208,230)] min-h-[400px] rounded-3xl relative overflow-hidden">
          {/*<PhysicsPreview />*/}
          <div className="text-9xl text-[rgb(245,245,245)] flex justify-center items-center h-full">
            <p>J-3</p>
          </div>
        </div>

        {/* Colonne de droite - Contenu */}
        <div className="flex flex-col justify-center">
          {/* Texte d'introduction */}
          <div className="text-3xl lg:text-4xl leading-relaxed font-normal mb-12">
            <p className="text-black mb-2">
              Connecte-toi pour regarder mes vlogs et découvrir comment je survis à{' '}
              <span className="text-[rgb(34,45,134)]">Dublin !</span>
            </p>
            <p className="text-black">
              Mes aventures du quotidien... on va bien rigoler ahahah
            </p>
          </div>

          {/* Interface de connexion */}
          <div className="border border-black p-8 w-full h-full rounded-3xl">
             <h2 className="text-3xl lg:text-4xl font-normal text-black mb-6">Entre le code</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-black rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                    placeholder="mot de passe ou code d'accès..."
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="w-12 h-12 bg-[rgb(208,208,230)] rounded-full flex items-center justify-center text-white hover:bg-[rgb(188,188,210)] focus:outline-none focus:ring-2 focus:ring-[#FA9819] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <ArrowRight className="h-6 w-6" />
                  )}
                </button>
              </div>

              {error && (
                <div className="text-red-600 text-sm mt-2">
                  {error}
                </div>
              )}
            </form>
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