"use client";

import CountUp from "react-countup";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { statistics } from "./statisticsData";

export default function PlatformStatistics() {
  return (
    <section className="relative py-12">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-primary"
          >
            Platform Statistics
          </Badge>

          <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
            Trusted by Thousands of Customers
          </h2>

          <p className="mt-4 text-lg text-muted-foreground">
            Our growing community continues to rely on Dial a Tech for fast,
            secure, and professional home services.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {statistics.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
              >
                <Card className="group rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  <CardContent className="flex flex-col items-center p-8 text-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-8 w-8" />
                    </div>

                    <h3 className="text-5xl font-extrabold tracking-tight text-primary">
                      <CountUp
                        end={item.value}
                        duration={2}
                        decimals={item.value % 1 !== 0 ? 1 : 0}
                      />
                      {item.suffix}
                    </h3>

                    <p className="mt-3 text-lg font-medium text-muted-foreground">
                      {item.title}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}