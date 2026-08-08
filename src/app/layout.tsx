import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthHashListener } from "@/components/AuthHashListener";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  // Only include weights actually used in the project
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: "CreateForEarn — Reddit Workforce Platform",
  description: "The professional platform for Reddit task management. Earn money by completing community-building tasks, submit proof, and get paid directly to your bank or crypto wallet.",
  keywords: "reddit, workforce, earn money, community builder, tasks, createforearn",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body style={{ minHeight: '100vh' }}>
        <ThemeProvider>
          <AuthHashListener />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
