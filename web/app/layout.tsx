import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
