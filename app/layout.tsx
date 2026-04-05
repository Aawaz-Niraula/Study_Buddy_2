import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ClientErrorBoundary } from "./ClientErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#06060b",
};

export const metadata: Metadata = {
  title: "Study Buddy — AI Study Questions",
  description: "Turn your notes into smart study questions with AI. Generate quizzes, flashcards, and tests from text, PDFs, or photos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientErrorBoundary>
          {children}
        </ClientErrorBoundary>
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              background: "#0b0b12",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#f2efff",
            },
          }}
        />
      </body>
    </html>
  );
}
