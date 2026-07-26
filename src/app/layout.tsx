import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/ThemeProvider";

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
    <html lang="en" className="h-full">
      <body style={{ minHeight: '100vh' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
