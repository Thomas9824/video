import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProviderWrapper from '../components/providers/SessionProviderWrapper';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Lecteur Vidéo - Projet Vidéo',
  description: 'Application sécurisée de gestion et lecture de contenu vidéo',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 antialiased`} 
            style={{ fontFamily: '"Geist", "Inter", system-ui, sans-serif' }}>
              <SessionProviderWrapper>
                {children}
              </SessionProviderWrapper>
      </body>
    </html>
  );
} 