#!/bin/bash

echo "🚀 Configuration automatique du projet Lecteur Vidéo"
echo "=================================================="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Copier le fichier d'environnement
if [ ! -f .env ]; then
    echo "🔧 Copie du fichier d'environnement..."
    cp env.example .env
    echo "✅ Fichier .env créé. Veuillez le configurer avec vos paramètres."
else
    echo "ℹ️  Fichier .env existe déjà."
fi

# Initialiser la base de données
echo "🗄️  Initialisation de la base de données..."
npm run db:init

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📝 Prochaines étapes :"
echo "1. Configurer les variables d'environnement dans .env"
echo "2. Ajouter vos credentials Cloudinary"
echo "3. Démarrer le serveur : npm run dev"
echo ""
echo "🎯 Codes d'accès par défaut :"
echo "   - Utilisateur : user123"
echo "   - Administrateur : admin456"
echo ""
echo "🌐 L'application sera disponible sur : http://localhost:3000" 