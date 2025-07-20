'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  Upload, 
  Video, 
  Users, 
  Key, 
  Settings, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Download,
  BarChart3,
  Lock,
  Unlock,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  size: number;
  isPublished: boolean;
  createdAt: string;
}

interface DashboardStats {
  totalVideos: number;
  totalUsers: number;
  totalAccessCodes: number;
  totalStorage: number;
}

interface User {
  id: string;
  email?: string;
  name?: string;
  role: string;
  createdAt: string;
  passwordSetAt?: string;
  mustChangePassword: boolean;
  lastPasswordChange?: string;
  passwordStatus: {
    hasPassword: boolean;
    mustChangePassword: boolean;
    daysSinceLastChange?: number;
    isPasswordExpired: boolean;
  };
  _count: {
    sessions: number;
    accessCodes: number;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('videos');
  const [pageDescription, setPageDescription] = useState('');
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  
  // États pour la gestion des mots de passe
  const [passwordActions, setPasswordActions] = useState<{[userId: string]: boolean}>({});
  const [passwordMessages, setPasswordMessages] = useState<{[userId: string]: string}>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<{score: number; feedback: string[]}>({score: 0, feedback: []});
  const [showPassword, setShowPassword] = useState(false);
  
  // États pour la gestion des utilisateurs
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<{[userId: string]: boolean}>({});
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'USER' as 'USER' | 'ADMIN',
    password: '',
    generateTemporary: false
  });
  const [editingUser, setEditingUser] = useState({
    id: '',
    email: '',
    name: '',
    role: 'USER' as 'USER' | 'ADMIN'
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/viewer');
      return;
    }

    fetchDashboardData();
    fetchPageSettings();
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [session, status, router]);

  // Effet pour charger les utilisateurs quand l'onglet users est sélectionné
  useEffect(() => {
    if (activeTab === 'users' && session?.user.role === 'ADMIN') {
      fetchUsers();
    }
  }, [activeTab, session]);

  const fetchDashboardData = async () => {
    try {
      const [videosResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/videos'),
        fetch('/api/admin/stats')
      ]);

      if (!videosResponse.ok || !statsResponse.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const videosData = await videosResponse.json();
      const statsData = await statsResponse.json();

      setVideos(videosData.videos);
      setStats(statsData);
    } catch (error) {
      setError('Impossible de charger les données du dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const fetchPageSettings = async () => {
    try {
      const response = await fetch('/api/admin/page-settings');
      if (response.ok) {
        const data = await response.json();
        setPageDescription(data.pageDescription);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setUpdateMessage(`✅ ${data.users?.length || 0} utilisateur(s) chargé(s)`);
        setTimeout(() => setUpdateMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setUpdateMessage(`❌ Erreur: ${errorData.error || 'Erreur inconnue'}`);
        setTimeout(() => setUpdateMessage(''), 5000);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
      setUpdateMessage('❌ Erreur de connexion au serveur');
      setTimeout(() => setUpdateMessage(''), 5000);
    }
  };

  const testPageSettings = async () => {
    try {
      console.log('🧪 Test des paramètres de page...');
      const response = await fetch('/api/admin/page-settings');
      const data = await response.json();
      console.log('📄 Paramètres actuels:', data);
      
      if (response.ok) {
        setUpdateMessage(`🧪 Test réussi ! Description actuelle: "${data.pageDescription.substring(0, 50)}..."`);
        setTimeout(() => setUpdateMessage(''), 5000);
      } else {
        setUpdateMessage(`❌ Test échoué: ${data.error}`);
        setTimeout(() => setUpdateMessage(''), 5000);
      }
    } catch (error) {
      console.error('Erreur test:', error);
      setUpdateMessage('❌ Erreur lors du test');
      setTimeout(() => setUpdateMessage(''), 5000);
    }
  };

  const updatePageDescription = async () => {
    if (!pageDescription.trim()) {
      setUpdateMessage('❌ Veuillez entrer une description');
      setTimeout(() => setUpdateMessage(''), 3000);
      return;
    }

    setIsUpdatingDescription(true);
    setUpdateMessage('');
    
    try {
      console.log('📝 Mise à jour de la description:', pageDescription.trim());
      
      const response = await fetch('/api/admin/page-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageDescription: pageDescription.trim() }),
      });

      const data = await response.json();
      console.log('📡 Réponse API:', data);

      if (response.ok) {
        setUpdateMessage('✅ Description mise à jour avec succès ! Rafraîchissez la page viewer pour voir les changements.');
        setTimeout(() => setUpdateMessage(''), 5000);
      } else {
        setUpdateMessage(`❌ Erreur: ${data.error || 'Erreur inconnue'}`);
        setTimeout(() => setUpdateMessage(''), 5000);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setUpdateMessage('❌ Erreur de connexion au serveur');
      setTimeout(() => setUpdateMessage(''), 5000);
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  // Fonctions de gestion des mots de passe
  const handleGenerateTemporaryPassword = async (userId: string) => {
    setPasswordActions(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateTemporary: true })
      });

      const data = await response.json();
      if (response.ok) {
        setPasswordMessages(prev => ({ 
          ...prev, 
          [userId]: `✅ Mot de passe temporaire: ${data.temporaryPassword}` 
        }));
        fetchUsers(); // Actualiser la liste
        setTimeout(() => setPasswordMessages(prev => ({ ...prev, [userId]: '' })), 10000);
      } else {
        setPasswordMessages(prev => ({ 
          ...prev, 
          [userId]: `❌ ${data.error}` 
        }));
        setTimeout(() => setPasswordMessages(prev => ({ ...prev, [userId]: '' })), 5000);
      }
    } catch (error) {
      setPasswordMessages(prev => ({ 
        ...prev, 
        [userId]: '❌ Erreur de connexion' 
      }));
      setTimeout(() => setPasswordMessages(prev => ({ ...prev, [userId]: '' })), 5000);
    } finally {
      setPasswordActions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ?')) {
      return;
    }

    setPasswordActions(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (response.ok) {
        setPasswordMessages(prev => ({ 
          ...prev, 
          [userId]: '✅ Mot de passe réinitialisé' 
        }));
        fetchUsers(); // Actualiser la liste
        setTimeout(() => setPasswordMessages(prev => ({ ...prev, [userId]: '' })), 5000);
      } else {
        setPasswordMessages(prev => ({ 
          ...prev, 
          [userId]: `❌ ${data.error}` 
        }));
        setTimeout(() => setPasswordMessages(prev => ({ ...prev, [userId]: '' })), 5000);
      }
    } catch (error) {
      setPasswordMessages(prev => ({ 
        ...prev, 
        [userId]: '❌ Erreur de connexion' 
      }));
      setTimeout(() => setPasswordMessages(prev => ({ ...prev, [userId]: '' })), 5000);
    } finally {
      setPasswordActions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleSetCustomPassword = async () => {
    if (!selectedUser || !newPassword || newPassword !== confirmPassword) {
      return;
    }

    setPasswordActions(prev => ({ ...prev, [selectedUser.id]: true }));
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await response.json();
      if (response.ok) {
        setPasswordMessages(prev => ({ 
          ...prev, 
          [selectedUser.id]: '✅ Mot de passe défini avec succès' 
        }));
        fetchUsers(); // Actualiser la liste
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
        setSelectedUser(null);
        setTimeout(() => setPasswordMessages(prev => ({ ...prev, [selectedUser.id]: '' })), 5000);
      } else {
        alert(`Erreur: ${data.error}\n${data.details ? data.details.join('\n') : ''}`);
      }
    } catch (error) {
      alert('Erreur de connexion au serveur');
    } finally {
      setPasswordActions(prev => ({ ...prev, [selectedUser.id]: false }));
    }
  };

  const checkPasswordStrength = (password: string) => {
    // Fonction simplifiée pour calculer la force du mot de passe
    let score = 0;
    const feedback: string[] = [];
    
    if (password.length >= 12) score += 25;
    else feedback.push('Augmentez la longueur (min 12)');
    
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push('Ajoutez des minuscules');
    
    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push('Ajoutez des majuscules');
    
    if (/[0-9]/.test(password)) score += 15;
    else feedback.push('Ajoutez des chiffres');
    
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;
    else feedback.push('Ajoutez des caractères spéciaux');
    
    if (password.length > 16) score += 10;
    
    setPasswordStrength({ score: Math.min(score, 100), feedback });
  };

  // Fonctions de gestion des utilisateurs
  const handleCreateUser = async () => {
    if (!newUser.email && !newUser.name) {
      alert('Veuillez fournir au moins un email ou un nom');
      return;
    }

    setIsCreatingUser(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();
      if (response.ok) {
        setUpdateMessage(`✅ Utilisateur créé: ${data.user.email || data.user.name}${data.temporaryPassword ? ` - Mot de passe temporaire: ${data.temporaryPassword}` : ''}`);
        fetchUsers(); // Actualiser la liste
        setShowCreateUserModal(false);
        setNewUser({
          email: '',
          name: '',
          role: 'USER',
          password: '',
          generateTemporary: false
        });
        setTimeout(() => setUpdateMessage(''), 10000);
      } else {
        alert(`Erreur: ${data.error}\n${data.details ? data.details.join('\n') : ''}`);
      }
    } catch (error) {
      alert('Erreur de connexion au serveur');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser.id) return;

    setIsCreatingUser(true);
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingUser.email,
          name: editingUser.name,
          role: editingUser.role
        })
      });

      const data = await response.json();
      if (response.ok) {
        setUpdateMessage(`✅ Utilisateur modifié: ${data.user.email || data.user.name}`);
        fetchUsers(); // Actualiser la liste
        setShowEditUserModal(false);
        setEditingUser({
          id: '',
          email: '',
          name: '',
          role: 'USER'
        });
        setTimeout(() => setUpdateMessage(''), 5000);
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      alert('Erreur de connexion au serveur');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail?: string, userName?: string) => {
    const userDisplayName = userEmail || userName || 'cet utilisateur';
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${userDisplayName} ?\n\nCette action est irréversible et supprimera également toutes les données associées (vidéos, sessions, etc.).`)) {
      return;
    }

    setIsDeletingUser(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (response.ok) {
        setUpdateMessage(`✅ Utilisateur supprimé: ${userDisplayName}`);
        fetchUsers(); // Actualiser la liste
        setTimeout(() => setUpdateMessage(''), 5000);
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      alert('Erreur de connexion au serveur');
    } finally {
      setIsDeletingUser(prev => ({ ...prev, [userId]: false }));
    }
  };

  const resetCreateUserForm = () => {
    setNewUser({
      email: '',
      name: '',
      role: 'USER',
      password: '',
      generateTemporary: false
    });
    setShowCreateUserModal(false);
  };

  const resetEditUserForm = () => {
    setEditingUser({
      id: '',
      email: '',
      name: '',
      role: 'USER'
    });
    setShowEditUserModal(false);
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setVideos(videos.filter(v => v.id !== videoId));
    } catch (error) {
      alert('Erreur lors de la suppression de la vidéo');
    }
  };

  const handleTogglePublish = async (videoId: string, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      setVideos(videos.map(v => 
        v.id === videoId ? { ...v, isPublished: !isPublished } : v
      ));
    } catch (error) {
      alert('Erreur lors de la mise à jour de la vidéo');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="btn-primary px-4 py-2"
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
            <div className="w-8 h-8 bg-[#CD4900]"></div>
            <div className="w-8 h-8 bg-[#FA9819] rounded-full"></div>
          </div>

          {/* Bouton de déconnexion */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
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
          <span className="text-[#FA9819]">03</span>{' '}
          <span className="text-black">Administration</span>
        </h1>
      </div>

      {/* Navigation horizontale */}
      <div className="px-8 mb-8">
        <div className="flex space-x-8">
          {[
            { id: 'videos', label: 'Vidéos', icon: Video },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'codes', label: 'Codes d\'accès', icon: Key },
            { id: 'stats', label: 'Statistiques', icon: BarChart3 },
            { id: 'settings', label: 'Paramètres', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-lg font-normal border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#FA9819] text-[#FA9819]'
                  : 'border-transparent text-black hover:text-[#FA9819]'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      <main className="px-8 pb-8">
        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="border border-black p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black">Total Vidéos</p>
                  <p className="text-2xl font-normal text-black">
                    {stats.totalVideos}
                  </p>
                </div>
                <div className="p-3 bg-[#FA9819] rounded-full">
                  <Video className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="border border-black p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black">Utilisateurs</p>
                  <p className="text-2xl font-normal text-black">
                    {stats.totalUsers}
                  </p>
                </div>
                <div className="p-3 bg-[#CD4900] rounded-full">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="border border-black p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black">Codes d'accès</p>
                  <p className="text-2xl font-normal text-black">
                    {stats.totalAccessCodes}
                  </p>
                </div>
                <div className="p-3 bg-black rounded-full">
                  <Key className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="border border-black p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black">Stockage</p>
                  <p className="text-2xl font-normal text-black">
                    {formatFileSize(stats.totalStorage)}
                  </p>
                </div>
                <div className="p-3 bg-[#FA9819] rounded-full">
                  <Download className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Vidéos */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-normal text-black">
                Gestion des Vidéos
              </h2>
              <button
                onClick={() => router.push('/admin/upload')}
                className="px-6 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Ajouter une vidéo
              </button>
            </div>

            {/* Liste des vidéos */}
            <div className="border border-black">
              <div className="p-6">
                {videos.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="h-12 w-12 text-black mx-auto mb-4" />
                    <p className="text-black">
                      Aucune vidéo trouvée. Commencez par en ajouter une.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-black">
                          <th className="text-left py-3 px-4 font-normal text-black">
                            Titre
                          </th>
                          <th className="text-left py-3 px-4 font-normal text-black">
                            Statut
                          </th>
                          <th className="text-left py-3 px-4 font-normal text-black">
                            Taille
                          </th>
                          <th className="text-left py-3 px-4 font-normal text-black">
                            Date
                          </th>
                          <th className="text-right py-3 px-4 font-normal text-black">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {videos.map((video) => (
                          <tr key={video.id} className="border-b border-gray-200">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                {video.thumbnailUrl && (
                                  <img
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    className="w-16 h-12 object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-normal text-black">
                                    {video.title}
                                  </p>
                                  {video.description && (
                                    <p className="text-sm text-gray-600 truncate max-w-xs">
                                      {video.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-normal border ${
                                video.isPublished
                                  ? 'bg-[#FA9819] text-white border-[#FA9819]'
                                  : 'bg-white text-black border-black'
                              }`}>
                                {video.isPublished ? 'Publié' : 'Brouillon'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-black">
                              {formatFileSize(video.size)}
                            </td>
                            <td className="py-3 px-4 text-sm text-black">
                              {new Date(video.createdAt).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleTogglePublish(video.id, video.isPublished)}
                                  className="p-2 text-black hover:text-[#FA9819] transition-colors"
                                  title={video.isPublished ? 'Dépublier' : 'Publier'}
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => router.push(`/admin/edit/${video.id}`)}
                                  className="p-2 text-black hover:text-[#CD4900] transition-colors"
                                  title="Modifier"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteVideo(video.id)}
                                  className="p-2 text-black hover:text-red-600 transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Utilisateurs */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-normal text-black">
                Gestion des Utilisateurs
              </h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {users.length} utilisateur{users.length > 1 ? 's' : ''} au total
                </div>
                <button
                  onClick={fetchUsers}
                  className="px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
                >
                  🔄 Actualiser
                </button>
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="px-6 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Ajouter un utilisateur
                </button>
              </div>
            </div>

            {/* Liste des utilisateurs */}
            <div className="border border-black">
              <div className="p-6">
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-black mx-auto mb-4" />
                    <p className="text-black">
                      Aucun utilisateur trouvé.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-black">
                          <th className="text-left py-3 px-4 font-normal text-black">
                            Utilisateur
                          </th>
                          <th className="text-left py-3 px-4 font-normal text-black">
                            Rôle
                          </th>
                          <th className="text-left py-3 px-4 font-normal text-black">
                            Statut Mot de Passe
                          </th>
                          <th className="text-left py-3 px-4 font-normal text-black">
                            Dernière Connexion
                          </th>
                          <th className="text-right py-3 px-4 font-normal text-black">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-gray-200">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-normal text-black">
                                  {user.email || user.name || 'Utilisateur sans nom'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  ID: {user.id.substring(0, 8)}...
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-normal border ${
                                user.role === 'ADMIN'
                                  ? 'bg-[#CD4900] text-white border-[#CD4900]'
                                  : 'bg-white text-black border-black'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                {user.passwordStatus.hasPassword ? (
                                  <div className="flex items-center space-x-1">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-green-600">Défini</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm text-red-600">Non défini</span>
                                  </div>
                                )}
                                
                                {user.passwordStatus.mustChangePassword && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                    <span className="text-xs text-orange-600">À changer</span>
                                  </div>
                                )}
                                
                                {user.passwordStatus.isPasswordExpired && (
                                  <div className="flex items-center space-x-1">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <span className="text-xs text-red-600">Expiré</span>
                                  </div>
                                )}
                                
                                {user.passwordStatus.daysSinceLastChange !== null && (
                                  <span className="text-xs text-gray-500">
                                    ({user.passwordStatus.daysSinceLastChange}j)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-black">
                              {user._count.sessions > 0 ? (
                                <span className="text-green-600">Actif</span>
                              ) : (
                                <span className="text-gray-500">Inactif</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end space-x-2">
                                {/* Actions de mot de passe */}
                                <button
                                  onClick={() => handleGenerateTemporaryPassword(user.id)}
                                  disabled={passwordActions[user.id]}
                                  className="p-2 text-black hover:text-[#FA9819] transition-colors disabled:opacity-50"
                                  title="Générer un mot de passe temporaire"
                                >
                                  <Lock className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowPasswordModal(true);
                                  }}
                                  disabled={passwordActions[user.id]}
                                  className="p-2 text-black hover:text-[#CD4900] transition-colors disabled:opacity-50"
                                  title="Définir un mot de passe personnalisé"
                                >
                                  <Unlock className="h-4 w-4" />
                                </button>
                                {user.passwordStatus.hasPassword && (
                                  <button
                                    onClick={() => handleResetPassword(user.id)}
                                    disabled={passwordActions[user.id]}
                                    className="p-2 text-black hover:text-red-600 transition-colors disabled:opacity-50"
                                    title="Réinitialiser le mot de passe"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </button>
                                )}
                                
                                {/* Séparateur */}
                                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                
                                {/* Actions utilisateur */}
                                <button
                                  onClick={() => {
                                    setEditingUser({
                                      id: user.id,
                                      email: user.email || '',
                                      name: user.name || '',
                                      role: user.role as 'USER' | 'ADMIN'
                                    });
                                    setShowEditUserModal(true);
                                  }}
                                  disabled={isDeletingUser[user.id]}
                                  className="p-2 text-black hover:text-blue-600 transition-colors disabled:opacity-50"
                                  title="Modifier les informations de l'utilisateur"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.email || undefined, user.name || undefined)}
                                  disabled={isDeletingUser[user.id] || passwordActions[user.id]}
                                  className="p-2 text-black hover:text-red-600 transition-colors disabled:opacity-50"
                                  title="Supprimer l'utilisateur"
                                >
                                  {isDeletingUser[user.id] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              
                              {/* Message de feedback */}
                              {passwordMessages[user.id] && (
                                <div className="mt-2 text-xs p-2 border rounded bg-gray-50">
                                  {passwordMessages[user.id]}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal pour définir un mot de passe personnalisé */}
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border border-black p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-normal text-black mb-4">
                Définir un mot de passe pour {selectedUser.email || selectedUser.name || 'cet utilisateur'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-normal text-black mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      checkPasswordStrength(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-black focus:outline-none focus:border-[#FA9819] transition-colors"
                    placeholder="Entrez un mot de passe sécurisé..."
                  />
                  
                  {/* Indicateur de force du mot de passe */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              passwordStrength.score < 40 ? 'bg-red-500' :
                              passwordStrength.score < 70 ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${passwordStrength.score}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {passwordStrength.score < 40 ? 'Faible' :
                           passwordStrength.score < 70 ? 'Moyen' : 'Fort'}
                        </span>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="mt-1 text-xs text-gray-600">
                          {passwordStrength.feedback.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-black mb-2">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-black focus:outline-none focus:border-[#FA9819] transition-colors"
                    placeholder="Confirmez le mot de passe..."
                  />
                  
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setSelectedUser(null);
                    setPasswordStrength({score: 0, feedback: []});
                  }}
                  className="px-4 py-2 text-black border border-black hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSetCustomPassword}
                  disabled={!newPassword || newPassword !== confirmPassword || passwordStrength.score < 60 || passwordActions[selectedUser.id]}
                  className="px-4 py-2 bg-[#FA9819] text-white hover:bg-[#e8860f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {passwordActions[selectedUser.id] ? 'Définition...' : 'Définir le mot de passe'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal pour créer un utilisateur */}
        {showCreateUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border border-black p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-normal text-black mb-4">
                Créer un nouvel utilisateur
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-normal text-black mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-black focus:outline-none focus:border-[#FA9819] transition-colors"
                    placeholder="user@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-black mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-black focus:outline-none focus:border-[#FA9819] transition-colors"
                    placeholder="Nom d'affichage"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-black mb-2">
                    Rôle
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'USER' | 'ADMIN' }))}
                    className="w-full px-3 py-2 border border-black focus:outline-none focus:border-[#FA9819] transition-colors"
                  >
                    <option value="USER">Utilisateur</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      id="generateTemporary"
                      checked={newUser.generateTemporary}
                      onChange={(e) => setNewUser(prev => ({ 
                        ...prev, 
                        generateTemporary: e.target.checked,
                        password: e.target.checked ? '' : prev.password
                      }))}
                      className="h-4 w-4 text-[#FA9819] focus:ring-[#FA9819] border-gray-300 rounded"
                    />
                    <label htmlFor="generateTemporary" className="text-sm text-black">
                      Générer un mot de passe temporaire
                    </label>
                  </div>
                  
                  {!newUser.generateTemporary && (
                    <div>
                      <label className="block text-sm font-normal text-black mb-2">
                        Mot de passe (optionnel)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newUser.password}
                          onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-black focus:outline-none focus:border-[#FA9819] transition-colors"
                          placeholder="Laisser vide pour créer sans mot de passe"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        Si vide, l'utilisateur devra utiliser un code d'accès pour se connecter.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={resetCreateUserForm}
                  disabled={isCreatingUser}
                  className="px-4 py-2 text-black border border-black hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={isCreatingUser || (!newUser.email && !newUser.name)}
                  className="px-4 py-2 bg-[#FA9819] text-white hover:bg-[#e8860f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreatingUser ? 'Création...' : 'Créer l\'utilisateur'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal pour éditer un utilisateur */}
        {showEditUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border border-black p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-normal text-black mb-4">
                Modifier l'utilisateur
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-normal text-black mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-black focus:outline-none focus:border-[#FA9819] transition-colors"
                    placeholder="user@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-black mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-black focus:outline-none focus:border-[#FA9819] transition-colors"
                    placeholder="Nom d'affichage"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-black mb-2">
                    Rôle
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value as 'USER' | 'ADMIN' }))}
                    className="w-full px-3 py-2 border border-black focus:outline-none focus:border-[#FA9819] transition-colors"
                  >
                    <option value="USER">Utilisateur</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={resetEditUserForm}
                  disabled={isCreatingUser}
                  className="px-4 py-2 text-black border border-black hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleEditUser}
                  disabled={isCreatingUser}
                  className="px-4 py-2 bg-[#FA9819] text-white hover:bg-[#e8860f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreatingUser ? 'Modification...' : 'Modifier l\'utilisateur'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Paramètres */}
        {activeTab === 'settings' && (
          <div className="border border-black">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-normal text-black mb-2">
                  Paramètres de la page Viewer
                </h2>
                <p className="text-sm text-gray-600">
                  Modifiez la description affichée sur la page de visualisation des vidéos.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="pageDescription" className="block text-sm font-normal text-black mb-2">
                    Description de page
                  </label>
                  <textarea
                    id="pageDescription"
                    value={pageDescription}
                    onChange={(e) => setPageDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-black focus:outline-none focus:border-[#FA9819] transition-colors"
                    placeholder="Entrez la description qui sera affichée sur la page viewer..."
                  />
                </div>

                {/* Message de feedback */}
                {updateMessage && (
                  <div className={`p-3 border ${
                    updateMessage.includes('✅') 
                      ? 'border-green-500 bg-green-50 text-green-800' 
                      : 'border-red-500 bg-red-50 text-red-800'
                  }`}>
                    {updateMessage}
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">
                      Cette description sera affichée sur la page de visualisation des vidéos.
                    </p>
                    <div className="flex gap-4 mt-1">
                      <button
                        onClick={() => window.open('/viewer', '_blank')}
                        className="text-sm text-[#FA9819] hover:underline"
                      >
                        🔗 Voir la page viewer
                      </button>
                      <button
                        onClick={testPageSettings}
                        className="text-sm text-gray-600 hover:underline"
                      >
                        🧪 Tester l'API
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={updatePageDescription}
                    disabled={isUpdatingDescription}
                    className="px-6 py-3 bg-[#FA9819] text-white font-normal hover:bg-[#e8860f] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {isUpdatingDescription ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : null}
                    {isUpdatingDescription ? 'Mise à jour...' : 'Mettre à jour'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Autres onglets - placeholder */}
        {activeTab !== 'videos' && activeTab !== 'settings' && (
          <div className="border border-black">
            <div className="p-6">
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-black mx-auto mb-4" />
                <p className="text-black">
                  Cette section sera implémentée prochainement.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 