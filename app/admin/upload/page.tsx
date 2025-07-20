'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload, ArrowLeft, Check, AlertCircle, FileVideo, X } from 'lucide-react';

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Formulaire state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublished: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    router.push('/login');
    return null;
  }

  const handleFileChange = (file: File) => {
    // Vérifier le type de fichier
    if (!['video/mp4', 'video/webm', 'video/avi'].includes(file.type)) {
      setError('Type de fichier non supporté. Utilisez MP4, WebM ou AVI.');
      return;
    }

    // Vérifier la taille (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setError('Fichier trop volumineux. Taille maximale: 500MB.');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Générer le titre automatiquement depuis le nom du fichier
    if (!formData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Enlever l'extension
      setFormData(prev => ({ ...prev, title: fileName }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier vidéo');
      return;
    }

    if (!formData.title) {
      setError('Le titre est requis');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadStatus('Préparation de l\'upload...');

    const data = new FormData();
    data.append('file', selectedFile);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('isPublished', formData.isPublished.toString());

    try {
      setUploadStatus('Upload en cours...');
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      setSuccess(true);
      setUploadStatus('Upload terminé avec succès !');
      
      // Rediriger vers le dashboard après 2 secondes
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Erreur upload:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'upload');
      setUploadStatus('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md w-full mx-4">
          <div className="card-content text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Upload réussi !
            </h2>
            <p className="text-gray-600 mb-4">
              Votre vidéo a été uploadée avec succès sur Vercel Blob.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">
              Redirection vers le dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Header avec logo et navigation */}
      <header className="p-8">
        <div className="flex items-center justify-between">
          {/* Logo géométrique */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#CD4900]"></div>
            <div className="w-8 h-8 bg-[#FA9819] rounded-full"></div>
          </div>

          {/* Bouton retour */}
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            retour dashboard
          </button>
        </div>
      </header>

      {/* Ligne de séparation pleine largeur */}
      <hr className="border-black border-t-[1px]" />

      {/* Titre principal */}
      <div className="px-8 py-8">
        <h1 className="text-6xl lg:text-7xl font-normal leading-tight">
          <span className="text-[#FA9819]">04</span>{' '}
          <span className="text-black">Upload</span>
        </h1>
      </div>

      {/* Contenu principal */}
      <main className="px-8 pb-8">
        {/* Info Vercel Blob */}
        <div className="mb-8 p-6 border border-black">
          <div className="flex items-center">
            <Upload className="w-5 h-5 text-[#FA9819] mr-3" />
            <p className="text-black">
              <strong>Vercel Blob</strong> - Stockage sécurisé et optimisé pour vos vidéos.
              Upload direct et URLs optimisées.
            </p>
          </div>
        </div>

        <div className="border border-black max-w-4xl">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-normal text-black mb-2">Ajouter une nouvelle vidéo</h2>
              <p className="text-gray-600">
                Uploadez et gérez votre contenu vidéo avec Vercel Blob
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload de fichier */}
              <div>
                <label className="form-label">
                  Fichier vidéo *
                </label>
                <div className="mt-1">
                  <div
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : selectedFile 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {selectedFile ? (
                        <>
                          <FileVideo className="w-12 h-12 text-green-600 mb-3" />
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            {formatFileSize(selectedFile.size)}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              setFormData(prev => ({ ...prev, title: '' }));
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            <X className="w-4 h-4 inline mr-1" />
                            Supprimer
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Cliquez pour uploader</span> ou glissez-déposez
                          </p>
                          <p className="text-xs text-gray-500">
                            MP4, WebM, AVI (MAX. 500MB)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      id="file-input"
                      type="file"
                      className="hidden"
                      accept="video/mp4,video/webm,video/avi"
                      onChange={handleInputChange}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>

              {/* Informations de la vidéo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="form-label">
                    Titre *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleFormInputChange}
                    className="form-input mt-1"
                    placeholder="Entrez le titre de la vidéo"
                    required
                    disabled={isUploading}
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={formData.isPublished}
                      onChange={handleFormInputChange}
                      disabled={isUploading}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Publier immédiatement
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormInputChange}
                  rows={3}
                  className="form-input mt-1"
                  placeholder="Description de la vidéo (optionnel)"
                  disabled={isUploading}
                />
              </div>

              {/* Status et erreurs */}
              {uploadStatus && (
                <div className="p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-md text-sm">
                  {uploadStatus}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/admin/dashboard')}
                  className="px-6 py-3 bg-white text-black border border-black hover:bg-gray-100 transition-colors"
                  disabled={isUploading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#FA9819] text-white font-normal hover:bg-[#e8860f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading || !selectedFile}
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Upload en cours...
                    </div>
                  ) : (
                    'Uploader la vidéo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 