import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | PocketShift",
  description: "PocketShift terms and conditions",
};

export default function TermsPage() {
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
          <CardTitle className="text-2xl">Terms and Conditions</CardTitle>
          <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using PocketShift (&quot;the Service&quot;), you agree to be bound by these Terms and Conditions. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">2. Description of Service</h2>
            <p>
              PocketShift is a personal work productivity application that helps you track events, contacts, contracts, and spending across multiple companies. The Service is provided as a Progressive Web App (PWA) and may be used in a web browser or installed on your device.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">3. Account & Eligibility</h2>
            <p>
              You must create an account to use PocketShift. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide accurate and complete registration information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us of any unauthorized access to your account</li>
            </ul>
            <p>
              You must be at least 16 years old to use the Service. The Service is intended for personal, non-commercial use.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">4. Acceptable Use</h2>
            <p>
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to the Service, other accounts, or systems</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Upload content that infringes others&apos; rights or is harmful, offensive, or inappropriate</li>
              <li>Use automated means (e.g., bots, scrapers) to access the Service without permission</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">5. Your Data & Privacy</h2>
            <p>
              You retain ownership of the data you create in PocketShift. Our collection and use of your data is described in our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>. By using the Service, you consent to that policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">6. Intellectual Property</h2>
            <p>
              PocketShift, including its design, code, and branding, is protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without permission, except as allowed by the applicable open-source license if the software is provided under one.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">7. Service Availability</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee uninterrupted access. PocketShift supports offline use; data may be cached locally and synced when connectivity is restored. We are not responsible for data loss due to device failure, user error, or connectivity issues.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE, SECURE, OR UNINTERRUPTED.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO USE THE SERVICE IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED EUROS (€100), WHICHEVER IS GREATER.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">10. Termination</h2>
            <p>
              You may stop using the Service at any time. We may suspend or terminate your access for violation of these terms, for legal reasons, or at our discretion. Upon termination, your right to use the Service ceases. Data retention depends on the operator&apos;s policies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">11. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will indicate changes by updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance. If you do not agree, you must stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the jurisdiction in which the operator of your PocketShift instance is located. Any disputes shall be resolved in the courts of that jurisdiction, unless otherwise required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">13. Contact</h2>
            <p>
              For questions about these Terms, contact the operator of your PocketShift instance or the contact information provided in the app.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
