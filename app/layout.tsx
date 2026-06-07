import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Contas Casa',
  description: 'Gestão de despesas domésticas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
