"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { featuredServices } from "./data";
import { IFeaturedService } from "./data";
import Link from "next/link";

export default function FeaturedServices() {
  return (
    <section className="relative py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-sm font-semibold text-[#ff7308]">
            Featured Services
          </span>

          <h2 className="mt-5 text-4xl font-bold">
            Professional Home Services
          </h2>

          <p className="mt-4 text-muted-foreground">
            Book trusted professionals for every home repair, maintenance,
            and cleaning task.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {featuredServices.map((service: IFeaturedService, index) => {
            const Icon = service.icon;

            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
              >
                <Card className="group overflow-hidden rounded-3xl border transition-all duration-500 hover:-translate-y-2 hover:border-[#ff7308]/60 hover:shadow-2xl hover:shadow-orange-500/20">
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-110"
                    />

                    <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold backdrop-blur">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {service.rating}
                    </div>

                    <div className="absolute right-4 top-4 rounded-full bg-[#ff7308] p-3 text-white shadow-lg">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
                  </div>

                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">
                        {service.title}
                      </h3>

                      <span className="font-bold text-[#ff7308]">
                        From {service.price}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        {service.reviews} Reviews
                      </span>

                      <Button
                        asChild
                        className="group rounded-full bg-[#ff7308] hover:bg-[#e76800]"
                      >
                        <Link href="/tech/services">
                          Book Now

                          <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </div>
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