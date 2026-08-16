
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Cookie,
  Database,
  Eye,
  FileText,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* =========================================================
   TABLE OF CONTENTS
========================================================= */

const sections = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
  },
  {
    id: "how-we-use-information",
    title: "How We Use Your Information",
  },
  {
    id: "information-sharing",
    title: "Information Sharing",
  },
  {
    id: "cookies",
    title: "Cookies & Similar Technologies",
  },
  {
    id: "data-security",
    title: "Data Security",
  },
  {
    id: "data-retention",
    title: "Data Retention",
  },
  {
    id: "your-rights",
    title: "Your Rights & Choices",
  },
  {
    id: "third-party-services",
    title: "Third-Party Services",
  },
  {
    id: "children-privacy",
    title: "Children's Privacy",
  },
  {
    id: "policy-changes",
    title: "Changes to This Policy",
  },
  {
    id: "contact",
    title: "Contact Us",
  },
];

/* =========================================================
   INFO CARDS
========================================================= */

const privacyHighlights = [
  {
    icon: Eye,
    title: "Transparency",
    description:
      "We explain what information we collect and how it is used.",
  },
  {
    icon: Lock,
    title: "Security",
    description:
      "We take reasonable measures to help protect your information.",
  },
  {
    icon: UserCheck,
    title: "Your Choices",
    description:
      "You have choices regarding certain information and communications.",
  },
];

