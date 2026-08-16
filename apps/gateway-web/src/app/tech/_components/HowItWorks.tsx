"use client";

import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { bookingSteps as steps } from "./bookingProcessData";

export default function HowItWorks() {
  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 md:mb-16 max-w-2xl text-center"
        >
          <span className="rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            How It Works
          </span>

          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
            Book Home Services in{" "}
            <span className="text-primary">5 Easy Steps</span>
          </h2>

          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Diagnose if you need to, then book a rate-card draft and hold
            Job Reserve with EcoCash or COD.
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-3xl">
          {/* Timeline Line */}
          <div className="absolute left-1/2 top-8 -translate-x-1/2 hidden h-[calc(100%-4rem)] w-[3px] bg-gradient-to-b from-primary/30 via-primary/20 to-transparent md:block" />

          <div className="relative space-y-12 md:space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="relative"
                >
                  {/* Animated Connector */}
                  {index !== steps.length - 1 && (
                    <div className="absolute left-1/2 top-full -translate-x-1/2 hidden md:block z-0">
                      <svg width="110" height="70" className="overflow-visible">
                        <motion.path
                          d={
                            isEven
                              ? "M 55 0 Q 55 25 25 35 Q 5 45 55 60"
                              : "M 55 0 Q 55 25 85 35 Q 115 45 55 60"
                          }
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary/40"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: index * 0.12 }}
                        />
                      </svg>
                    </div>
                  )}

                  <div
                    className={`flex flex-col items-center md:flex-row gap-6 md:gap-10 ${
                      !isEven ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    {/* Card - Smaller Size */}
                    <Card
                      className={`
                        group relative w-full max-w-[340px] overflow-hidden border
                        transition-all duration-300 hover:-translate-y-1.5
                        hover:shadow-xl hover:shadow-primary/10
                        hover:border-primary/50
                        ${isEven ? "md:ml-auto" : "md:mr-auto"}
                      `}
                    >
                      <CardContent className="p-6 md:p-7">
                        {/* Icon */}
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: isEven ? 10 : -10 }}
                          className="
                            mx-auto mb-5 flex h-16 w-16 items-center justify-center
                            rounded-2xl bg-primary text-white shadow-lg
                            ring-8 ring-background
                          "
                        >
                          <Icon className="h-8 w-8" />
                        </motion.div>

                        {/* Step Number */}
                        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-primary shadow ring-4 ring-background">
                          {index + 1}
                        </div>

                        <h3 className="mb-2.5 text-center text-xl font-semibold tracking-tight transition-colors group-hover:text-primary">
                          {step.title}
                        </h3>

                        <p className="text-center text-sm md:text-base text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Timeline Dot */}
                    <div className="absolute left-1/2 z-10 hidden h-6 w-6 -translate-x-1/2 rounded-full border-[5px] border-primary bg-background md:block" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}