import type { Metadata } from 'next';
import { Inter, Orbitron, Bebas_Neue } from 'next/font/google';
import './globals.css';
import Layout from '@/components/Layout';

const inter = Inter({ subsets: ['latin'] });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });
const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas-neue' });

export const metadata: Metadata = {
  title: 'OrganizApp - Gestion de projets et tâches',
  description: 'Application de gestion de projets et tâches pour développeurs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${orbitron.variable} ${bebasNeue.variable}`}>
      <body className={inter.className}>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
