
import React from 'react';

// Nested layout for /pages/* routes
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <div className="flex flex-col min-h-screen">
            <main className="grow">
              {children}
            </main>
          </div>
  );
}