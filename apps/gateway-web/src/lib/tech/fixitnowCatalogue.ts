/**
 * FixItNow-shaped service catalogue backed by DIAL rate_card drafts (D-32).
 * Display dollars are derived from amountMinor — AI never writes payable amounts.
 */
import {
  draftTechQuote,
  listBookingSlots,
  type BookingSlot,
} from "@dial/jobs";
import type { IBookingSlot, IService } from "../../types/types.service";

export type TechCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TechServiceRecord = IService & {
  jobClass: string;
  emergency: boolean;
  categoryId: string;
  category: { id: string; name: string };
  amountUsdMinor: string;
  bookingSlots: IBookingSlot[];
};

const STAMP = "2026-08-16T00:00:00.000Z";

export const TECH_CATEGORIES: TechCategory[] = [
  {
    id: "cat_plumbing",
    name: "Plumbing",
    slug: "plumbing",
    icon: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=200",
    description: "Leaks, pipes, and emergency plumbing.",
    isActive: true,
    createdAt: STAMP,
    updatedAt: STAMP,
  },
  {
    id: "cat_electrical",
    name: "Electrical",
    slug: "electrical",
    icon: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=200",
    description: "Wiring, sockets, and lighting.",
    isActive: true,
    createdAt: STAMP,
    updatedAt: STAMP,
  },
  {
    id: "cat_cleaning",
    name: "Cleaning",
    slug: "cleaning",
    icon: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200",
    description: "Home and office cleaning.",
    isActive: true,
    createdAt: STAMP,
    updatedAt: STAMP,
  },
  {
    id: "cat_painting",
    name: "Painting",
    slug: "painting",
    icon: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=200",
    description: "Interior and exterior painting.",
    isActive: true,
    createdAt: STAMP,
    updatedAt: STAMP,
  },
  {
    id: "cat_ac",
    name: "AC Repair",
    slug: "ac-repair",
    icon: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200",
    description: "AC servicing and installation.",
    isActive: true,
    createdAt: STAMP,
    updatedAt: STAMP,
  },
  {
    id: "cat_handyman",
    name: "Handyman",
    slug: "handyman",
    icon: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200",
    description: "General home repairs and carpentry.",
    isActive: true,
    createdAt: STAMP,
    updatedAt: STAMP,
  },
  {
    id: "cat_emergency",
    name: "Emergency",
    slug: "emergency",
    icon: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200",
    description: "Roadside and urgent call-outs.",
    isActive: true,
    createdAt: STAMP,
    updatedAt: STAMP,
  },
];

const SERVICE_SEED: Array<{
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  categoryId: string;
  jobClass: string;
  emergency: boolean;
  estimatedDuration: number;
  averageRating: number;
  totalReviews: number;
}> = [
  {
    id: "svc_plumbing",
    title: "Plumbing",
    description:
      "Leak repairs, pipe installation and emergency plumbing services.",
    thumbnail:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900",
    categoryId: "cat_plumbing",
    jobClass: "diagnostics",
    emergency: false,
    estimatedDuration: 90,
    averageRating: 4.9,
    totalReviews: 324,
  },
  {
    id: "svc_electrical",
    title: "Electrical",
    description: "Safe electrical repairs, wiring, lighting and maintenance.",
    thumbnail:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900",
    categoryId: "cat_electrical",
    jobClass: "diagnostics",
    emergency: false,
    estimatedDuration: 75,
    averageRating: 4.8,
    totalReviews: 241,
  },
  {
    id: "svc_cleaning",
    title: "Cleaning",
    description:
      "Professional home and office cleaning with eco-friendly products.",
    thumbnail:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900",
    categoryId: "cat_cleaning",
    jobClass: "diagnostics",
    emergency: false,
    estimatedDuration: 120,
    averageRating: 5,
    totalReviews: 502,
  },
  {
    id: "svc_painting",
    title: "Painting",
    description: "Interior and exterior painting with premium finishes.",
    thumbnail:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900",
    categoryId: "cat_painting",
    jobClass: "diagnostics",
    emergency: false,
    estimatedDuration: 180,
    averageRating: 4.9,
    totalReviews: 168,
  },
  {
    id: "svc_ac",
    title: "AC Repair",
    description: "Fast AC servicing, installation and maintenance.",
    thumbnail:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900",
    categoryId: "cat_ac",
    jobClass: "diagnostics",
    emergency: false,
    estimatedDuration: 90,
    averageRating: 4.8,
    totalReviews: 212,
  },
  {
    id: "svc_carpentry",
    title: "Carpentry",
    description: "Furniture repair, custom woodwork and installations.",
    thumbnail:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900",
    categoryId: "cat_handyman",
    jobClass: "diagnostics",
    emergency: false,
    estimatedDuration: 120,
    averageRating: 4.9,
    totalReviews: 196,
  },
  {
    id: "svc_emergency",
    title: "Emergency roadside",
    description: "Urgent dispatch — rate-card draft only; AI pricing bypassed.",
    thumbnail:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=900",
    categoryId: "cat_emergency",
    jobClass: "roadside_emergency",
    emergency: true,
    estimatedDuration: 60,
    averageRating: 4.9,
    totalReviews: 88,
  },
];

