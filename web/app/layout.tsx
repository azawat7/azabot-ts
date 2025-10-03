import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { AppContent } from "./components/layout/AppContent";
import { Inter } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "azabot web app",
  description: "web dashboard for azabot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-neutral-900">
        <AuthProvider>
          <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}
