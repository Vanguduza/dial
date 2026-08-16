"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { whyChooseItems } from "./whyChooseData";

export default function WhyChooseFixItNow() {
  return (
    <section className="relative py-24">
      {/* Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-primary/10 blur-[150px]" />
      </div>

      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-primary"
          >
            Why Choose Dial a Tech
          </Badge>

          <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
            Reliable Home Services You Can Trust
          </h2>

          <p className="mt-4 text-lg text-muted-foreground">
            Experience hassle-free booking, verified professionals, and
            dependable service—all in one platform.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {whyChooseItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
              >
                <Card className="group h-full overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  <CardContent className="p-8">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-8 w-8" />
                    </div>

                    <h3 className="mb-3 text-xl font-semibold">
                      {item.title}
                    </h3>

                    <p className="leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>

                  {/* Bottom Accent */}
                  <div className="h-1 w-0 bg-primary transition-all duration-500 group-hover:w-full" />
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}