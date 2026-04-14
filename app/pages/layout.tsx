
import { MapLocationProvider } from '@/context/context';
import React from 'react';
import { NavLinks } from '../components/NavLinks';

// Important: Next.js Root Layouts must include <html> and <body> tags
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MapLocationProvider> 
          <div className="flex flex-col min-h-screen">
            <NavLinks/>
            <main className="grow">
              {children}
            </main>
          </div>
        </MapLocationProvider>
      </body>
    </html>
  );
}