#!/bin/bash

echo "🔧 Configuration du token Vercel Blob"
echo "====================================="
echo ""

# Vérifier si le token est fourni en paramètre
if [ -z "$1" ]; then
    echo "📋 Étapes pour obtenir votre token :"
    echo "1. Aller sur https://vercel.com/dashboard/stores"
    echo "2. Cliquer sur 'Create Database'"
    echo "3. Sélectionner 'Blob'"
    echo "4. Choisir un nom (ex: projet-video-storage)"
    echo "5. Copier le token qui commence par 'vercel_blob_rw_'"
    echo ""
    echo "📝 Usage du script :"
    echo "   chmod +x scripts/configure-blob.sh"
    echo "   ./scripts/configure-blob.sh VOTRE_TOKEN_ICI"
    echo ""
    echo "🔑 Exemple :"
    echo "   ./scripts/configure-blob.sh vercel_blob_rw_XXXXXXXXXXXXX"
    echo ""
    exit 1
fi

TOKEN="$1"

# Vérifier que le token a le bon format
if [[ ! "$TOKEN" =~ ^vercel_blob_rw_ ]]; then
    echo "❌ Erreur : Le token doit commencer par 'vercel_blob_rw_'"
    echo "🔑 Exemple de token valide : vercel_blob_rw_XXXXXXXXXXXXX"
    exit 1
fi

echo "🔄 Configuration du token..."

# Remplacer le token dans le fichier .env
if [ -f ".env" ]; then
    # Créer une sauvegarde
    cp .env .env.backup
    
    # Remplacer le token
    sed -i.bak "s/BLOB_READ_WRITE_TOKEN=.*/BLOB_READ_WRITE_TOKEN=\"$TOKEN\"/" .env
    
    # Supprimer le fichier de sauvegarde temporaire
    rm .env.bak
    
    echo "✅ Token configuré avec succès !"
    echo "📁 Sauvegarde créée : .env.backup"
else
    echo "❌ Fichier .env non trouvé"
    echo "🔧 Créez d'abord le fichier .env avec : cp env.example .env"
    exit 1
fi

echo ""
echo "🎯 Prochaines étapes :"
echo "1. Redémarrer le serveur : npm run dev"
echo "2. Se connecter en admin : http://localhost:3001/login (code: admin456)"
echo "3. Tester l'upload : http://localhost:3001/admin/upload"
echo ""
echo "✨ Upload Vercel Blob maintenant activé !" 