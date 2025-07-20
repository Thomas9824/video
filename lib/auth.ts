import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { verifyPassword } from './password';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        password: { label: 'Mot de passe ou Code d\'accès', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.password) {
          return null;
        }

        try {
          const inputValue = credentials.password;
          console.log('🔐 Tentative de connexion avec:', inputValue);
          
          // Stratégie 1: Essayer comme code d'accès d'abord
          console.log('🎫 Test en tant que code d\'accès...');
          const accessCode = await prisma.accessCode.findUnique({
            where: {
              code: inputValue,
              isActive: true,
            },
            include: {
              user: true,
            },
          });

          if (accessCode && (!accessCode.expiresAt || accessCode.expiresAt >= new Date())) {
            console.log('✅ Code d\'accès valide trouvé');
            
            // Créer ou récupérer l'utilisateur
            let user = accessCode.user;
            if (!user) {
              user = await prisma.user.create({
                data: {
                  role: accessCode.type === 'ADMIN' ? 'ADMIN' : 'USER',
                },
              });

              await prisma.accessCode.update({
                where: { id: accessCode.id },
                data: { userId: user.id },
              });
            }

            await prisma.activityLog.create({
              data: {
                action: 'LOGIN_ACCESS_CODE',
                details: `Connexion avec code ${accessCode.type}`,
                userId: user.id,
              },
            });

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }

          // Stratégie 2: Essayer comme mot de passe pour tous les utilisateurs
          console.log('🔍 Test en tant que mot de passe...');
          const usersWithPasswords = await prisma.user.findMany({
            where: {
              password: { not: null }
            }
          });

          for (const user of usersWithPasswords) {
            if (user.password) {
              const isPasswordValid = await verifyPassword(inputValue, user.password);
              if (isPasswordValid) {
                console.log('✅ Mot de passe valide pour:', user.email || user.id);

                await prisma.activityLog.create({
                  data: {
                    action: 'LOGIN_PASSWORD',
                    details: `Connexion avec mot de passe`,
                    userId: user.id,
                  },
                });

                return {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                };
              }
            }
          }

          console.log('❌ Aucune correspondance trouvée');
          return null;
          
        } catch (error) {
          console.error('❌ Erreur d\'authentification:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as 'USER' | 'ADMIN';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 heures
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 