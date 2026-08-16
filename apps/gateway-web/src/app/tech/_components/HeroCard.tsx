








"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, Calendar } from "lucide-react";

export default function HeroCard() {
  return (
    <div className="relative flex justify-center lg:justify-end mt-12 lg:mt-0">
      <div className="relative w-full max-w-[520px] aspect-[4/3.3] min-h-[420px]">

        {/* Soft Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-transparent rounded-[3rem] rotate-3 scale-[1.05]" />


       {/* Background Decorative Stars - Muted & Eye-catching */}
        <div className="absolute -top-10 right-2 text-violet-400/30 dark:text-violet-500/20 pointer-events-none z-10">
          <Star className="w-20 h-20 drop-shadow-sm animate-pulse-slow" />
        </div>

        
        <div className="absolute -bottom-12 -left-5 text-blue-400/30 dark:text-blue-500/20 pointer-events-none z-10">
          <Star className="w-24 h-24 drop-shadow-sm animate-pulse-slow" 
             />
        </div>
        {/* Card 1 - Happy Customer */}
        <div className="absolute hover:z-60 -top-4 -left-2 sm:-top-6 sm:-left-4 bg-card border rounded-3xl p-4 shadow-2xl z-7 
                        w-[210px] sm:w-60 
                        -rotate-[-8deg] hover:rotate-[-2deg] 
                        hover:-translate-y-4 hover:shadow-3xl
                        transition-all duration-700 ease-out
                        animate-float-slow group">

          <div className="relative h-52 sm:h-56 rounded-2xl overflow-hidden mb-4">
            <Image
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600"
              alt="Happy Customer"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            
            <div className="absolute bottom-4 left-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm font-medium">"Fixed my leaking pipe in under 2 hours!"</p>
              <div className="text-xs mt-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm" />
                <span>Emma Thompson • Homeowner</span>
              </div>
            </div>
          </div>
          <Badge className="bg-emerald-500">Very Satisfied</Badge>
        </div>

        {/* Card 2 - Professional Technician (Main Card) */}
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 bg-card border rounded-3xl p-5 shadow-2xl z-10
                        w-56 sm:w-64 
                        hover:scale-110 hover:-translate-y-6 hover:shadow-3xl hover:z-11
                        transition-all duration-700 ease-out
                        animate-float-vertical group">

          <div className="relative h-56 sm:h-60 rounded-2xl overflow-hidden mb-4">
            <Image
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600"
              alt="Technician"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium shadow">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Verified Pro
            </div>
          </div>
          
          <div className="text-center">
            <div className="font-semibold">Marcus Rivera</div>
            <div className="text-sm text-muted-foreground">Plumbing Expert • 8+ years</div>
            <div className="flex justify-center gap-1 mt-2">
              <Badge variant="secondary" className="text-xs">4.97</Badge>
              <Badge variant="secondary" className="text-xs">237 jobs</Badge>
            </div>
          </div>
        </div>

        {/* Card 3 - Home Repair */}
        <div className="absolute bottom-8 sm:bottom-8 right-1 sm:right-2 bg-card border rounded-3xl p-4 shadow-2xl z-10 
                        w-[210px] sm:w-60 
                        rotate-[7deg] hover:rotate-[3deg]
                        hover:-translate-y-4 hover:shadow-3xl hover:z-10
                        transition-all duration-700 ease-out
                        animate-float group">

          <div className="relative h-52 sm:h-56 rounded-2xl overflow-hidden mb-4">
            <Image
              src="https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600"
              alt="Home Repair"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent" />
            
            <div className="absolute bottom-4 left-4 text-white">
              <div className="uppercase tracking-widest text-xs mb-1">In Progress</div>
              <div className="text-xl font-bold">Bathroom Renovation</div>
              <div className="flex items-center gap-2 mt-4 text-sm">
                <Calendar className="w-4 h-4" />
                Completed in 4 hours
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Before → After</span>
            <span className="text-emerald-500 font-semibold">✓ Done</span>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="absolute -bottom-25 -right-4 sm:-right-6 bg-card border shadow-2xl rounded-2xl px-5 py-4 z-50 flex items-center gap-3
                        hover:-translate-y-2 hover:shadow-3xl 
                        transition-all duration-700 ease-out
                        animate-float-slow">
          <div className="text-3xl">🏠</div>
          <div className="text-xs leading-tight">
            <div className="font-semibold">500+ Homes Fixed Today</div>
            <div className="text-muted-foreground">Across 12 cities</div>
          </div>
        </div>

      </div>
    </div>
  );
}