

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  MapPin,
  Star,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  getAllTechnicians,
} from "../../../lib/tech/fixitnowActions";
import type { Technician } from "../../../lib/tech/fixitnowTechnicians";

interface FindTechniciansPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    city?: string;
    profession?: string;
    isAvailable?: string;
    isApproved?: string;
    minRating?: string;
    minExperience?: string;
    maxHourlyRate?: string;
    oem?: string;
  }>;
}

export default async function FindTechniciansPage({
  searchParams,
}: FindTechniciansPageProps) {
  const params = await searchParams;

  const technicians = await getAllTechnicians({
    page: Number(params.page) || 1,
    limit: Number(params.limit) || 12,
    city: params.city,
    profession: params.profession,
    isAvailable:
      params.isAvailable !== undefined
        ? params.isAvailable === "true"
        : undefined,
    isApproved:
      params.isApproved !== undefined
        ? params.isApproved === "true"
        : undefined,
    minRating: params.minRating
      ? Number(params.minRating)
      : undefined,
    minExperience: params.minExperience
      ? Number(params.minExperience)
      : undefined,
      maxHourlyRate: params.maxHourlyRate
        ? Number(params.maxHourlyRate)
        : undefined,
      oem: params.oem,
    });

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Find Your Technician
        </h1>

        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Browse verified technicians, compare experience, ratings, and hourly
          rates to hire the right professional.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {technicians.data.map((tech: Technician) => {
          const profile = tech.technicianProfile;

          return (
            <Card
              key={tech.id}
              className="group relative overflow-hidden rounded-2xl border bg-background p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl"
            >
              {/* Top Gradient */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />

              <div className="relative">
                {/* Avatar */}
                <div className="relative mx-auto h-20 w-20">
                  <Image
                    src={
                      profile.profilePhoto ||
                      "https://placehold.co/300x300?text=User"
                    }
                    alt={tech.name}
                    fill
                    className="rounded-full border-4 border-background object-cover shadow-md"
                  />

                  {profile.isAvailable && (
                    <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>

                {/* Name */}
                <div className="mt-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <h2 className="line-clamp-1 text-lg font-semibold">
                      {tech.name}
                    </h2>

                    {profile.isApproved && (
                      <BadgeCheck className="h-4 w-4 text-blue-500" />
                    )}
                  </div>

                  <p className="text-sm font-medium text-primary">
                    {profile.profession || "Technician"}
                  </p>
                  {profile.oemSpecialties.length > 0 ? (
                    <p className="mt-1 text-xs font-medium text-primary">
                      Specialist: {profile.oemSpecialties.join(", ")}
                    </p>
                  ) : null}

                  <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {profile.city || "Zimbabwe"}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-muted px-3 py-1.5">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

                  <span className="text-sm font-semibold">
                    {profile.averageRating?.toFixed(1) ?? "0.0"}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    ({profile.totalReviews ?? 0})
                  </span>
                </div>

                {/* Experience + Rate */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-2 text-center">
                    <Briefcase className="mx-auto mb-1 h-4 w-4 text-primary" />

                    <p className="text-sm font-semibold">
                      {profile.yearsOfExperience ?? 0} yrs
                    </p>

                    <p className="text-[11px] text-muted-foreground">
                      Experience
                    </p>
                  </div>

                  <div className="rounded-lg border p-2 text-center">
                    <Wallet className="mx-auto mb-1 h-4 w-4 text-primary" />

                    <p className="text-sm font-semibold">
                      ${profile.hourlyRate ?? 0}
                    </p>

                    <p className="text-[11px] text-muted-foreground">
                      Per Hour
                    </p>
                  </div>
                </div>

                {/* Button */}
                <Button
                  asChild
                  size="sm"
                  className="mt-4 w-full rounded-lg"
                >
                  <Link
                    href={`/tech/find-technicians/${tech.id}`}
                    className="flex items-center justify-center gap-2"
                  >
                    View Profile
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {technicians.data.length === 0 && (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16">
          <h2 className="text-xl font-semibold">
            No Technicians Found
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search filters and try again.
          </p>
        </div>
      )}
    </div>
  );
}