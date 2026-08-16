
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { topTechnicians } from "./techniciansData";
import Link from "next/link";

export default function TopRatedTechnicians() {
  return (
    <section className="relative py-24">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <div className="container mx-auto px-2">
        {/* Heading */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-primary"
          >
            Top Rated Technicians
          </Badge>

          <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
            Meet Our Trusted Professionals
          </h2>

          <p className="mt-4 text-lg text-muted-foreground">
            Highly skilled and verified experts ready to help with your home
            service needs.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {topTechnicians.map((tech, index) => (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.45,
                delay: index * 0.06,
              }}
            >
              <Card className="group overflow-hidden rounded-2xl border bg-background transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                <CardContent className="flex flex-col items-center p-1 text-center">
                  {/* Verified */}
                  {tech.verified && (
                    <Badge className="mb-2 rounded-full bg-green-100 px-3 py-1 text-[10px] font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                      <BadgeCheck className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}

                  {/* Avatar */}
                  <div className="relative mb-2">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl transition-all duration-300 group-hover:scale-125" />

                    <Image
                      src={tech.image}
                      alt={tech.name}
                      width={88}
                      height={88}
                      className="relative h-22 w-22 rounded-full border-2 border-background object-cover shadow-lg ring-2 ring-primary/10 transition duration-300 group-hover:scale-105 group-hover:ring-primary/30"
                    />
                  </div>

                  {/* Name */}
                  <h3 className="line-clamp-1 text-lg font-semibold">
                    {tech.name}
                  </h3>

                  {/* Designation */}
                  <p className=" text-sm text-muted-foreground">
                    {tech.profession}
                  </p>

                  {/* Rating */}
                  <div className="mt-2 flex items-center gap-1 rounded-full bg-muted px-3 py-1.5">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />

                    <span className="text-sm font-semibold">
                      {tech.rating}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      ({tech.reviews})
                    </span>
                  </div>

                  {/* Button */}
                  <Button
                    asChild
                    size="sm"
                    className="mt-2 rounded-full"
                  >
                    <Link href="/tech/find-technicians">
                      View Profile

                      <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}