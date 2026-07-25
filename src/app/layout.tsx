import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Piano Learning App — Free Play & Guided Songs",
  description:
    "Learn piano in your browser. 61-key interactive keyboard with Free Play mode and guided Learning Mode featuring falling-notes visualizer, scoring, and tempo control. Built with Next.js, Tone.js, and Tailwind CSS.",
  keywords: [
    "piano",
    "learn piano",
    "online piano",
    "tone.js",
    "next.js",
    "music",
    "falling notes",
    "keyboard",
  ],
  authors: [{ name: "Piano Learning App" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Piano Learning App",
    description:
      "61-key interactive web piano with Free Play and guided Learning Mode.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Piano Learning App",
    description:
      "61-key interactive web piano with Free Play and guided Learning Mode.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
