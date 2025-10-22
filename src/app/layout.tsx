import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Lessons - AI Educational Content Generator",
  description: "Generate interactive educational content with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
