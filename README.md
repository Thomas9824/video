# 📹 Lecteur Vidéo - Application Next.js

Application web sécurisée pour la gestion et l'affichage de contenu vidéo avec interface d'administration.

## 🚀 Fonctionnalités

- **Authentification sécurisée** avec codes d'accès distincts (utilisateur/admin)
- **Gestion complète des vidéos** (upload, modification, suppression)
- **Lecteur vidéo intégré** avec interface épurée
- **Dashboard administrateur** avec statistiques
- **Stockage cloud** via Vercel Blob
- **Interface responsive** avec design moderne
- **Sécurité renforcée** avec middleware de protection

## 🛠️ Technologies

- **Next.js 14** avec App Router
- **TypeScript** pour la sécurité du code
- **Tailwind CSS** pour le styling
- **Prisma** + SQLite pour la base de données
- **NextAuth.js** pour l'authentification
- **Vercel Blob** pour le stockage des vidéos
- **Font Inter** pour la typographie

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <url-du-repo>
cd projet-video
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer les variables d'environnement
nano .env
```

4. **Configurer la base de données**
```bash
# Générer le client Prisma
npx prisma generate

# Créer la base de données
npx prisma db push

# Initialiser avec les codes d'accès par défaut
npx tsx lib/seed.ts
```

5. **Démarrer le serveur de développement**
```bash
npm run dev
```

## 🔧 Configuration

### Variables d'environnement requises

```env
# Base de données
DATABASE_URL="file:./prisma/dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Vercel Blob
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Codes d'accès par défaut
DEFAULT_USER_CODE="user123"
DEFAULT_ADMIN_CODE="admin456"

# Sécurité
BCRYPT_SALT_ROUNDS=12
JWT_SECRET="your-jwt-secret-key"

# Limites d'upload
MAX_FILE_SIZE=524288000  # 500MB
ALLOWED_VIDEO_TYPES="video/mp4,video/webm,video/avi"
```

### Configuration Vercel Blob

1. **Créer un Blob Store** sur [Vercel Dashboard](https://vercel.com/dashboard/stores)
2. **Créer un nouveau store** de type "Blob"
3. **Copier le token** `BLOB_READ_WRITE_TOKEN`
4. **Ajouter le token** dans votre fichier `.env`

```env
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_XXXXXXXXXXXXX"
```

## 🎮 Utilisation

### Connexion

1. Accéder à `/login`
2. Entrer un code d'accès :
   - **Code utilisateur** : `user123` (par défaut)
   - **Code administrateur** : `admin456` (par défaut)

### Interface Utilisateur

- **Page de visionnage** : `/viewer`
- Lecture des vidéos publiées
- Interface épurée et responsive

### Interface Administrateur

- **Dashboard** : `/admin/dashboard`
- **Upload** : `/admin/upload`
- Gestion complète des vidéos
- Statistiques et logs d'activité

## 📤 Upload de Vidéos

### Fonctionnalités d'Upload

- **Drag & Drop** : Glissez-déposez vos fichiers
- **Validation automatique** : Types et taille vérifiés
- **Upload direct** : Vers Vercel Blob
- **Génération automatique** : Titre depuis le nom du fichier
- **Feedback temps réel** : Statut d'upload en direct

### Types de fichiers supportés

- **MP4** : Recommandé pour la compatibilité
- **WebM** : Format web optimisé
- **AVI** : Format classique

### Limites

- **Taille maximale** : 500MB par fichier
- **Types autorisés** : MP4, WebM, AVI uniquement

## 🔒 Sécurité

- Authentification robuste avec sessions JWT
- Protection des routes avec middleware
- Validation des fichiers uploadés
- Chiffrement des données sensibles
- Protection CSRF et XSS

## 🚀 Déploiement

### Sur Vercel

1. **Connecter le repository**
```bash
npm i -g vercel
vercel
```

2. **Configurer les variables d'environnement**
- Ajouter toutes les variables dans le dashboard Vercel
- Utiliser PostgreSQL pour la production

3. **Créer un Blob Store**
- Créer un store sur Vercel Dashboard
- Copier le token dans les variables d'environnement

4. **Déployer**
```bash
vercel --prod
```

### Sur d'autres plateformes

1. **Build de production**
```bash
npm run build
```

2. **Démarrer**
```bash
npm start
```

## 📝 Scripts disponibles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Démarrage en production
npm start

# Linting
npm run lint

# Base de données
npm run db:push      # Synchroniser le schéma
npm run db:generate  # Générer le client Prisma
npm run db:studio    # Interface d'administration
npm run db:seed      # Créer les codes d'accès
npm run db:init      # Initialisation complète

# Statut
npm run status       # Vérifier le statut de l'application
```

## 🏗️ Structure du projet

```
projet-video/
├── app/                    # Pages et API routes
│   ├── admin/             # Interface administrateur
│   ├── api/               # API routes
│   ├── login/             # Page de connexion
│   └── viewer/            # Interface utilisateur
├── components/            # Composants réutilisables
├── lib/                   # Utilitaires et configuration
├── prisma/               # Schéma de base de données
├── types/                # Définitions TypeScript
└── public/               # Fichiers statiques
```

## 🔍 API Endpoints

### Authentification
- `POST /api/auth/signin` - Connexion
- `POST /api/auth/signout` - Déconnexion

### Vidéos (Utilisateur)
- `GET /api/videos` - Liste des vidéos publiées

### Administration
- `GET /api/admin/videos` - Toutes les vidéos
- `POST /api/admin/upload` - Upload de vidéo
- `PATCH /api/admin/videos/[id]` - Modifier une vidéo
- `DELETE /api/admin/videos/[id]` - Supprimer une vidéo
- `GET /api/admin/stats` - Statistiques

### Vercel Blob
- `POST /api/upload/video` - Upload direct vers Vercel Blob

## 🐛 Dépannage

### Erreurs communes

1. **Erreur de base de données**
   - Vérifier `DATABASE_URL`
   - Exécuter `npm run db:push`

2. **Erreur d'authentification**
   - Vérifier `NEXTAUTH_SECRET`
   - Redémarrer le serveur

3. **Erreur d'upload**
   - Vérifier `BLOB_READ_WRITE_TOKEN`
   - Contrôler la taille des fichiers

### Logs

Les logs sont disponibles dans :
- Console du navigateur (côté client)
- Terminal du serveur (côté serveur)
- Dashboard Vercel (en production)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pusher vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation
- Vérifier les logs d'erreur

---

🚀 **Status: All TypeScript build issues resolved for Vercel deployment**

Développé avec ❤️ et Next.js + Vercel Blob 