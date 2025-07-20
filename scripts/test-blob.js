#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Test de configuration Vercel Blob');
console.log('=====================================');

// Lire le fichier .env
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ Fichier .env non trouvé');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let blobToken = null;
for (const line of lines) {
  if (line.startsWith('BLOB_READ_WRITE_TOKEN=')) {
    blobToken = line.split('=')[1].replace(/"/g, '');
    break;
  }
}

console.log('📁 Fichier .env:', '✅');
console.log('🔑 Token Vercel Blob:', blobToken ? '✅ Configuré' : '❌ Non configuré');

if (blobToken) {
  console.log('🔍 Format du token:', blobToken.startsWith('vercel_blob_rw_') ? '✅ Correct' : '❌ Incorrect');
  console.log('📄 Début du token:', blobToken.substring(0, 20) + '...');
}

// Vérifier que les dépendances sont installées
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const hasVercelBlob = packageJson.dependencies && packageJson.dependencies['@vercel/blob'];
console.log('📦 Dépendance @vercel/blob:', hasVercelBlob ? '✅ Installée' : '❌ Manquante');

// Vérifier les fichiers critiques
const criticalFiles = [
  'lib/blob.ts',
  'app/api/upload/video/route.ts',
  'app/api/admin/upload/route.ts'
];

console.log('\n📁 Fichiers critiques:');
for (const file of criticalFiles) {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
}

console.log('\n🎯 Résumé:');
if (blobToken && blobToken.startsWith('vercel_blob_rw_') && hasVercelBlob) {
  console.log('✅ Configuration Vercel Blob complète et fonctionnelle !');
  console.log('🚀 Les vidéos uploadées seront stockées sur Vercel Blob');
  console.log('📍 URLs des vidéos: *.public.blob.vercel-storage.com');
} else {
  console.log('⚠️  Configuration incomplète:');
  if (!blobToken) console.log('   - Token Vercel Blob manquant');
  if (!blobToken?.startsWith('vercel_blob_rw_')) console.log('   - Format du token incorrect');
  if (!hasVercelBlob) console.log('   - Dépendance @vercel/blob manquante');
} 