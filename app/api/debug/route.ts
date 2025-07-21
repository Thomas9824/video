import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Vérifier les variables d'environnement critiques
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
      NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL || 'NOT SET',
    };

    // Tester la connexion à la base de données
    let dbConnection = false;
    let dbError = null;
    try {
      await prisma.$connect();
      await prisma.$executeRaw`SELECT 1`;
      dbConnection = true;
      console.log('✅ Database connection successful');
    } catch (error) {
      dbError = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Database connection failed:', dbError);
    } finally {
      await prisma.$disconnect();
    }

    // Tester la création des tables
    let tablesExist = false;
    let tablesError = null;
    try {
      const result = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('User', 'AccessCode', 'Video', 'ActivityLog', 'Account', 'Session')
      `;
      tablesExist = Array.isArray(result) && result.length > 0;
    } catch (error) {
      tablesError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: envCheck,
      database: {
        connection: dbConnection,
        error: dbError,
        tablesExist,
        tablesError,
      },
      nextAuth: {
        configured: envCheck.NEXTAUTH_URL && envCheck.NEXTAUTH_SECRET,
        url: envCheck.NEXTAUTH_URL_VALUE,
      },
      status: dbConnection && envCheck.NEXTAUTH_URL && envCheck.NEXTAUTH_SECRET ? 'OK' : 'ERROR'
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}