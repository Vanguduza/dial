
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Headphones,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/* =========================================================
   TYPES
========================================================= */

type FAQ = {
  question: string;
  answer: string;
  category: string;
};

/* =========================================================
   DATA
========================================================= */

const categories = [
  {
    id: "booking",
    title: "Booking",
    description: "Learn how to find and book services.",
    icon: CalendarCheck,
  },
  {
    id: "account",
    title: "Account",
    description: "Manage your profile and account.",
    icon: UserRound,
  },
  {
    id: "payment",
    title: "Payments",
    description: "Questions about payments and pricing.",
    icon: CreditCard,
  },
  {
    id: "technician",
    title: "Technicians",
    description: "Information for service professionals.",
    icon: Wrench,
  },
];

const faqs: FAQ[] = [
  {
    question: "How do I book a service?",
    answer:
      "Browse the available services, choose the service you need, select a technician, review their profile and availability, then choose an available time slot to submit your booking.",
    category: "booking",
  },
  {
    question: "How do I find a technician?",
    answer:
      "Go to the Find Technicians page and browse available professionals. You can review their experience, ratings, services, and availability before making your choice.",
    category: "booking",
  },
  {
    question: "Can I choose a specific time slot?",
    answer:
      "Yes. When a technician provides available time slots, you can select a convenient slot during the booking process.",
    category: "booking",
  },
  {
    question: "Can I cancel a booking?",
    answer:
      "Bookings can be cancelled according to their current status and the platform's cancellation rules. Open your booking details to check whether cancellation is available.",
    category: "booking",
  },
  {
    question: "How can I update my profile?",
    answer:
      "Open your account dashboard and navigate to your profile settings. From there you can update the information available to your account.",
    category: "account",
  },
  {
    question: "What if I forget my password?",
    answer:
      "Use the password recovery option on the login page and follow the instructions provided to regain access to your account.",
    category: "account",
  },
  {
    question: "How does payment work?",
    answer:
      "After your booking reaches the appropriate stage, you can continue through the available payment option. Follow the instructions shown during checkout.",
    category: "payment",
  },
  {
    question: "Can I see my booking history?",
    answer:
      "Yes. Your dashboard provides access to your bookings so you can review their current status and details.",
    category: "booking",
  },
  {
    question: "How can I become a technician?",
    answer:
      "Create an account and register as a technician. You can then build your professional profile, provide your service information, manage availability, and receive booking requests.",
    category: "technician",
  },
  {
    question: "How do technicians manage availability?",
    answer:
      "Technicians can manage their available time slots from their dashboard so customers can see when they are available for bookings.",
    category: "technician",
  },
  {
    question: "Can technicians manage their bookings?",
    answer:
      "Yes. Technicians can review and manage booking requests through their dashboard.",
    category: "technician",
  },
  {
    question: "What should I do if I have another problem?",
    answer:
      "If you cannot find the answer in this Help Center, contact the Dial a Tech support team using the support options below.",
    category: "general",
  },
];

/* =========================================================
   ANIMATION
========================================================= */

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

/* =========================================================
   FAQ ITEM
========================================================= */

function FAQItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FAQ;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      layout
      className="
        overflow-hidden
        rounded-xl
        border
        border-border/70
        bg-card
        transition-colors
        hover:border-orange-500/30
      "
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="
          flex
          w-full
          items-center
          justify-between
          gap-4
          px-5
          py-5
          text-left
          outline-none
          transition-colors
          hover:bg-muted/40
          focus-visible:ring-2
          focus-visible:ring-orange-500
          focus-visible:ring-inset
          sm:px-6
        "
      >
        <span className="text-sm font-semibold sm:text-base">
          {faq.question}
        </span>

        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  rotate: isOpen ? 180 : 0,
                }
          }
          transition={{
            duration: 0.25,
          }}
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-orange-500/10
          "
        >
          <ChevronDown className="h-4 w-4 text-orange-500" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={
          isOpen
            ? {
                height: "auto",
                opacity: 1,
              }
            : {
                height: 0,
                opacity: 0,
              }
        }
        transition={{
          duration: shouldReduceMotion ? 0 : 0.3,
          ease: "easeInOut",
        }}
        className="overflow-hidden"
      >
        <div className="border-t px-5 pb-5 pt-4 sm:px-6">
          <p className="text-sm leading-7 text-muted-foreground">
            {faq.answer}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   HELP PAGE
========================================================= */