function dollarsFromMinor(minor: bigint): number {
  return Number(minor) / 100;
}

function mapSlots(
  serviceId: string,
  slots: BookingSlot[],
): IBookingSlot[] {
  return slots.map((s) => ({
    id: s.slotId,
    serviceId,
    date: s.startAt,
    startsAt: s.startAt,
    endsAt: s.endAt,
    isAvailable: true,
    isBooked: false,
    bookingId: null,
    note: "",
    bookingDeadline: s.endAt,
    maxBookings: 1,
    bookedCount: 0,
    createdAt: STAMP,
    updatedAt: STAMP,
  }));
}

export async function hydrateTechServices(): Promise<TechServiceRecord[]> {
  const slots = await listBookingSlots();
  return SERVICE_SEED.map((row) => {
    const quote = draftTechQuote({
      jobClass: row.jobClass,
      emergency: row.emergency,
    });
    const category =
      TECH_CATEGORIES.find((c) => c.id === row.categoryId) ??
      TECH_CATEGORIES[0]!;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnail: row.thumbnail,
      isAvailable: true,
      estimatedDuration: row.estimatedDuration,
      averageRating: row.averageRating,
      totalReviews: row.totalReviews,
      priceType: "FIXED" as const,
      price: dollarsFromMinor(quote.draftAmountUsdMinor),
      amountUsdMinor: quote.draftAmountUsdMinor.toString(),
      jobClass: row.jobClass,
      emergency: row.emergency,
      categoryId: row.categoryId,
      category: { id: category.id, name: category.name },
      bookingSlots: mapSlots(row.id, slots),
    };
  });
}

export async function listTechServices(query?: {
  [key: string]: string | string[] | undefined;
}): Promise<{
  success: true;
  data: TechServiceRecord[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}> {
  const getValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const searchTerm = (getValue(query?.searchTerm) ?? "").toLowerCase();
  const categoryId = getValue(query?.categoryId);
  const page = Number(getValue(query?.page) ?? 1) || 1;
  const limit = Number(getValue(query?.limit) ?? 12) || 12;

  let rows = await hydrateTechServices();
  if (searchTerm) {
    rows = rows.filter(
      (s) =>
        s.title.toLowerCase().includes(searchTerm) ||
        s.description.toLowerCase().includes(searchTerm),
    );
  }
  if (categoryId && categoryId !== "all") {
    rows = rows.filter((s) => s.categoryId === categoryId);
  }
  const total = rows.length;
  const totalPage = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return {
    success: true,
    data: rows.slice(start, start + limit),
    meta: { page, limit, total, totalPage },
  };
}

export async function getTechServiceById(
  id: string,
): Promise<TechServiceRecord | null> {
  const rows = await hydrateTechServices();
  return rows.find((s) => s.id === id) ?? null;
}
