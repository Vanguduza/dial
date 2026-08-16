

import Link from "next/link";
import {
  ArrowRight,
  Ban,
  CalendarCheck,
  ChevronRight,
  FileCheck,
  Gavel,
  Mail,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

/* =========================================================
   TABLE OF CONTENTS
========================================================= */

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
  },
  {
    id: "about-platform",
    title: "About Dial a Tech",
  },
  {
    id: "eligibility",
    title: "Eligibility",
  },
  {
    id: "accounts",
    title: "User Accounts",
  },
  {
    id: "customers",
    title: "Customer Responsibilities",
  },
  {
    id: "technicians",
    title: "Technician Responsibilities",
  },
  {
    id: "services",
    title: "Services & Bookings",
  },
  {
    id: "payments",
    title: "Payments & Fees",
  },
  {
    id: "cancellations",
    title: "Cancellations & Refunds",
  },
  {
    id: "reviews",
    title: "Reviews & Ratings",
  },
  {
    id: "prohibited",
    title: "Prohibited Activities",
  },
  {
    id: "platform-role",
    title: "Our Role",
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
  },
  {
    id: "liability",
    title: "Limitation of Liability",
  },
  {
    id: "termination",
    title: "Account Termination",
  },
  {
    id: "changes",
    title: "Changes to These Terms",
  },
  {
    id: "contact",
    title: "Contact Us",
  },
];

/* =========================================================
   HIGHLIGHTS
========================================================= */

