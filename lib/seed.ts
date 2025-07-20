import { prisma } from './prisma';

async function main() {
  console.log('🌱 Initialisation de la base de données...');

  // Codes d'accès par défaut
  const defaultCodes = [
    {
      code: process.env.DEFAULT_USER_CODE || 'user123',
      type: 'USER',
      isActive: true,
    },
    {
      code: process.env.DEFAULT_ADMIN_CODE || 'admin456',
      type: 'ADMIN',
      isActive: true,
    },
  ];

  // Créer les codes d'accès par défaut
  for (const codeData of defaultCodes) {
    const existingCode = await prisma.accessCode.findUnique({
      where: { code: codeData.code },
    });

    if (!existingCode) {
      await prisma.accessCode.create({
        data: codeData,
      });
      console.log(`✅ Code d'accès ${codeData.type} créé: ${codeData.code}`);
    } else {
      console.log(`ℹ️  Code d'accès ${codeData.type} existe déjà: ${codeData.code}`);
    }
  }

  console.log('✨ Initialisation terminée !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'initialisation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 