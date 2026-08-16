import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Cookie,
  LockKeyhole,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Cookie Policy | Dial a Tech",
  description:
    "Learn how Dial a Tech uses cookies and similar technologies to provide, secure, and improve our home services marketplace.",
};




const cookieTypes = [
  {
    title: "Essential Cookies",
    icon: ShieldCheck,
    description:
      "These cookies are necessary for Dial a Tech to function properly and cannot normally be disabled.",
    items: [
      "Maintain your login session",
      "Authenticate users",
      "Keep your account secure",
      "Maintain booking sessions",
      "Support protected dashboard features",
      "Prevent unauthorized access",
    ],
  },
  {
    title: "Functional Cookies",
    icon: Settings2,
    description:
      "These cookies help Dial a Tech remember preferences and provide a more convenient experience.",
    items: [
      "Remember user preferences",
      "Maintain interface settings",
      "Remember selected options",
      "Improve the overall user experience",
    ],
  },
  {
    title: "Security Cookies",
    icon: LockKeyhole,
    description:
      "These cookies and similar technologies help protect Dial a Tech and its users from security threats.",
    items: [
      "Detect suspicious activity",
      "Prevent unauthorized account access",
      "Reduce fraud and abuse",
      "Protect authentication sessions",
      "Improve platform security",
    ],
  },
  {
    title: "Analytics Cookies",
    icon: Cookie,
    description:
      "When analytics services are enabled, these cookies help us understand how users interact with Dial a Tech.",
    items: [
      "Understand which pages are visited",
      "Measure feature usage",
      "Analyze navigation patterns",
      "Improve website performance",
      "Understand general usage statistics",
    ],
  },
];

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Link
            href="/tech"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dial a Tech
          </Link>

          <div className="flex flex-col gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10">
              <Cookie className="h-7 w-7 text-orange-500" />
            </div>

            <div>
              <Badge
                variant="secondary"
                className="mb-4 rounded-full px-3 py-1"
              >
                Legal & Privacy
              </Badge>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Cookie Policy
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                This Cookie Policy explains how Dial a Tech uses cookies and
                similar technologies to provide, secure, and improve our home
                services marketplace.
              </p>

              <p className="mt-4 text-sm text-muted-foreground">
                Last updated:{" "}
                <span className="font-medium text-foreground">
                  August 12, 2026
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="space-y-10">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              1. What Are Cookies?
            </h2>

            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
              <p>
                Cookies are small text files stored on your device when you
                visit a website. They allow a website to remember information
                about your visit and help provide a better, more secure, and
                personalized experience.
              </p>

              <p>Cookies may be classified as:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-foreground">
                    Session cookies
                  </strong>{" "}
                  — deleted when you close your browser.
                </li>

                <li>
                  <strong className="text-foreground">
                    Persistent cookies
                  </strong>{" "}
                  — remain on your device for a specified period or until you
                  delete them.
                </li>

                <li>
                  <strong className="text-foreground">
                    First-party cookies
                  </strong>{" "}
                  — placed directly by Dial a Tech.
                </li>

                <li>
                  <strong className="text-foreground">
                    Third-party cookies
                  </strong>{" "}
                  — placed by services provided by third parties.
                </li>
              </ul>
            </div>
          </section>

          <Separator />

          {/* How We Use Cookies */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              2. How Dial a Tech Uses Cookies
            </h2>

            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              Dial a Tech may use cookies and similar technologies for several
              purposes, including authentication, security, functionality,
              analytics, and third-party integrations.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {cookieTypes.map((cookie) => {
                const Icon = cookie.icon;

                return (
                  <Card key={cookie.title} className="h-full">
                    <CardHeader>
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                        <Icon className="h-5 w-5 text-orange-500" />
                      </div>

                      <CardTitle className="text-lg">
                        {cookie.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {cookie.description}
                      </p>

                      <ul className="mt-4 space-y-2">
                        {cookie.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Authentication */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              3. Authentication Cookies
            </h2>

            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
              <p>
                When you sign in to Dial a Tech, we may store authentication
                information in cookies so that you do not need to authenticate
                on every page.
              </p>

              <p>
                Authentication cookies help maintain your authenticated
                session and protect access to your Dial a Tech account.
              </p>

              <p>
                Where appropriate, authentication cookies may use security
                protections such as:
              </p>

              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    HttpOnly
                  </code>
                </li>

                <li>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    Secure
                  </code>
                </li>

                <li>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    SameSite
                  </code>
                </li>
              </ul>
            </div>
          </section>

          <Separator />

          {/* Cookie Table */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              4. Cookies We May Use
            </h2>

            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              Depending on the features enabled on Dial a Tech, cookies may
              generally fall into the following categories.
            </p>

            <div className="mt-6 overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Cookie Category
                      </th>

                      <th className="px-5 py-4 font-semibold">Purpose</th>

                      <th className="px-5 py-4 font-semibold">
                        Typical Duration
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    <tr>
                      <td className="px-5 py-4 font-medium">
                        Essential
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        Authentication, security, sessions, and core
                        functionality
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        Session or configured duration
                      </td>
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-medium">
                        Functional
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        Preferences and user experience
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        Configured duration
                      </td>
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-medium">
                        Analytics
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        Understanding website usage and performance
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        Configured duration
                      </td>
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-medium">
                        Payment / Third-Party
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        Supporting integrated third-party services
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        Determined by provider
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The specific cookies used by Dial a Tech may change as we add,
              remove, or update features.
            </p>
          </section>

          <Separator />

          {/* Managing Cookies */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              5. Managing Cookies
            </h2>

            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
              <p>
                Most modern web browsers allow you to control or delete
                cookies through their settings.
              </p>

              <p>You can generally:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>Delete existing cookies.</li>
                <li>Block cookies.</li>
                <li>Allow cookies from specific websites.</li>
                <li>Block third-party cookies.</li>
                <li>Receive notifications before cookies are stored.</li>
              </ul>

              <div className="rounded-xl border bg-muted/30 p-5">
                <p className="font-medium text-foreground">
                  Important
                </p>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Disabling essential cookies may cause some Dial a Tech
                  features to stop working properly.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Third Party */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              6. Third-Party Services
            </h2>

            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
              <p>
                Dial a Tech may integrate third-party services to provide certain
                functionality.
              </p>

              <ul className="list-disc space-y-2 pl-6">
                <li>Google authentication</li>
                <li>Payment providers</li>
                <li>Analytics services</li>
                <li>Cloud hosting services</li>
                <li>Security and fraud-prevention services</li>
              </ul>

              <p>
                These third-party providers may use cookies or similar
                technologies according to their own privacy and cookie
                policies.
              </p>
            </div>
          </section>

          <Separator />

          {/* Personal Information */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              7. Do Cookies Collect Personal Information?
            </h2>

            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
              <p>
                Cookies themselves may contain identifiers or technical
                information that can be associated with your account or
                device.
              </p>

              <p>
                Depending on how Dial a Tech is configured, information associated
                with cookies may include:
              </p>

              <ul className="list-disc space-y-2 pl-6">
                <li>Session identifiers</li>
                <li>Authentication information</li>
                <li>Device information</li>
                <li>Browser information</li>
                <li>Security-related information</li>
                <li>Usage information</li>
              </ul>

              <p>
                We do not use cookies to intentionally collect sensitive
                personal information unless necessary for a specific service
                and permitted by applicable law.
              </p>
            </div>
          </section>

          <Separator />

          {/* Security */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              8. Cookie Security
            </h2>

            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
              <p>
                We take reasonable technical and organizational measures to
                protect cookies and information associated with them.
              </p>

              <p>
                Where appropriate, cookies may use security attributes such as
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                  HttpOnly
                </code>
                ,
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                  Secure
                </code>
                , and
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                  SameSite
                </code>
                .
              </p>

              <p>
                However, no online system can be guaranteed to be completely
                secure. You are also responsible for keeping your account
                credentials and device secure.
              </p>
            </div>
          </section>

          <Separator />

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              9. Changes to This Cookie Policy
            </h2>

            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
              <p>
                We may update this Cookie Policy from time to time to reflect
                changes to Dial a Tech, new technologies, third-party services,
                legal requirements, or improvements to our security practices.
              </p>

              <p>
                When we make changes, we will update the{" "}
                <strong className="text-foreground">
                  Last Updated
                </strong>{" "}
                date at the top of this page.
              </p>
            </div>
          </section>

          <Separator />

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              10. Contact Us
            </h2>

            <div className="mt-4 rounded-2xl border bg-muted/30 p-6">
              <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                If you have questions about this Cookie Policy or how Dial a Tech
                uses cookies, please contact us through the support channels
                provided on the Dial a Tech platform.
              </p>

              <div className="mt-5">
                <p className="font-semibold">Dial a Tech</p>
                <p className="text-sm text-muted-foreground">
                  Home Services Marketplace
                </p>
              </div>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Cookie Policy Version 1.0
            </p>

            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/tech/privacy-policy"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>

              <Link
                href="/tech/terms"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms & Conditions
              </Link>

              <Link
                href="/tech"
                className="font-medium text-orange-500 transition-colors hover:text-orange-600"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}