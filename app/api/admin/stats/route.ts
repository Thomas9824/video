import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const [
      totalVideos,
      totalUsers,
      totalAccessCodes,
      totalStorageResult,
      recentActivities,
    ] = await Promise.all([
      prisma.video.count(),
      prisma.user.count(),
      prisma.accessCode.count({
        where: { isActive: true },
      }),
      prisma.video.aggregate({
        _sum: { size: true },
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          details: true,
          createdAt: true,
        },
      }),
    ]);

    const stats = {
      totalVideos,
      totalUsers,
      totalAccessCodes,
      totalStorage: totalStorageResult._sum.size || 0,
      recentActivities,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 