/* =========================================================
   PRIVACY POLICY PAGE
========================================================= */

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden border-b">
        {/* Background glow */}

        <div
          className="
            pointer-events-none
            absolute
            -left-40
            -top-40
            h-96
            w-96
            rounded-full
            bg-orange-500/10
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-40
            -right-40
            h-96
            w-96
            rounded-full
            bg-orange-500/10
            blur-3xl
          "
        />

        <div
          className="
            absolute
            inset-0
            bg-[linear-gradient(to_right,hsl(var(--border)/0.15)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.15)_1px,transparent_1px)]
            bg-[size:32px_32px]
            [mask-image:linear-gradient(to_bottom,black,transparent)]
          "
        />

        <div
          className="
            container
            relative
            mx-auto
            max-w-5xl
            px-4
            py-16
            sm:px-6
            sm:py-20
            lg:px-8
            lg:py-24
          "
        >
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="outline"
              className="
                mb-5
                border-orange-500/30
                bg-orange-500/10
                px-4
                py-2
                text-orange-600
                dark:text-orange-400
              "
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Privacy & Security
            </Badge>

            <h1
              className="
                text-4xl
                font-bold
                tracking-tight
                sm:text-5xl
                lg:text-6xl
              "
            >
              Privacy
              <span className="text-[#ff7308]"> Policy</span>
            </h1>

            <p
              className="
                mx-auto
                mt-5
                max-w-2xl
                text-base
                leading-7
                text-muted-foreground
                sm:text-lg
              "
            >
              Your privacy matters to us. This Privacy Policy explains how
              Dial a Tech collects, uses, protects, and handles information when
              you use our platform.
            </p>

            <p className="mt-5 text-sm text-muted-foreground">
              Effective Date: <strong className="text-foreground">
                [Effective Date]
              </strong>
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          HIGHLIGHTS
      ====================================================== */}

      <section className="border-b bg-muted/30">
        <div
          className="
            container
            mx-auto
            max-w-7xl
            px-4
            py-10
            sm:px-6
            lg:px-8
          "
        >
          <div className="grid gap-4 md:grid-cols-3">
            {privacyHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  className="border-border/70 bg-background"
                >
                  <CardContent className="flex gap-4 p-5">
                    <div
                      className="
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-orange-500/10
                      "
                    >
                      <Icon className="h-5 w-5 text-orange-500" />
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        {item.title}
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <section>
        <div
          className="
            container
            mx-auto
            max-w-7xl
            px-4
            py-12
            sm:px-6
            sm:py-16
            lg:px-8
            lg:py-20
          "
        >
          <div className="grid gap-10 lg:grid-cols-[250px_minmax(0,1fr)]">
            {/* =================================================
                SIDEBAR
            ================================================== */}

            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="mb-4 text-sm font-semibold">
                  On this page
                </p>

                <nav className="space-y-1">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="
                        group
                        flex
                        items-center
                        gap-2
                        rounded-lg
                        px-3
                        py-2
                        text-sm
                        text-muted-foreground
                        transition-colors
                        hover:bg-orange-500/5
                        hover:text-orange-500
                      "
                    >
                      <ChevronRight
                        className="
                          h-3.5
                          w-3.5
                          opacity-0
                          transition-opacity
                          group-hover:opacity-100
                        "
                      />

                      <span>{section.title}</span>
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* =================================================
                POLICY CONTENT
            ================================================== */}

            <article
              className="
                min-w-0
                max-w-4xl
                scroll-mt-24
              "
            >
              {/* Introduction */}

              <div className="rounded-2xl border bg-card p-6 sm:p-8">
                <div className="flex gap-4">
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-orange-500/10
                    "
                  >
                    <FileText className="h-5 w-5 text-orange-500" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">
                      About This Privacy Policy
                    </h2>

                    <p className="mt-3 leading-7 text-muted-foreground">
                      This Privacy Policy describes how [Company Name]
                      ("Dial a Tech", "we", "us", or "our") may collect and use
                      information when you access or use the Dial a Tech website,
                      application, and related services (collectively, the
                      "Platform").
                    </p>

                    <p className="mt-4 leading-7 text-muted-foreground">
                      By using Dial a Tech, you acknowledge that you have read
                      and understood this Privacy Policy. If you do not agree
                      with this policy, please do not use the Platform.
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  1. INFORMATION WE COLLECT
              ================================================== */}

              <section
                id="information-we-collect"
                className="mt-12 scroll-mt-24"
              >
                <SectionHeading
                  number="01"
                  title="Information We Collect"
                />

                <PolicyParagraph>
                  We may collect information that you provide directly,
                  information generated when you use the Platform, and
                  information received from certain third-party services.
                </PolicyParagraph>

                <PolicySubheading>
                  Information You Provide
                </PolicySubheading>

                <PolicyList
                  items={[
                    "Name and contact information, such as email address and phone number.",
                    "Account credentials and profile information.",
                    "Address, city, district, or other service-location information you choose to provide.",
                    "Information about services you request or provide.",
                    "Booking details, scheduling information, and booking notes.",
                    "Reviews, ratings, feedback, and other information you submit.",
                    "Information you provide when contacting our support team.",
                  ]}
                />

                <PolicySubheading>
                  Information Collected Automatically
                </PolicySubheading>

                <PolicyList
                  items={[
                    "Device and browser information.",
                    "IP address and general technical information.",
                    "Pages, features, and services you interact with.",
                    "Date and time of your interactions with the Platform.",
                    "Diagnostic, performance, and usage information.",
                  ]}
                />
              </section>

              {/* =================================================
                  2. HOW WE USE
              ================================================== */}

              <section
                id="how-we-use-information"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="02"
                  title="How We Use Your Information"
                />

                <PolicyParagraph>
                  We may use the information we collect for purposes such as:
                </PolicyParagraph>

                <PolicyList
                  items={[
                    "Creating and maintaining your Dial a Tech account.",
                    "Providing, operating, and improving the Platform.",
                    "Connecting customers with service professionals.",
                    "Processing and managing service bookings.",
                    "Facilitating payments and related transactions.",
                    "Communicating with you about bookings, account activity, and support requests.",
                    "Personalizing and improving your experience.",
                    "Monitoring platform performance and preventing misuse.",
                    "Detecting, investigating, and addressing fraud, security issues, or violations of our terms.",
                    "Complying with applicable legal obligations.",
                  ]}
                />
              </section>

              {/* =================================================
                  3. INFORMATION SHARING
              ================================================== */}

              <section
                id="information-sharing"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="03"
                  title="Information Sharing"
                />

                <PolicyParagraph>
                  We do not sell your personal information as part of the
                  normal operation of Dial a Tech. We may share information in
                  limited circumstances necessary to operate the Platform,
                  provide services, or comply with legal obligations.
                </PolicyParagraph>

                <PolicySubheading>
                  Customers & Technicians
                </PolicySubheading>

                <PolicyParagraph>
                  When you use Dial a Tech to request or provide a service,
                  certain information may be visible to the other party when
                  necessary to facilitate the booking and completion of the
                  service.
                </PolicyParagraph>

                <PolicySubheading>
                  Service Providers
                </PolicySubheading>

                <PolicyParagraph>
                  We may work with trusted third-party providers that help us
                  operate the Platform, such as hosting providers, payment
                  processors, analytics providers, communication services, and
                  security providers.
                </PolicyParagraph>

                <PolicySubheading>
                  Legal & Safety Requirements
                </PolicySubheading>

                <PolicyParagraph>
                  We may disclose information when reasonably necessary to
                  comply with applicable law, respond to lawful requests,
                  protect our rights, investigate fraud, or protect the safety
                  of users and the public.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  4. COOKIES
              ================================================== */}

              <section
                id="cookies"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="04"
                  title="Cookies & Similar Technologies"
                />

                <PolicyParagraph>
                  Dial a Tech may use cookies and similar technologies to help
                  operate the Platform, remember preferences, understand how
                  users interact with our services, and improve functionality.
                </PolicyParagraph>

                <div
                  className="
                    mt-6
                    flex
                    gap-4
                    rounded-xl
                    border
                    bg-muted/30
                    p-5
                  "
                >
                  <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />

                  <p className="text-sm leading-6 text-muted-foreground">
                    Depending on your browser and applicable law, you may be
                    able to control or restrict cookies through your browser
                    settings. Disabling certain cookies may affect some
                    Platform functionality.
                  </p>
                </div>
              </section>

              {/* =================================================
                  5. DATA SECURITY
              ================================================== */}

              <section
                id="data-security"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="05"
                  title="Data Security"
                />

                <PolicyParagraph>
                  We take reasonable technical and organizational measures
                  designed to protect information against unauthorized access,
                  loss, misuse, alteration, or disclosure.
                </PolicyParagraph>

                <PolicyParagraph>
                  However, no method of transmission over the internet or
                  method of electronic storage can be guaranteed to be
                  completely secure. Therefore, we cannot guarantee absolute
                  security of your information.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  6. DATA RETENTION
              ================================================== */}

              <section
                id="data-retention"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="06"
                  title="Data Retention"
                />

                <PolicyParagraph>
                  We retain information for as long as reasonably necessary
                  to provide our services, maintain business and transaction
                  records, resolve disputes, enforce agreements, comply with
                  legal obligations, and protect our legitimate interests.
                </PolicyParagraph>

                <PolicyParagraph>
                  The length of time we retain information may vary depending
                  on the type of information and the purpose for which it was
                  collected.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  7. YOUR RIGHTS
              ================================================== */}

              <section
                id="your-rights"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="07"
                  title="Your Rights & Choices"
                />

                <PolicyParagraph>
                  Depending on your location and applicable law, you may have
                  certain rights regarding your personal information.
                </PolicyParagraph>

                <PolicyList
                  items={[
                    "Request access to certain personal information we hold about you.",
                    "Request correction of inaccurate or incomplete information.",
                    "Request deletion of certain information, subject to applicable legal requirements.",
                    "Choose whether to receive certain promotional communications.",
                    "Withdraw consent where processing is based on consent.",
                    "Object to or request restriction of certain processing where applicable.",
                  ]}
                />

                <PolicyParagraph>
                  To make a privacy-related request, contact us using the
                  information provided in the Contact Us section.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  8. THIRD PARTY
              ================================================== */}

              <section
                id="third-party-services"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="08"
                  title="Third-Party Services"
                />

                <PolicyParagraph>
                  Dial a Tech may integrate with or rely on third-party services
                  to provide certain functionality. These services may process
                  information according to their own privacy policies and terms.
                </PolicyParagraph>

                <PolicyParagraph>
                  We encourage you to review the privacy policies of
                  third-party services before providing information directly
                  to them.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  9. CHILDREN
              ================================================== */}

              <section
                id="children-privacy"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="09"
                  title="Children's Privacy"
                />

                <PolicyParagraph>
                  Dial a Tech is not intended for children who are not legally
                  permitted to use the Platform under applicable law.
                </PolicyParagraph>

                <PolicyParagraph>
                  We do not knowingly collect personal information from
                  children in violation of applicable legal requirements. If
                  you believe a child has provided personal information to us,
                  please contact us so that we can review and take appropriate
                  action.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  10. POLICY CHANGES
              ================================================== */}

              <section
                id="policy-changes"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="10"
                  title="Changes to This Policy"
                />

                <PolicyParagraph>
                  We may update this Privacy Policy from time to time to
                  reflect changes to our services, practices, technologies, or
                  legal requirements.
                </PolicyParagraph>

                <PolicyParagraph>
                  When we make changes, we may update the effective date at
                  the beginning of this policy. Your continued use of the
                  Platform after an updated policy becomes effective means that
                  you acknowledge the revised policy to the extent permitted
                  by applicable law.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  11. CONTACT
              ================================================== */}

              <section
                id="contact"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="11"
                  title="Contact Us"
                />

                <PolicyParagraph>
                  If you have questions about this Privacy Policy, your
                  personal information, or our privacy practices, please
                  contact Dial a Tech.
                </PolicyParagraph>

                <Card className="mt-6 overflow-hidden border-orange-500/20">
                  <CardContent className="p-6 sm:p-7">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex gap-4">
                        <div
                          className="
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-orange-500/10
                          "
                        >
                          <Mail className="h-5 w-5 text-orange-500" />
                        </div>

                        <div>
                          <p className="font-semibold">
                            Privacy Questions?
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Email us at{" "}
                            <span className="font-medium text-foreground">
                              [support email]
                            </span>
                          </p>
                        </div>
                      </div>

                      <Button
                        asChild
                        className="
                          bg-[#ff7308]
                          text-white
                          hover:bg-[#e96500]
                        "
                      >
                        <Link href="/tech/contact">
                          Contact Us
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* =================================================
                  DISCLAIMER
              ================================================== */}

              <div
                className="
                  mt-14
                  rounded-xl
                  border
                  border-dashed
                  bg-muted/30
                  p-5
                "
              >
                <p className="text-xs leading-6 text-muted-foreground">
                  <strong className="text-foreground">
                    Important:
                  </strong>{" "}
                  This Privacy Policy is a general product template and is
                  not legal advice. Replace the placeholders with your actual
                  business information and have the policy reviewed by a
                  qualified legal professional to ensure it meets the
                  requirements applicable to Dial a Tech and the locations in
                  which you operate.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}

      <section className="border-t bg-muted/30">
        <div
          className="
            container
            mx-auto
            max-w-4xl
            px-4
            py-16
            text-center
            sm:px-6
            sm:py-20
            lg:px-8
          "
        >
          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-orange-500/10
            "
          >
            <ShieldCheck className="h-7 w-7 text-orange-500" />
          </div>

          <h2 className="mt-6 text-2xl font-bold sm:text-3xl">
            Have questions about your privacy?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            We're here to help. Reach out to our support team if you have
            questions about how Dial a Tech handles your information.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="
                bg-[#ff7308]
                text-white
                hover:bg-[#e96500]
              "
            >
              <Link href="/tech/contact">
                Contact Support
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
            >
              <Link href="/tech/help">
                Visit Help Center
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   REUSABLE CONTENT COMPONENTS
========================================================= */

function SectionHeading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        className="
          mt-1
          flex
          h-8
          min-w-8
          items-center
          justify-center
          rounded-lg
          bg-orange-500/10
          px-2
          text-xs
          font-bold
          text-orange-500
        "
      >
        {number}
      </span>

      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function PolicySubheading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h3 className="mt-8 text-lg font-semibold">
      {children}
    </h3>
  );
}

function PolicyParagraph({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mt-5 leading-7 text-muted-foreground">
      {children}
    </p>
  );
}

function PolicyList({
  items,
}: {
  items: string[];
}) {
  return (
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
        >
          <span
            className="
              mt-2
              h-1.5
              w-1.5
              shrink-0
              rounded-full
              bg-orange-500
            "
          />

          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

