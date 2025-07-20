# 🚀 Guide Rapide - Configuration Vercel Blob

## 📋 Étapes de Configuration

### 1. Créer un Blob Store

1. **Aller sur Vercel Dashboard**
   - Ouvrir [https://vercel.com/dashboard/stores](https://vercel.com/dashboard/stores)
   - Se connecter à votre compte Vercel

2. **Créer un nouveau store**
   - Cliquer sur "Create Database"
   - Sélectionner "Blob"
   - Choisir un nom pour votre store (ex: `projet-video-storage`)
   - Sélectionner votre région préférée

3. **Copier le token**
   - Une fois créé, copier le token `BLOB_READ_WRITE_TOKEN`
   - Il ressemble à : `vercel_blob_rw_XXXXXXXXXXXXX`

### 2. Configurer l'Application

1. **Mettre à jour le fichier .env**
   ```env
   # Remplacer cette ligne :
   BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
   
   # Par votre vrai token :
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_XXXXXXXXXXXXX"
   ```

2. **Redémarrer le serveur**
   ```bash
   # Arrêter le serveur avec Ctrl+C
   # Puis redémarrer
   npm run dev
   ```

### 3. Tester l'Upload

1. **Se connecter en tant qu'admin**
   - Aller sur http://localhost:3000/login
   - Utiliser le code : `admin456`

2. **Uploader une vidéo**
   - Cliquer sur "Ajouter une vidéo"
   - Glisser-déposer un fichier vidéo (MP4, WebM, AVI)
   - Remplir le titre et la description
   - Cliquer sur "Uploader la vidéo"

3. **Vérifier le résultat**
   - La vidéo devrait apparaître dans le dashboard
   - L'URL devrait pointer vers `*.public.blob.vercel-storage.com`

## 🔧 Dépannage

### Erreur "BLOB_READ_WRITE_TOKEN non configuré"

- Vérifier que le token est correctement copié dans `.env`
- Redémarrer le serveur après modification
- Vérifier qu'il n'y a pas d'espaces avant/après le token

### Erreur lors de l'upload

- Vérifier que le fichier est un format vidéo supporté
- Vérifier que le fichier fait moins de 500MB
- Vérifier les logs du serveur pour plus d'informations

### Token invalide

- Vérifier que le token commence par `vercel_blob_rw_`
- Recréer un nouveau token sur Vercel Dashboard si nécessaire

## 📊 Limites Vercel Blob

- **Taille maximale** : 500MB par fichier
- **Bande passante** : Dépend de votre plan Vercel
- **Stockage** : Facturation selon l'utilisation

## 🎯 Prochaines Étapes

Une fois Vercel Blob configuré :

1. **Tester les uploads** avec différents formats
2. **Vérifier la lecture** des vidéos dans le viewer
3. **Configurer le déploiement** sur Vercel
4. **Personnaliser les codes d'accès** selon vos besoins

## 📞 Support

- [Documentation Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [Dashboard Vercel](https://vercel.com/dashboard/stores)
- [Support Vercel](https://vercel.com/support)

---

✨ **Votre application est maintenant prête avec Vercel Blob !** 