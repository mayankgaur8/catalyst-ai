import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CATalyst AI — India's #1 AI-Powered MBA Preparation Platform",
  description:
    "Crack CAT, XAT, SNAP, NMAT with AI-powered personalized preparation. 99 percentile roadmap, adaptive mocks, AI doubt solver, IIM predictor and more.",
  keywords: "CAT preparation, MBA entrance, IIM coaching, CAT mock tests, AI study plan, VARC, DILR, QA",
  openGraph: {
    title: "CATalyst AI — Your MBA Success Story Starts Here",
    description: "India's most intelligent MBA prep platform powered by AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
