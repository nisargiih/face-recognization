import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Nexus - Modern SaaS Platform',
  description: 'A comprehensive full-stack platform with authentication, dashboard, and community features.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