const highlights = [
  {
    icon: Users,
    title: "Two-Sided Marketplace",
    description:
      "Dial a Tech connects customers with independent service professionals.",
  },
  {
    icon: ShieldCheck,
    title: "Use Responsibly",
    description:
      "Users are responsible for the information, bookings, and interactions they make.",
  },
  {
    icon: FileCheck,
    title: "Clear Expectations",
    description:
      "These terms explain the rules that apply when using the Dial a Tech platform.",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function TermsPage() {
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

        {/* Grid */}

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
              <Gavel className="mr-2 h-4 w-4" />
              Legal & Terms
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
              Terms &
              <span className="text-[#ff7308]">
                {" "}
                Conditions
              </span>
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
              These Terms & Conditions explain the rules and responsibilities
              that apply when you use Dial a Tech to discover, book, provide, or
              manage home services.
            </p>

            <p className="mt-5 text-sm text-muted-foreground">
              Effective Date:{" "}
              <strong className="text-foreground">
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
            {highlights.map((item) => {
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
                CONTENT
            ================================================== */}

            <article className="min-w-0 max-w-4xl">
              {/* INTRODUCTION */}

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
                    <FileCheck className="h-5 w-5 text-orange-500" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">
                      Please Read These Terms Carefully
                    </h2>

                    <p className="mt-3 leading-7 text-muted-foreground">
                      These Terms & Conditions ("Terms") form an agreement
                      between you and [Company Name] ("Dial a Tech", "we", "us",
                      or "our") regarding your use of the Dial a Tech website,
                      application, marketplace, and related services.
                    </p>

                    <p className="mt-4 leading-7 text-muted-foreground">
                      By creating an account, accessing the Platform, or using
                      any Dial a Tech service, you agree to be bound by these
                      Terms and any applicable policies referenced in them.
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  01 ACCEPTANCE
              ================================================== */}

              <section
                id="acceptance"
                className="mt-12 scroll-mt-24"
              >
                <SectionHeading
                  number="01"
                  title="Acceptance of Terms"
                />

                <PolicyParagraph>
                  By accessing or using Dial a Tech, you confirm that you have
                  read, understood, and agree to these Terms.
                </PolicyParagraph>

                <PolicyParagraph>
                  If you do not agree with these Terms, you must not access or
                  use the Platform.
                </PolicyParagraph>

                <PolicyParagraph>
                  Additional terms may apply to specific services, features,
                  promotions, payment methods, or other parts of the Platform.
                  Where applicable, those terms are incorporated into these
                  Terms.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  02 ABOUT PLATFORM
              ================================================== */}

              <section
                id="about-platform"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="02"
                  title="About Dial a Tech"
                />

                <PolicyParagraph>
                  Dial a Tech is a home-services marketplace designed to connect
                  customers with service professionals.
                </PolicyParagraph>

                <PolicyParagraph>
                  Customers may use Dial a Tech to discover services, review
                  technician profiles, select available time slots, submit
                  bookings, communicate relevant information, and manage their
                  service requests.
                </PolicyParagraph>

                <PolicyParagraph>
                  Technicians may use Dial a Tech to create professional profiles,
                  list services, manage availability, receive booking
                  requests, and interact with customers.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  03 ELIGIBILITY
              ================================================== */}

              <section
                id="eligibility"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="03"
                  title="Eligibility"
                />

                <PolicyParagraph>
                  You may use Dial a Tech only if you are legally permitted to
                  enter into these Terms and use the Platform under applicable
                  law.
                </PolicyParagraph>

                <PolicyParagraph>
                  If you use Dial a Tech on behalf of a business or organization,
                  you represent that you have authority to bind that entity to
                  these Terms.
                </PolicyParagraph>

                <PolicyParagraph>
                  You are responsible for ensuring that your use of the
                  Platform complies with all laws, regulations, and professional
                  requirements applicable to you.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  04 ACCOUNTS
              ================================================== */}

              <section
                id="accounts"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="04"
                  title="User Accounts"
                />

                <PolicyParagraph>
                  Some Dial a Tech features require you to create an account. You
                  agree to provide accurate, current, and complete information
                  when creating and maintaining your account.
                </PolicyParagraph>

                <PolicyList
                  items={[
                    "Keep your login credentials confidential.",
                    "Do not allow unauthorized people to use your account.",
                    "Update your account information when it changes.",
                    "Notify us if you believe your account has been compromised.",
                    "Do not create an account using false or misleading information.",
                  ]}
                />

                <PolicyParagraph>
                  You are responsible for activity that occurs through your
                  account unless applicable law provides otherwise.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  05 CUSTOMERS
              ================================================== */}

              <section
                id="customers"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="05"
                  title="Customer Responsibilities"
                />

                <PolicyParagraph>
                  Customers are responsible for providing accurate information
                  when requesting and booking services.
                </PolicyParagraph>

                <PolicyList
                  items={[
                    "Provide accurate service requirements and relevant booking information.",
                    "Provide a safe and reasonable environment for the requested service.",
                    "Be available or provide appropriate access for scheduled services.",
                    "Treat technicians respectfully and professionally.",
                    "Pay applicable amounts associated with confirmed services.",
                    "Do not request technicians to perform unlawful or unsafe work.",
                    "Communicate changes or problems relating to a booking promptly.",
                  ]}
                />
              </section>

              {/* =================================================
                  06 TECHNICIANS
              ================================================== */}

              <section
                id="technicians"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="06"
                  title="Technician Responsibilities"
                />

                <PolicyParagraph>
                  Technicians are responsible for the accuracy of the
                  information they provide about their professional
                  qualifications, services, experience, pricing, availability,
                  and capabilities.
                </PolicyParagraph>

                <PolicyList
                  items={[
                    "Provide accurate and truthful professional information.",
                    "Maintain appropriate qualifications, licenses, certifications, or permits where required.",
                    "Provide services professionally and with reasonable care.",
                    "Maintain accurate availability information.",
                    "Respond to booking requests appropriately.",
                    "Communicate honestly with customers.",
                    "Comply with applicable laws, regulations, and professional standards.",
                    "Avoid accepting work that they are not qualified or legally permitted to perform.",
                  ]}
                />

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
                  <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />

                  <p className="text-sm leading-6 text-muted-foreground">
                    Technicians are responsible for the services they provide
                    and for maintaining any professional requirements that
                    apply to their work.
                  </p>
                </div>
              </section>

              {/* =================================================
                  07 SERVICES & BOOKINGS
              ================================================== */}

              <section
                id="services"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="07"
                  title="Services & Bookings"
                />

                <PolicyParagraph>
                  Dial a Tech allows customers to request and book services from
                  available technicians. A booking may be subject to
                  confirmation, availability, payment requirements, or other
                  conditions shown during the booking process.
                </PolicyParagraph>

                <PolicySubheading>
                  Booking Information
                </PolicySubheading>

                <PolicyParagraph>
                  Customers are responsible for reviewing the service,
                  technician information, selected time slot, pricing, and
                  other relevant details before submitting a booking.
                </PolicyParagraph>

                <PolicySubheading>
                  Availability
                </PolicySubheading>

                <PolicyParagraph>
                  Displayed availability may change. A time slot does not
                  necessarily guarantee that a service will ultimately be
                  completed if circumstances outside the Platform's control
                  prevent the service.
                </PolicyParagraph>

                <PolicySubheading>
                  Service Quality
                </PolicySubheading>

                <PolicyParagraph>
                  Technicians are responsible for the quality, legality, safety,
                  and completion of the services they provide. Customers should
                  communicate directly with the technician about reasonable
                  service requirements.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  08 PAYMENTS
              ================================================== */}

              <section
                id="payments"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="08"
                  title="Payments & Fees"
                />

                <PolicyParagraph>
                  Certain Dial a Tech services may require payment through the
                  payment methods made available on the Platform.
                </PolicyParagraph>

                <PolicyList
                  items={[
                    "You agree to provide accurate payment information.",
                    "You authorize applicable payment providers to process transactions associated with your bookings.",
                    "You are responsible for amounts shown or agreed upon during the booking process.",
                    "Additional fees, taxes, or charges may apply where disclosed.",
                    "Payment processing may be handled by third-party payment providers.",
                  ]}
                />

                <PolicyParagraph>
                  Dial a Tech may change applicable fees or payment methods from
                  time to time. Any applicable amount should be reviewed before
                  completing a transaction.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  09 CANCELLATIONS
              ================================================== */}

              <section
                id="cancellations"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="09"
                  title="Cancellations & Refunds"
                />

                <PolicyParagraph>
                  Booking cancellation and refund availability may depend on
                  the booking status, timing of the cancellation, payment
                  status, applicable policies, and circumstances surrounding
                  the booking.
                </PolicyParagraph>

                <PolicySubheading>
                  Customer Cancellations
                </PolicySubheading>

                <PolicyParagraph>
                  Customers should cancel bookings as soon as possible when
                  they can no longer proceed. Certain bookings may not be
                  cancellable after a particular stage.
                </PolicyParagraph>

                <PolicySubheading>
                  Technician Cancellations
                </PolicySubheading>

                <PolicyParagraph>
                  Technicians should avoid cancelling confirmed bookings except
                  where reasonably necessary. Repeated or inappropriate
                  cancellations may result in account restrictions.
                </PolicyParagraph>

                <PolicySubheading>
                  Refunds
                </PolicySubheading>

                <PolicyParagraph>
                  Where a refund is applicable, the amount and timing may
                  depend on the applicable refund policy and the payment
                  provider's processing procedures.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  10 REVIEWS
              ================================================== */}

              <section
                id="reviews"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="10"
                  title="Reviews & Ratings"
                />

                <PolicyParagraph>
                  Dial a Tech may allow users to submit ratings, reviews, comments,
                  or feedback about services and experiences.
                </PolicyParagraph>

                <PolicyList
                  items={[
                    "Reviews should be honest and based on genuine experiences.",
                    "Do not post false, misleading, defamatory, abusive, or discriminatory content.",
                    "Do not use reviews to threaten, harass, or extort another user.",
                    "Do not submit reviews in exchange for improper incentives.",
                    "Do not post another person's private or sensitive information.",
                  ]}
                />

                <PolicyParagraph>
                  Dial a Tech may remove or restrict content that violates these
                  Terms or applicable policies.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  11 PROHIBITED
              ================================================== */}

              <section
                id="prohibited"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="11"
                  title="Prohibited Activities"
                />

                <PolicyParagraph>
                  You agree not to misuse the Platform or use it for unlawful,
                  fraudulent, abusive, or harmful purposes.
                </PolicyParagraph>

                <PolicyList
                  items={[
                    "Use Dial a Tech for unlawful activities.",
                    "Provide false, misleading, or fraudulent information.",
                    "Impersonate another person or business.",
                    "Attempt to access another user's account.",
                    "Interfere with the security or operation of the Platform.",
                    "Introduce malicious code, viruses, or harmful software.",
                    "Scrape, copy, or systematically collect Platform data without permission.",
                    "Harass, threaten, abuse, or discriminate against other users.",
                    "Manipulate ratings, reviews, bookings, or other Platform activity.",
                    "Circumvent Platform security or access restrictions.",
                    "Use Dial a Tech to facilitate prohibited or unsafe services.",
                  ]}
                />

                <div
                  className="
                    mt-6
                    flex
                    gap-4
                    rounded-xl
                    border
                    border-red-500/20
                    bg-red-500/5
                    p-5
                  "
                >
                  <Ban className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                  <p className="text-sm leading-6 text-muted-foreground">
                    Violations may result in warnings, removal of content,
                    suspension, restriction, or termination of an account,
                    depending on the circumstances.
                  </p>
                </div>
              </section>

              {/* =================================================
                  12 PLATFORM ROLE
              ================================================== */}

              <section
                id="platform-role"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="12"
                  title="Our Role"
                />

                <PolicyParagraph>
                  Dial a Tech operates as a marketplace platform that helps
                  customers and technicians connect.
                </PolicyParagraph>

                <PolicyParagraph>
                  Unless explicitly stated otherwise, Dial a Tech is not the
                  employer, contractor, agent, or representative of technicians
                  using the Platform.
                </PolicyParagraph>

                <PolicyParagraph>
                  Technicians generally operate independently and are
                  responsible for their own services, qualifications, taxes,
                  licenses, insurance, equipment, and legal obligations.
                </PolicyParagraph>

                <PolicyParagraph>
                  Dial a Tech does not necessarily directly provide the home
                  services listed by independent technicians.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  13 INTELLECTUAL PROPERTY
              ================================================== */}

              <section
                id="intellectual-property"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="13"
                  title="Intellectual Property"
                />

                <PolicyParagraph>
                  The Dial a Tech Platform, including its software, design,
                  branding, logos, text, graphics, interfaces, and other
                  materials, may be protected by intellectual property laws.
                </PolicyParagraph>

                <PolicyParagraph>
                  Except as permitted by applicable law or with our permission,
                  you may not copy, modify, distribute, sell, reproduce,
                  reverse engineer, or create derivative works from protected
                  Platform materials.
                </PolicyParagraph>

                <PolicySubheading>
                  User Content
                </PolicySubheading>

                <PolicyParagraph>
                  You retain ownership of content you submit where applicable.
                  By submitting content to Dial a Tech, you grant us the rights
                  reasonably necessary to host, display, process, and operate
                  the Platform using that content.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  14 DISCLAIMERS
              ================================================== */}

              <section
                id="disclaimers"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="14"
                  title="Disclaimers"
                />

                <PolicyParagraph>
                  To the maximum extent permitted by applicable law, Dial a Tech
                  provides the Platform on an "as available" basis and does not
                  guarantee that the Platform will always be uninterrupted,
                  error-free, secure, or available.
                </PolicyParagraph>

                <PolicyParagraph>
                  We do not guarantee the accuracy, completeness, reliability,
                  qualifications, availability, or suitability of every
                  technician or service listed on the Platform.
                </PolicyParagraph>

                <PolicyParagraph>
                  Users are responsible for exercising appropriate judgment when
                  selecting and working with service professionals.
                </PolicyParagraph>

                <PolicyParagraph>
                  Nothing in these Terms excludes rights or protections that
                  cannot legally be excluded under applicable law.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  15 LIABILITY
              ================================================== */}

              <section
                id="liability"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="15"
                  title="Limitation of Liability"
                />

                <PolicyParagraph>
                  To the maximum extent permitted by applicable law, Dial a Tech
                  and its affiliates, officers, employees, agents, and service
                  providers will not be responsible for indirect, incidental,
                  special, consequential, exemplary, or punitive damages
                  arising from or related to your use of the Platform.
                </PolicyParagraph>

                <PolicyParagraph>
                  This may include losses associated with service quality,
                  missed appointments, property damage, personal injury,
                  business interruption, lost profits, or interactions between
                  users, except to the extent liability cannot legally be
                  limited or excluded.
                </PolicyParagraph>

                <PolicyParagraph>
                  Nothing in these Terms is intended to limit liability that
                  cannot be limited under applicable law.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  16 TERMINATION
              ================================================== */}

              <section
                id="termination"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="16"
                  title="Account Termination"
                />

                <PolicyParagraph>
                  You may stop using Dial a Tech at any time and may request
                  account closure where such functionality is available.
                </PolicyParagraph>

                <PolicyParagraph>
                  We may suspend, restrict, or terminate access to the Platform
                  where we reasonably believe that a user has violated these
                  Terms, applicable law, or platform policies, or where action
                  is necessary to protect users, the Platform, or our business.
                </PolicyParagraph>

                <PolicyParagraph>
                  Certain provisions of these Terms may continue to apply after
                  termination where their nature requires continued effect,
                  including provisions concerning intellectual property,
                  disclaimers, liability, disputes, and other surviving
                  obligations.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  17 CHANGES
              ================================================== */}

              <section
                id="changes"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="17"
                  title="Changes to These Terms"
                />

                <PolicyParagraph>
                  We may update these Terms from time to time to reflect
                  changes to the Platform, our business, legal requirements,
                  or other circumstances.
                </PolicyParagraph>

                <PolicyParagraph>
                  When we make material changes, we may provide notice through
                  the Platform or other reasonable means. The updated Terms
                  will become effective on the date indicated in the revised
                  Terms.
                </PolicyParagraph>

                <PolicyParagraph>
                  Your continued use of Dial a Tech after updated Terms become
                  effective constitutes acceptance of the revised Terms to the
                  extent permitted by applicable law.
                </PolicyParagraph>
              </section>

              {/* =================================================
                  18 CONTACT
              ================================================== */}

              <section
                id="contact"
                className="mt-14 scroll-mt-24"
              >
                <SectionHeading
                  number="18"
                  title="Contact Us"
                />

                <PolicyParagraph>
                  If you have questions about these Terms, your account,
                  bookings, or the Dial a Tech Platform, please contact us.
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
                            Questions about these Terms?
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
                  LEGAL NOTICE
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
                  This Terms & Conditions page is a general product template
                  for Dial a Tech and is not legal advice. Replace placeholders
                  with your actual company information and have the final
                  Terms reviewed by a qualified legal professional for the
                  jurisdictions where Dial a Tech operates.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* =====================================================
          BOTTOM CTA
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
            Questions about our terms?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            If something in these Terms is unclear, our support team can help
            you understand how Dial a Tech works.
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
              <Link href="/tech/privacy-policy">
                Privacy Policy
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
          className="
            flex
            items-start
            gap-3
            text-sm
            leading-6
            text-muted-foreground
          "
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

