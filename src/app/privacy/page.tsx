import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | PocketShift",
  description: "PocketShift privacy policy",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-2xl py-8">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/settings">
          <ArrowLeft className="mr-2 size-4" />
          Back to Settings
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Privacy Policy</CardTitle>
          <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. Introduction</h2>
            <p>
              PocketShift (&quot;we,&quot; &quot;our,&quot; or &quot;the app&quot;) is a personal work productivity tracker. This Privacy Policy explains how we collect, use, store, and protect your information when you use our application. By using PocketShift, you agree to this policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">2. Information We Collect</h2>
            <p>
              PocketShift is designed for personal use. We collect and store only what you provide:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Account information:</strong> Email address and password (or magic link) for authentication</li>
              <li><strong className="text-foreground">Profile data:</strong> Company names, logos, and related settings</li>
              <li><strong className="text-foreground">Events & projects:</strong> Titles, descriptions, due dates, and status</li>
              <li><strong className="text-foreground">Contacts:</strong> Names, departments, photos, and meeting dates</li>
              <li><strong className="text-foreground">Contracts:</strong> Start dates, duration, contract type, and notes</li>
              <li><strong className="text-foreground">Spending data:</strong> Menu items, purchases, and prices</li>
              <li><strong className="text-foreground">Preferences:</strong> Theme, language, date format, currency, lunch break settings, and notification preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>
              Your data is used solely to provide and improve PocketShift:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>To authenticate you and manage your account</li>
              <li>To store and sync your data across devices</li>
              <li>To send reminders (e.g., lunch break, contract expiry) if you enable notifications</li>
              <li>To support offline use by caching data locally on your device</li>
            </ul>
            <p>
              We do not sell, rent, or share your personal data with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">4. Data Storage & Third-Party Services</h2>
            <p>
              PocketShift uses the following services:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Supabase:</strong> Authentication and cloud database. Your data is stored on Supabase infrastructure. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Supabase&apos;s privacy policy</a> for details.</li>
              <li><strong className="text-foreground">Local storage (IndexedDB):</strong> Data is cached on your device for offline access. Pending changes are queued locally and synced when you are back online.</li>
            </ul>
            <p>
              If you deploy PocketShift yourself, you control your own Supabase project and data. If you use a hosted instance, the operator of that instance is responsible for data handling.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">5. Push Notifications</h2>
            <p>
              If you enable push notifications, we use the Web Push API to send reminders (e.g., lunch break alerts, contract expiry warnings). Notification content is generated from your own settings and data. You can disable notifications at any time in Settings.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">6. Data Security</h2>
            <p>
              We use industry-standard practices to protect your data: authentication via Supabase Auth, Row Level Security (RLS) so each user can only access their own data, and encrypted connections (HTTPS). You are responsible for keeping your password secure.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">7. Your Rights</h2>
            <p>
              You can:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access, update, or delete your data through the app</li>
              <li>Export or remove your data by contacting the service operator</li>
              <li>Disable notifications in Settings</li>
              <li>Sign out and request account deletion</li>
            </ul>
            <p>
              If you are in the European Economic Area (EEA), you may have additional rights under GDPR. Contact the operator of your PocketShift instance for requests.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">8. Children</h2>
            <p>
              PocketShift is not intended for users under 16. We do not knowingly collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">9. Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top will reflect changes. Continued use of PocketShift after updates constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">10. Contact</h2>
            <p>
              For questions about this Privacy Policy or your data, contact the operator of your PocketShift instance or the contact information provided in the app.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
