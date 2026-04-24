
import { MapLocationProvider } from '@/context/context';
import { CreditProvider } from "@/context/creditcontext";

import React from 'react';
import { NavLinks } from '../components/NavLinks';

// Important: Next.js Root Layouts must include <html> and <body> tags
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <MapLocationProvider> 
          <CreditProvider>
          <div className="flex flex-col min-h-screen">
            <NavLinks/>
            <main className="grow">
              {children}
            </main>
          </div></CreditProvider>
        </MapLocationProvider>
  );
}