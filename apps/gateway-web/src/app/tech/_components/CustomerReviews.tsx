"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { reviews } from "./reviewsData";

export default function CustomerReviews() {
  return (
    <section className="relative py-12">
      {/* Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-primary"
          >
            Customer Reviews
          </Badge>

          <h2 className="mt-5 text-4xl font-bold md:text-5xl">
            Loved by Thousands of Customers
          </h2>

          <p className="mt-4 text-lg text-muted-foreground">
            Discover why homeowners trust Dial a Tech for fast, reliable, and
            professional home services.
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {reviews.map((review, index) => (
              <CarouselItem
                key={review.id}
                className="md:basis-1/2 xl:basis-1/3"
              >
                <motion.div
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08,
                  }}
                >
                  <Card className="group h-full rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
                    <CardContent className="p-8">
                      <Quote className="mb-5 h-10 w-10 text-primary/20" />

                      <p className="mb-6 leading-7 text-muted-foreground">
                        "{review.review}"
                      </p>

                      <div className="mb-6 flex items-center gap-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-4">
                        <Image
                          src={review.image}
                          alt={review.name}
                          width={60}
                          height={60}
                          className="rounded-full object-cover ring-2 ring-primary/10"
                        />

                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {review.name}
                          </h3>

                          <p className="text-sm text-muted-foreground">
                            {review.role}
                          </p>
                        </div>

                        <Badge variant="outline">
                          {review.service}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="-left-5" />
          <CarouselNext className="-right-5" />
        </Carousel>
      </div>
    </section>
  );
}