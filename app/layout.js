// app/layout.js

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import Script from 'next/script';

// --- IMPORTAÇÃO DOS CONTEXTOS ---
// O AuthProvider gerencia o Login
import { AuthProvider } from '@/contexts/AuthContext';
// O OrganizationProvider gerencia a Empresa (1 + 2)
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import QueryProvider from './QueryProvider';
import { Providers } from './providers'; // Seus outros providers (Chakra/UI)

import ServiceWorkerRegistrar from '@/components/shared/ServiceWorkerRegistrar';
import '@/components/financeiro/pdfPolyfill'; // Vacina do PDF

const inter = Inter({ subsets: ['latin'] });

export const viewport = {
  themeColor: '#0288d1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  metadataBase: new URL('https://www.studio57.com.br'),
  title: {
    default: 'Studio 57 - Sistema de Gestão Integrada',
    template: '%s | Studio 57',
  },
  description: 'Conectando você aos melhores investimentos imobiliários.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <ServiceWorkerRegistrar />

        {/* --- ORDEM DE CARREGAMENTO (HIERARQUIA) --- */}
        
        {/* 1. AuthProvider: Descobre QUEM é o usuário */}
        <AuthProvider>
          
          {/* 2. OrganizationProvider: Descobre ONDE ele trabalha e O QUE ele vê */}
          <OrganizationProvider>
            
            {/* 3. QueryProvider: Cache de dados (React Query) */}
            <QueryProvider>
              
              {/* 4. UI Providers (Estilos, Temas) */}
              <Providers>
                {children}
              </Providers>

            </QueryProvider>
          </OrganizationProvider>
        </AuthProvider>

        {/* --- SCRIPTS E UTILITÁRIOS --- */}
        <div id="fb-root"></div>
        <Script
          async
          defer
          crossOrigin="anonymous"
          src="https://connect.facebook.net/pt_BR/sdk.js"
          strategy="afterInteractive"
        />
        <Script id="facebook-sdk-init" strategy="afterInteractive">
          {`
            window.fbAsyncInit = function() {
              FB.init({
                appId      : '1518358099511142',
                cookie     : true,
                xfbml      : true,
                version    : 'v20.0'
              });
              FB.AppEvents.logPageView();   
            };
          `}
        </Script>
        <Script src="https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js" strategy="beforeInteractive" />

        <Toaster 
          richColors 
          position="top-right" 
          toastOptions={{ className: 'print:hidden' }}
        />
      </body>
    </html>
  );
}