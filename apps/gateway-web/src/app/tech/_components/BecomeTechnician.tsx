"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  DollarSign,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const benefits = [
  "Receive verified customer bookings",
  "Choose your own working schedule",
  "Earn competitive income",
  "Secure online payments",
  "Grow your professional reputation",
];

export default function BecomeTechnician() {
  return (
    <section className="relative overflow-hidden py-12">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-10 top-10 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="secondary"
              className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-primary"
            >
             Become a Technician
            </Badge>

            <h2 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">
              Turn Your Skills Into
              <span className="text-primary"> More Income</span>
            </h2>

            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Join hundreds of trusted professionals helping homeowners every
              day. Build your profile, manage your availability, receive
              bookings, and grow your business with Dial a Tech.
            </p>

            {/* Benefits */}
            <div className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <BadgeCheck className="h-5 w-5 text-primary" />
                  </div>

                  <span className="font-medium">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full">
                <Link href="/?next=/tech">Become a Technician</Link>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="rounded-full"
              >
                <Link href="/tech/how-it-works">Learn More</Link>
                
              </Button>
            </div>
          </motion.div>

          {/* Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Main Image */}
            <div className="overflow-hidden rounded-[32px] border bg-background shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=900"
                alt="Technician"
                width={700}
                height={700}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Floating Card 1 */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
              className="absolute -left-6 top-10 rounded-2xl border bg-background p-5 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>

                <div>
                  <p className="text-2xl font-bold">$3,200+</p>
                  <p className="text-sm text-muted-foreground">
                    Monthly Earnings
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Floating Card 2 */}
            <motion.div
              animate={{
                y: [0, 10, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
              }}
              className="absolute -right-6 bottom-12 rounded-2xl border bg-background p-5 shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-6 w-6 text-primary" />
                  <span className="font-semibold">
                    Flexible Schedule
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <BriefcaseBusiness className="h-6 w-6 text-primary" />
                  <span className="font-semibold">
                    500+ Jobs Available
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}