export default function HelpPage() {
  const shouldReduceMotion = useReducedMotion();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("all");
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  /* =======================================================
     FILTER FAQS
  ======================================================= */

  const filteredFAQs = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return faqs.filter((faq) => {
      const matchesCategory =
        selectedCategory === "all" ||
        faq.category === selectedCategory;

      const matchesSearch =
        !normalizedSearch ||
        faq.question
          .toLowerCase()
          .includes(normalizedSearch) ||
        faq.answer
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      {/* =====================================================
          HERO / SEARCH
      ====================================================== */}

      <section className="relative overflow-hidden">
        {/* Animated background */}

        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    x: [0, 40, 0],
                    y: [0, 25, 0],
                    scale: [1, 1.12, 1],
                  }
            }
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
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

          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    x: [0, -50, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.15, 1],
                  }
            }
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
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
              bg-[linear-gradient(to_right,hsl(var(--border)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.2)_1px,transparent_1px)]
              bg-[size:32px_32px]
              [mask-image:linear-gradient(to_bottom,black,transparent)]
            "
          />
        </div>

        <div
          className="
            container
            relative
            mx-auto
            max-w-5xl
            px-4
            py-20
            text-center
            sm:px-6
            sm:py-24
            lg:px-8
            lg:py-28
          "
        >
          {/* Badge */}

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{
              duration: shouldReduceMotion ? 0 : 0.6,
            }}
          >
            <Badge
              variant="outline"
              className="
                mb-6
                border-orange-500/30
                bg-orange-500/10
                px-4
                py-2
                text-orange-600
                dark:text-orange-400
              "
            >
              <CircleHelp className="mr-2 h-4 w-4" />
              Dial a Tech Help Center
            </Badge>
          </motion.div>

          {/* Heading */}

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{
              duration: shouldReduceMotion ? 0 : 0.7,
              delay: shouldReduceMotion ? 0 : 0.1,
            }}
            className="
              text-4xl
              font-bold
              tracking-tight
              sm:text-5xl
              md:text-6xl
            "
          >
            How can we
            <span className="text-[#ff7308]"> help you?</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{
              duration: shouldReduceMotion ? 0 : 0.7,
              delay: shouldReduceMotion ? 0 : 0.2,
            }}
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
            Find answers about bookings, payments, accounts, technicians,
            and everything else you need to get the most from Dial a Tech.
          </motion.p>

          {/* Search */}

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{
              duration: shouldReduceMotion ? 0 : 0.7,
              delay: shouldReduceMotion ? 0 : 0.3,
            }}
            className="mx-auto mt-8 max-w-2xl"
          >
            <div className="relative">
              <Search
                className="
                  absolute
                  left-4
                  top-1/2
                  h-5
                  w-5
                  -translate-y-1/2
                  text-muted-foreground
                "
              />

              <Input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search for answers..."
                className="
                  h-14
                  rounded-2xl
                  border-border
                  bg-background
                  pl-12
                  pr-4
                  text-base
                  shadow-lg
                  shadow-orange-500/5
                  focus-visible:border-orange-500
                  focus-visible:ring-orange-500/20
                "
              />
            </div>

            {searchTerm && (
              <p className="mt-3 text-sm text-muted-foreground">
                {filteredFAQs.length}{" "}
                {filteredFAQs.length === 1
                  ? "result"
                  : "results"}{" "}
                found
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* =====================================================
          HELP CATEGORIES
      ====================================================== */}

      <section className="border-y bg-muted/30">
        <div
          className="
            container
            mx-auto
            max-w-7xl
            px-4
            py-12
            sm:px-6
            lg:px-8
          "
        >
          <div
            className="
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            {/* All */}

            <motion.button
              type="button"
              onClick={() => setSelectedCategory("all")}
              whileHover={
                shouldReduceMotion
                  ? {}
                  : {
                      y: -4,
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? {}
                  : {
                      scale: 0.98,
                    }
              }
              className={`
                rounded-2xl
                border
                p-5
                text-left
                transition-all
                ${
                  selectedCategory === "all"
                    ? "border-orange-500/40 bg-orange-500/5 shadow-md"
                    : "border-border/70 bg-background hover:border-orange-500/30"
                }
              `}
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-orange-500/10
                "
              >
                <CircleHelp className="h-5 w-5 text-orange-500" />
              </div>

              <p className="mt-4 font-semibold">
                All Help
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Browse all common questions.
              </p>
            </motion.button>

            {categories.map((category) => {
              const Icon = category.icon;
              const isActive =
                selectedCategory === category.id;

              return (
                <motion.button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(category.id)
                  }
                  whileHover={
                    shouldReduceMotion
                      ? {}
                      : {
                          y: -4,
                        }
                  }
                  whileTap={
                    shouldReduceMotion
                      ? {}
                      : {
                          scale: 0.98,
                        }
                  }
                  className={`
                    rounded-2xl
                    border
                    p-5
                    text-left
                    transition-all
                    ${
                      isActive
                        ? "border-orange-500/40 bg-orange-500/5 shadow-md"
                        : "border-border/70 bg-background hover:border-orange-500/30"
                    }
                  `}
                >
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-orange-500/10
                    "
                  >
                    <Icon className="h-5 w-5 text-orange-500" />
                  </div>

                  <p className="mt-4 font-semibold">
                    {category.title}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          FAQ SECTION
      ====================================================== */}

      <section>
        <div
          className="
            container
            mx-auto
            max-w-4xl
            px-4
            py-20
            sm:px-6
            sm:py-24
            lg:px-8
            lg:py-28
          "
        >
          <div className="text-center">
            <Badge
              variant="outline"
              className="
                mb-5
                border-orange-500/30
                bg-orange-500/10
                text-orange-600
                dark:text-orange-400
              "
            >
              Frequently Asked Questions
            </Badge>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Answers to common questions
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Browse the most common questions from Dial a Tech customers
              and technicians.
            </p>
          </div>

          <div className="mt-12 space-y-3">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => {
                const originalIndex = faqs.indexOf(faq);

                return (
                  <FAQItem
                    key={faq.question}
                    faq={faq}
                    isOpen={openFAQ === originalIndex}
                    onToggle={() =>
                      setOpenFAQ(
                        openFAQ === originalIndex
                          ? null
                          : originalIndex
                      )
                    }
                  />
                );
              })
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <div
                    className="
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-full
                      bg-orange-500/10
                    "
                  >
                    <Search className="h-6 w-6 text-orange-500" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    No answers found
                  </h3>

                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    We couldn't find a matching answer. Try a different
                    search or contact our support team.
                  </p>

                  <Button
                    asChild
                    className="
                      mt-6
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          QUICK HELP CARDS
      ====================================================== */}

      <section className="bg-muted/30">
        <div
          className="
            container
            mx-auto
            max-w-7xl
            px-4
            py-20
            sm:px-6
            sm:py-24
            lg:px-8
            lg:py-28
          "
        >
          <div className="mx-auto max-w-2xl text-center">
            <Badge
              variant="outline"
              className="
                mb-5
                border-orange-500/30
                bg-orange-500/10
                text-orange-600
                dark:text-orange-400
              "
            >
              Quick Help
            </Badge>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Need help with something specific?
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Booking */}

            <motion.div
              whileHover={
                shouldReduceMotion
                  ? {}
                  : {
                      y: -6,
                    }
              }
              transition={{
                duration: 0.25,
              }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-xl
                      bg-orange-500/10
                    "
                  >
                    <CalendarCheck className="h-6 w-6 text-orange-500" />
                  </div>

                  <CardTitle className="pt-2">
                    Booking Help
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Need help finding a service, choosing a technician,
                    or managing your booking?
                  </p>

                  <Button
                    variant="link"
                    asChild
                    className="mt-3 px-0 text-orange-500"
                  >
                    <Link href="/tech/services">
                      Browse Services
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Technician */}

            <motion.div
              whileHover={
                shouldReduceMotion
                  ? {}
                  : {
                      y: -6,
                    }
              }
              transition={{
                duration: 0.25,
              }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-xl
                      bg-orange-500/10
                    "
                  >
                    <Wrench className="h-6 w-6 text-orange-500" />
                  </div>

                  <CardTitle className="pt-2">
                    Technician Help
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Learn how to create your profile, manage availability,
                    and handle customer bookings.
                  </p>

                  <Button
                    variant="link"
                    asChild
                    className="mt-3 px-0 text-orange-500"
                  >
                    <Link href="/?next=/tech">
                      Join as Technician
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Account */}

            <motion.div
              whileHover={
                shouldReduceMotion
                  ? {}
                  : {
                      y: -6,
                    }
              }
              transition={{
                duration: 0.25,
              }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-xl
                      bg-orange-500/10
                    "
                  >
                    <ShieldCheck className="h-6 w-6 text-orange-500" />
                  </div>

                  <CardTitle className="pt-2">
                    Account & Security
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Get help with your account, profile, login, and
                    general security questions.
                  </p>

                  <Button
                    variant="link"
                    asChild
                    className="mt-3 px-0 text-orange-500"
                  >
                    <Link href="/tech/contact">
                      Get Support
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTACT SUPPORT CTA
      ====================================================== */}

      <section className="relative overflow-hidden">
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-br
            from-orange-500/10
            via-transparent
            to-orange-500/5
          "
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.1, 1],
                  opacity: [0.15, 0.3, 0.15],
                }
          }
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            h-80
            w-80
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-orange-500/10
            blur-3xl
          "
        />

        <div
          className="
            container
            relative
            mx-auto
            max-w-5xl
            px-4
            py-20
            text-center
            sm:px-6
            sm:py-24
            lg:px-8
            lg:py-28
          "
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.7,
            }}
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
              <Headphones className="h-7 w-7 text-orange-500" />
            </div>

            <h2
              className="
                mt-6
                text-3xl
                font-bold
                tracking-tight
                sm:text-4xl
              "
            >
              Still need help?
            </h2>

            <p
              className="
                mx-auto
                mt-4
                max-w-xl
                leading-7
                text-muted-foreground
              "
            >
              Can't find what you're looking for? Our support team is
              here to help you get back on track.
            </p>

            <div
              className="
                mt-8
                flex
                flex-col
                justify-center
                gap-3
                sm:flex-row
              "
            >
              <Button
                asChild
                size="lg"
                className="
                  h-12
                  bg-[#ff7308]
                  px-7
                  text-white
                  shadow-lg
                  shadow-orange-500/20
                  hover:bg-[#e96500]
                "
              >
                <Link href="/tech/contact">
                  Contact Support
                  <MessageCircle className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-7"
              >
                <Link href="/tech/how-it-works">
                  How It Works
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

