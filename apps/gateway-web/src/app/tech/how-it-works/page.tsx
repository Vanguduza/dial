import {
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

import { bookingSteps } from "../_components/bookingProcessData";

const steps = bookingSteps.map((step) => ({
  icon: step.icon,
  title: step.title,
  description: step.description,
}));

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Professionals",
    description: "Every technician is verified before joining the platform.",
  },
  {
    icon: Star,
    title: "Transparent Reviews",
    description: "Read genuine customer ratings before making a booking.",
  },
  {
    icon: CheckCircle,
    title: "EcoCash + COD hold",
    description:
      "Job Reserve is held on EcoCash or cash on delivery — not a card checkout.",
  },
];

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wrench className="h-8 w-8 text-primary" />
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            How <span className="text-primary">Dial a Tech</span> Works
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground text-lg">
            Diagnose the problem (or skip to a known need), confirm a rate-card
            USD draft, then hold Job Reserve with EcoCash or cash on delivery.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Simple Process</h2>
          <p className="mt-3 text-muted-foreground">
            From booking to completion, everything is quick and seamless.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <Card
                key={step.title}
                className="relative border transition-all hover:-translate-y-2 hover:shadow-xl"
              >
                <CardContent className="p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {index + 1}
                    </span>

                    <h3 className="text-xl font-semibold">{step.title}</h3>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {step.description}
                  </p>

                  {index !== steps.length - 1 && (
                    <ArrowRight className="absolute -right-4 top-1/2 hidden h-8 w-8 -translate-y-1/2 text-muted-foreground xl:block" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Why Choose */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              Why Choose Dial a Tech?
            </h2>

            <p className="mt-3 text-muted-foreground">
              We make hiring trusted technicians simple, secure, and reliable.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card
                  key={feature.title}
                  className="border-0 bg-background shadow-sm transition hover:shadow-lg"
                >
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>

                    <h3 className="mt-5 text-xl font-semibold">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-0 bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center justify-between gap-8 p-12 text-center lg:flex-row lg:text-left">
            <div>
              <h2 className="text-3xl font-bold">
                Ready to Book a Technician?
              </h2>

              <p className="mt-3 max-w-2xl text-primary-foreground/90">
                Whether you need an electrician, plumber, AC technician, or any
                other home service expert, Dial a Tech connects you with trusted
                professionals in minutes.
              </p>
            </div>

            <Button
              asChild
              size="lg"
              variant="secondary"
              className="gap-2 whitespace-nowrap"
            >
              <Link href="/tech/find-technicians">
                Find Technicians
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}