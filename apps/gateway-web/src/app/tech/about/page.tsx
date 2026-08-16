
"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/* =========================================================
   ANIMATION VARIANTS
========================================================= */

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 35,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const fadeLeft = {
  hidden: {
    opacity: 0,
    x: -40,
  },
  visible: {
    opacity: 1,
    x: 0,
  },
};

const fadeRight = {
  hidden: {
    opacity: 0,
    x: 40,
  },
  visible: {
    opacity: 1,
    x: 0,
  },
};

/* =========================================================
   DATA
========================================================= */

const stats = [
  {
    value: "500+",
    label: "Verified Professionals",
    icon: Users,
  },
  {
    value: "1,000+",
    label: "Services Completed",
    icon: CheckCircle2,
  },
  {
    value: "4.9/5",
    label: "Average Rating",
    icon: Star,
  },
  {
    value: "24/7",
    label: "Easy Booking",
    icon: Clock3,
  },
];

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Find a Service",
    description:
      "Browse the home services you need and find professionals available in your area.",
  },
  {
    number: "02",
    icon: Users,
    title: "Choose a Technician",
    description:
      "Compare profiles, ratings, experience, services, and availability before choosing.",
  },
  {
    number: "03",
    icon: CalendarCheck,
    title: "Schedule Your Service",
    description:
      "Select a convenient available time slot and send your booking request.",
  },
  {
    number: "04",
    icon: CheckCircle2,
    title: "Get It Done",
    description:
      "Your technician completes the job while you enjoy a simple and reliable experience.",
  },
];

const customerBenefits = [
  "Find qualified professionals in one place",
  "Compare technician ratings and experience",
  "Choose convenient available time slots",
  "Simple and secure booking experience",
];

const technicianBenefits = [
  "Create your professional profile",
  "Showcase your skills and experience",
  "Manage your availability",
  "Receive and manage customer bookings",
];

/* =========================================================
   ABOUT PAGE
========================================================= */

