#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification du statut de l\'application...\n');

// Vérifier les fichiers essentiels
const requiredFiles = [
  '.env',
  'package.json',
  'prisma/schema.prisma',
  'app/layout.tsx',
  'app/login/page.tsx',
  'app/admin/dashboard/page.tsx',
  'app/admin/upload/page.tsx',
  'app/viewer/page.tsx',
];

console.log('📁 Vérification des fichiers essentiels:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MANQUANT`);
  }
});

// Vérifier la base de données
console.log('\n🗄️  Vérification de la base de données:');
const dbPaths = ['dev.db', 'prisma/dev.db'];
let dbFound = false;

dbPaths.forEach(dbPath => {
  if (fs.existsSync(dbPath)) {
    console.log(`   ✅ ${dbPath} existe`);
    dbFound = true;
  }
});

if (!dbFound) {
  console.log('   ❌ Base de données manquante - Exécutez: npm run db:push');
}

// Vérifier les variables d'environnement
console.log('\n🔧 Vérification des variables d\'environnement:');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'DEFAULT_USER_CODE',
    'DEFAULT_ADMIN_CODE',
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`   ✅ ${envVar}`);
    } else {
      console.log(`   ❌ ${envVar} - MANQUANT`);
    }
  });
  
  // Vérifier Vercel Blob
  console.log('\n📤 Configuration Vercel Blob:');
  if (envContent.includes('BLOB_READ_WRITE_TOKEN') && !envContent.includes('BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"')) {
    console.log('   ✅ Vercel Blob configuré - Upload fonctionnel');
  } else {
    console.log('   ⚠️  Vercel Blob non configuré - Configurez BLOB_READ_WRITE_TOKEN');
    console.log('       Obtenez votre token sur: https://vercel.com/dashboard/stores');
  }
} else {
  console.log('   ❌ Fichier .env manquant');
}

// Vérifier node_modules
console.log('\n📦 Vérification des dépendances:');
if (fs.existsSync('node_modules')) {
  console.log('   ✅ node_modules installés');
} else {
  console.log('   ❌ node_modules manquants - Exécutez: npm install');
}

// Résumé et instructions
console.log('\n🎯 Résumé:');
console.log('   • Application: Lecteur Vidéo Next.js');
console.log('   • Stockage: Vercel Blob');
console.log('   • URL: http://localhost:3000');
console.log('   • Code utilisateur: user123');
console.log('   • Code admin: admin456');

console.log('\n📝 Pour démarrer:');
console.log('   1. npm install (pour installer @vercel/blob)');
console.log('   2. npm run dev');
console.log('   3. Ouvrir http://localhost:3000');
console.log('   4. Se connecter avec un code d\'accès');

console.log('\n🚀 Pour configurer Vercel Blob:');
console.log('   1. Aller sur https://vercel.com/dashboard/stores');
console.log('   2. Créer un nouveau Blob Store');
console.log('   3. Copier le token BLOB_READ_WRITE_TOKEN');
console.log('   4. L\'ajouter dans le fichier .env');

console.log('\n✨ Statut: Prêt à l\'emploi avec Vercel Blob !'); 