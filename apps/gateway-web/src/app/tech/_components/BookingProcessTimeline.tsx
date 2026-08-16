"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { bookingSteps } from "./bookingProcessData";

export default function BookingProcessTimeline() {
  return (
    <section className="relative py-8">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-primary"
          >
            Booking Process
          </Badge>

          <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
            Book a Technician in 5 Easy Steps
          </h2>

          <p className="mt-4 text-lg text-muted-foreground">
            Diagnose if needed, confirm a rate-card draft, then hold Job Reserve
            with EcoCash or COD.
          </p>
        </div>

        {/* Timeline */}
        <div className="grid gap-8 lg:grid-cols-5">
          {bookingSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="relative flex items-center"
              >
                <motion.div
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.12,
                  }}
                  className="w-full"
                >
                  <Card className="group relative h-full overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                    <CardContent className="flex flex-col items-center p-2 text-center">
                      {/* Number */}
                      <div className="absolute right-5 top-5 text-5xl font-black text-primary/10">
                        0{step.id}
                      </div>

                      {/* Icon */}
                      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-8 w-8" />
                      </div>

                      <h3 className="text-xl font-semibold">
                        {step.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {step.description}
                      </p>
                    </CardContent>

                    <div className="h-1 w-0 bg-primary transition-all duration-500 group-hover:w-full" />
                  </Card>
                </motion.div>

                {/* Connector */}
                {index !== bookingSteps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 lg:flex">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.6,
                        delay: index * 0.15,
                      }}
                      className="origin-left"
                    >
                      <ArrowRight className="h-8 w-8 text-primary" />
                    </motion.div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}