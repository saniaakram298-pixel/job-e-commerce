import { ReactNode } from 'react';
import '@/styles/globals.css';
import { CartProvider } from '@/context/CartContext'; // Import context
import GlobalSanitizer from '@/components/GlobalSanitizer';
import ReactQueryProvider from '@/components/ReactQueryProvider';
import { ToastContainer } from '@/components/ToastContainer';

export const metadata = {
  title: 'The Atelier - Luxury Fashion E-commerce',
  description: 'Curated fashion platform with luxury minimalist aesthetic',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    // 'overflow-x-hidden' html par lagaya taake browser level par horizontal scroll block ho sake
    <html lang="en" className="overflow-x-hidden">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,100..900;1,100..900&family=Manrope:wght@200..800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* Body par 'overflow-x-hidden w-full max-w-full' force kiya hai safe rendering k liye */}
      <body className="bg-background text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden w-full max-w-full relative">
        
        {/* Toast Container for notifications */}
        <ToastContainer />
        
        {/* CartProvider ko yahan wrap kar diya hai */}
        <CartProvider>
          <ReactQueryProvider>
            <GlobalSanitizer />
            
            {/* Safe Zone Wrapper: Yeh div kisi bhi page content (children) ko mobile layout se bahar push nahi hone degi */}
            <div className="w-full max-w-full overflow-x-hidden relative">
              {children}
            </div>

          </ReactQueryProvider>
        </CartProvider>
      </body>
    </html>
  );
}