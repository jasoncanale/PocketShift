import type { Metadata, Viewport } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PwaUpdatePrompt } from "@/components/pwa-update-prompt";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { ProfileProvider } from "@/providers/profile-provider";
import { QueryProvider } from "@/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfflineBanner } from "@/components/offline-banner";
import { SyncProvider } from "@/components/sync-provider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PocketShift",
  description: "Personal work productivity tracker",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PocketShift",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </head>
      <body
        className={`${poppins.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <PwaUpdatePrompt />
          <QueryProvider>
            <AuthProvider>
              <SyncProvider>
              <ProfileProvider>
                <TooltipProvider>
                  <OfflineBanner />
                  {children}
                  <Toaster richColors position="top-center" />
                </TooltipProvider>
              </ProfileProvider>
              </SyncProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