export default function AboutPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden">
        {/* Background */}

        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.15, 1],
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
                    x: [0, -40, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.2, 1],
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
            max-w-7xl
            px-4
            py-20
            sm:px-6
            sm:py-24
            lg:px-8
            lg:py-32
          "
        >
          <div className="mx-auto max-w-4xl text-center">
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
                <Sparkles className="mr-2 h-4 w-4" />
                About Dial a Tech
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
                leading-tight
                tracking-tight
                text-foreground
                sm:text-5xl
                md:text-6xl
                lg:text-7xl
              "
            >
              Making Home Services
              <span className="block text-[#ff7308]">
                Simple & Reliable.
              </span>
            </motion.h1>

            {/* Description */}

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
                mt-6
                max-w-2xl
                text-base
                leading-7
                text-muted-foreground
                sm:text-lg
                sm:leading-8
              "
            >
              Dial a Tech connects customers with skilled home-service
              professionals, making it easier to discover, compare, schedule,
              and book the help they need.
            </motion.p>

            {/* Buttons */}

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{
                duration: shouldReduceMotion ? 0 : 0.7,
                delay: shouldReduceMotion ? 0 : 0.3,
              }}
              className="
                mt-8
                flex
                flex-col
                items-center
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
                  w-full
                  bg-[#ff7308]
                  px-7
                  text-white
                  shadow-lg
                  shadow-orange-500/20
                  hover:bg-[#e96500]
                  sm:w-auto
                "
              >
                <Link href="/tech/services">
                  Explore Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full px-7 sm:w-auto"
              >
                <Link href="/tech/find-technicians">
                  Find Technicians
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATS
      ====================================================== */}

      <section className="border-y bg-muted/30">
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
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <motion.div
                  key={stat.label}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.5,
                    delay: shouldReduceMotion ? 0 : index * 0.1,
                  }}
                  className="text-center"
                >
                  <div
                    className="
                      mx-auto
                      mb-3
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-full
                      bg-orange-500/10
                    "
                  >
                    <Icon className="h-5 w-5 text-orange-500" />
                  </div>

                  <p className="text-2xl font-bold text-foreground sm:text-3xl">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    {stat.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          OUR MISSION
      ====================================================== */}

      <section className="relative">
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
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left */}

            <motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.7,
              }}
            >
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
                Our Mission
              </Badge>

              <h2
                className="
                  text-3xl
                  font-bold
                  tracking-tight
                  sm:text-4xl
                  lg:text-5xl
                "
              >
                Your home deserves
                <span className="text-[#ff7308]"> better service.</span>
              </h2>

              <p className="mt-6 leading-7 text-muted-foreground">
                Finding reliable help for your home should not be complicated.
                Dial a Tech brings customers and professionals together through
                one simple platform.
              </p>

              <p className="mt-4 leading-7 text-muted-foreground">
                Whether you need a quick repair, regular maintenance, cleaning,
                painting, electrical work, or another home service, our goal is
                to make the entire experience easier from discovery to
                completion.
              </p>

              <div className="mt-7 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>

                <p className="font-medium">
                  Connecting people with trusted professionals.
                </p>
              </div>
            </motion.div>

            {/* Right visual */}

            <motion.div
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.7,
              }}
              className="relative"
            >
              <div
                className="
                  relative
                  overflow-hidden
                  rounded-3xl
                  border
                  bg-card
                  p-6
                  shadow-xl
                  sm:p-8
                "
              >
                {/* Decorative glow */}

                <div
                  className="
                    absolute
                    -right-20
                    -top-20
                    h-48
                    w-48
                    rounded-full
                    bg-orange-500/10
                    blur-3xl
                  "
                />

                <div className="relative">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Dial a Tech
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        Service Journey
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                      <Wrench className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>

                  <div className="space-y-5">
                    {[
                      {
                        icon: Search,
                        title: "Discover",
                        text: "Find the service you need",
                      },
                      {
                        icon: ShieldCheck,
                        title: "Compare",
                        text: "Choose a professional you trust",
                      },
                      {
                        icon: CalendarCheck,
                        title: "Schedule",
                        text: "Pick a convenient time",
                      },
                      {
                        icon: CheckCircle2,
                        title: "Complete",
                        text: "Get the job done",
                      },
                    ].map((item, index) => {
                      const Icon = item.icon;

                      return (
                        <motion.div
                          key={item.title}
                          initial={{
                            opacity: 0,
                            x: 20,
                          }}
                          whileInView={{
                            opacity: 1,
                            x: 0,
                          }}
                          viewport={{
                            once: true,
                          }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 0.5,
                            delay: shouldReduceMotion
                              ? 0
                              : index * 0.12,
                          }}
                          className="flex items-center gap-4"
                        >
                          <div className="relative">
                            <div
                              className="
                                flex
                                h-11
                                w-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-orange-500/10
                              "
                            >
                              <Icon className="h-5 w-5 text-orange-500" />
                            </div>

                            {index < 3 && (
                              <div className="absolute left-1/2 top-11 h-5 w-px -translate-x-1/2 bg-border" />
                            )}
                          </div>

                          <div>
                            <p className="font-semibold">
                              {item.title}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              {item.text}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
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
              How It Works
            </Badge>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From problem to solution,
              <span className="text-[#ff7308]"> made simple.</span>
            </h2>

            <p className="mt-4 text-muted-foreground">
              Dial a Tech removes the complexity from finding and booking home
              services.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.number}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.6,
                    delay: shouldReduceMotion ? 0 : index * 0.1,
                  }}
                >
                  <Card className="group relative h-full overflow-hidden border-border/70 bg-background transition-all duration-300 hover:-translate-y-2 hover:border-orange-500/30 hover:shadow-xl">
                    <CardHeader>
                      <div className="mb-4 flex items-center justify-between">
                        <div
                          className="
                            flex
                            h-12
                            w-12
                            items-center
                            justify-center
                            rounded-xl
                            bg-orange-500/10
                            transition-transform
                            duration-300
                            group-hover:scale-110
                          "
                        >
                          <Icon className="h-6 w-6 text-orange-500" />
                        </div>

                        <span className="text-4xl font-bold text-muted-foreground/20">
                          {step.number}
                        </span>
                      </div>

                      <CardTitle>{step.title}</CardTitle>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          WHY FIXITNOW
      ====================================================== */}

      <section>
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
              Why Dial a Tech?
            </Badge>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built around
              <span className="text-[#ff7308]"> trust and convenience.</span>
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Trusted Professionals",
                description:
                  "Customers can explore technician profiles, ratings, experience, and availability before making a decision.",
              },
              {
                icon: Zap,
                title: "Simple Experience",
                description:
                  "From searching for a service to scheduling a technician, Dial a Tech keeps the experience straightforward.",
              },
              {
                icon: Clock3,
                title: "Flexible Scheduling",
                description:
                  "Choose available time slots that work for your schedule instead of dealing with complicated coordination.",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.6,
                    delay: shouldReduceMotion ? 0 : index * 0.12,
                  }}
                >
                  <Card className="h-full border-border/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="p-7">
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
                        <Icon className="h-6 w-6 text-orange-500" />
                      </div>

                      <h3 className="mt-6 text-xl font-semibold">
                        {feature.title}
                      </h3>

                      <p className="mt-3 leading-7 text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          CUSTOMER + TECHNICIAN
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
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Customers */}

            <motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.7,
              }}
            >
              <Card className="h-full overflow-hidden border-border/70">
                <CardContent className="p-7 sm:p-9">
                  <div className="flex items-center gap-4">
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
                      <Users className="h-6 w-6 text-orange-500" />
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        For Customers
                      </p>

                      <h3 className="text-2xl font-bold">
                        Get help without the hassle.
                      </h3>
                    </div>
                  </div>

                  <p className="mt-6 leading-7 text-muted-foreground">
                    Whether something needs fixing, cleaning, installing, or
                    maintaining, find the right professional and book them
                    through a simple experience.
                  </p>

                  <div className="mt-7 space-y-4">
                    {customerBenefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />

                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    asChild
                    className="
                      mt-8
                      bg-[#ff7308]
                      text-white
                      hover:bg-[#e96500]
                    "
                  >
                    <Link href="/tech/services">
                      Find a Service
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Technicians */}

            <motion.div
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.7,
              }}
            >
              <Card className="h-full overflow-hidden border-border/70">
                <CardContent className="p-7 sm:p-9">
                  <div className="flex items-center gap-4">
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

                    <div>
                      <p className="text-sm text-muted-foreground">
                        For Technicians
                      </p>

                      <h3 className="text-2xl font-bold">
                        Turn your skills into opportunities.
                      </h3>
                    </div>
                  </div>

                  <p className="mt-6 leading-7 text-muted-foreground">
                    Dial a Tech gives skilled professionals a place to showcase
                    their expertise, manage availability, and connect with
                    customers who need their services.
                  </p>

                  <div className="mt-7 space-y-4">
                    {technicianBenefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />

                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    className="mt-8"
                  >
                    <Link href="/?next=/tech">
                      Join as Technician
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
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
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.7,
            }}
          >
            <Badge
              variant="outline"
              className="
                mb-6
                border-orange-500/30
                bg-orange-500/10
                text-orange-600
                dark:text-orange-400
              "
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Get Started With Dial a Tech
            </Badge>

            <h2
              className="
                text-3xl
                font-bold
                tracking-tight
                sm:text-4xl
                md:text-5xl
              "
            >
              Your next home project
              <span className="block text-[#ff7308]">
                starts here.
              </span>
            </h2>

            <p
              className="
                mx-auto
                mt-5
                max-w-2xl
                leading-7
                text-muted-foreground
              "
            >
              Find the service you need, connect with a professional, and get
              your home project moving with Dial a Tech.
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
                <Link href="/tech/services">
                  Explore Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-7"
              >
                <Link href="/tech/find-technicians">
                  Find a Technician
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

