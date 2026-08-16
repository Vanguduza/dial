"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Search,
  Wrench,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        {/* Main Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-orange-500" />

        {/* Decorative Glow */}
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl text-center"
        >
          <Badge className="border-white/20 bg-white/15 px-4 py-1 text-white hover:bg-white/20">
            <Sparkles className="mr-2 h-4 w-4" />
            Join the Dial a Tech Community
          </Badge>

          <h2 className="mt-6 text-4xl font-bold leading-tight text-white md:text-6xl">
            Home Services Made
            <br />
            <span className="text-white/90">Simple, Fast & Reliable</span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/80">
            Whether you need a trusted technician or you're a skilled
            professional looking for more clients, Dial a Tech connects the right
            people at the right time.
          </p>

          {/* Stats */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white">
            <div>
              <h3 className="text-3xl font-bold">15K+</h3>
              <p className="text-sm text-white/80">Completed Jobs</p>
            </div>

            <div className="hidden h-10 w-px bg-white/20 sm:block" />

            <div>
              <h3 className="text-3xl font-bold">850+</h3>
              <p className="text-sm text-white/80">Verified Technicians</p>
            </div>

            <div className="hidden h-10 w-px bg-white/20 sm:block" />

            <div>
              <h3 className="text-3xl font-bold">4.9★</h3>
              <p className="text-sm text-white/80">Customer Rating</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="h-14 rounded-full px-8 text-base shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Search className="mr-2 h-5 w-5" />
              <Link href="/tech/services">Find a Service</Link>

              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-full border-white bg-transparent px-8 text-base text-white transition-all duration-300 hover:scale-105 hover:bg-white hover:text-primary"
            >
              <Wrench className="mr-2 h-5 w-5" />
              
              <Link href="/tech/emergency">Emergency</Link>
            </Button>
          </div>

          {/* Trust Text */}
          <p className="mt-8 text-sm text-white/70">
            ✓ Verified Professionals &nbsp;&nbsp; • &nbsp;&nbsp;
            ✓ Secure Payments &nbsp;&nbsp; • &nbsp;&nbsp;
            ✓ Trusted by Thousands
          </p>
        </motion.div>
      </div>
    </section>
  );
}