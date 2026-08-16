








'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Users, ShieldCheck } from 'lucide-react';
import HeroCard from './HeroCard';
import Link from 'next/link';


export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden bg-background pt-8">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ff730820_0.8px,transparent_1px)] bg-[length:20px_20px] dark:bg-[radial-gradient(#ff730810_0.8px,transparent_1px)]" />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 pt-4 lg:pt-0">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <span className="text-primary">🏠</span>
              <span className="font-medium">Your Trusted Home Service Platform</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.1] text-foreground">
                Find Trusted Home Service<br />
                Professionals in{' '}
                <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Minutes
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                Book verified technicians for plumbing, electrical, cleaning, AC repair, 
                painting, and more—all from one platform.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-lg h-14 px-10 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto"
                asChild
              >
                <Link href="/tech/services">
                  Find a Service
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="text-lg h-14 px-8 rounded-xl font-semibold border-2 hover:bg-secondary w-full sm:w-auto"
                asChild
              >
                <Link href="/?next=/tech">Become a Technician</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 md:gap-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex text-2xl text-amber-500">★★★★☆</div>
                <div>
                  <div className="font-semibold text-lg leading-none">4.9</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-9 w-9 text-primary" />
                <div>
                  <div className="font-semibold text-lg leading-none">500+</div>
                  <div className="text-sm text-muted-foreground">Verified Technicians</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheck className="h-9 w-9 text-emerald-500" />
                <div>
                  <div className="font-semibold text-lg leading-none">Secure</div>
                  <div className="text-sm text-muted-foreground">Payments</div>
                </div>
              </div>
            </div>
          </div>

          <HeroCard/>
        </div>
      </div>
    </section>
  );
}