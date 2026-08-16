"use client";

import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { faqs } from "./faqData";
import Link from "next/link";

export default function FAQSection() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <div className="container mx-auto px-4">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <Badge
            variant="secondary"
            className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-primary"
          >
            Frequently Asked Questions
          </Badge>

          <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
            Have Questions?
            <span className="text-primary"> We've Got Answers.</span>
          </h2>

          <p className="mt-5 text-lg text-muted-foreground">
            Everything you need to know about booking services, payments,
            technicians, and how Dial a Tech works.
          </p>
        </motion.div>

        {/* 2-Column Layout */}
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* FAQ Column - Takes more space */}
            <div className="lg:col-span-7">
              <Accordion type="single" collapsible className="space-y-5">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.08,
                    }}
                  >
                    <AccordionItem
                      value={faq.id}
                      className="overflow-hidden rounded-2xl border bg-background px-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <AccordionTrigger className="py-6 text-left text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <HelpCircle className="h-5 w-5" />
                          </div>
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pb-6 pl-14 text-base leading-7 text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </div>

            {/* Bottom Card Column */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="sticky top-24" // Optional: makes it stick nicely on scroll
              >
                <div className="rounded-3xl border bg-primary/5 p-8 text-center">
                  <h3 className="text-2xl font-bold">
                    Still have questions?
                  </h3>

                  <p className="mt-3 text-muted-foreground">
                    Our support team is ready to help you with bookings, payments,
                    technician registration, or any other questions.
                  </p>

                  <button className="mt-6 rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition hover:scale-105">
                   <Link href="/tech/contact">Contact Support</Link>
                  </button>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}