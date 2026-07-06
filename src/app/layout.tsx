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
    <html lang="en">
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
      <body className="bg-background text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
        {/* Toast Container for notifications */}
        <ToastContainer />
        
        {/* CartProvider ko yahan wrap kar diya hai */}
        <CartProvider>
          <ReactQueryProvider>
            <GlobalSanitizer />
            {children}
          </ReactQueryProvider>
        </CartProvider>
      </body>
    </html>
  );
}