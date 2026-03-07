import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";
import { GlobalKeyboardShortcuts } from "@/components/global-keyboard-shortcuts";
import { LunchNotificationProvider } from "@/components/lunch-notification-provider";
import { ContractReminderProvider } from "@/components/contract-reminder-provider";
import { NotificationPermissionBanner } from "@/components/notification-permission-banner";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LunchNotificationProvider>
      <ContractReminderProvider>
        <GlobalKeyboardShortcuts />
        <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <a
            href="#main-content"
            className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:block focus:w-auto focus:h-auto focus:overflow-visible focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:m-0 focus:border-0 focus:[clip:auto] focus:whitespace-normal"
          >
            Skip to main content
          </a>
          <NotificationPermissionBanner />
          <Header />
          <main
            id="main-content"
            className="flex-1 overflow-y-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-4"
            tabIndex={-1}
          >
            {children}
          </main>
          <MobileNav />
          <PwaInstallPrompt />
        </SidebarInset>
      </SidebarProvider>
      </ContractReminderProvider>
    </LunchNotificationProvider>
  );
}
