/**
 * FixItNow-shaped technician directory from DIAL profile cards (Pack §9.3).
 * Hourly display = rate_card draft USD — not donor or AI payable.
 */
import {
  draftTechQuote,
  listTechnicianProfileCards,
  ensureDialTechProfileFixtures,
  normalizeOemBrand,
  type TechnicianProfileCard,
} from "@dial/jobs";

const STAMP = "2026-08-16T00:00:00.000Z";

const PHOTOS = [
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600",
] as const;

export type TechnicianProfile = {
  id: string;
  userId: string;
  bio: string | null;
  profilePhoto: string;
  description: string | null;
  profession: string | null;
  skills: string[] | null;
  oemSpecialties: string[];
  yearsOfExperience: number | null;
  hourlyRate: number | null;
  averageRating: number;
  totalReviews: number;
  totalCompletedJobs: number;
  isAvailable: boolean;
  responseTime: string | null;
  isApproved: boolean;
  address: string | null;
  city: string | null;
  district: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Technician = {
  id: string;
  name: string;
  email: string;
  phone: string;
  activeStatus: "ACTIVE" | "BLOCKED" | "BAN" | "UNBAN";
  role: "TECHNICIAN";
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  technicianProfile: TechnicianProfile;
};

function ensureDirectory(): void {
  ensureDialTechProfileFixtures();
}

function cardToTechnician(
  card: TechnicianProfileCard,
  index: number,
): Technician {
  const quote = draftTechQuote({ jobClass: "diagnostics", emergency: false });
  const hourly = Number(quote.draftAmountUsdMinor) / 100;
  const available = card.availability === "available";
  return {
    id: card.technicianId,
    name: card.displayName,
    email: `${card.technicianId.replace(/[^a-z0-9]/gi, "_")}@dial.africa`,
    phone: "+263 242 000 000",
    activeStatus: "ACTIVE",
    role: "TECHNICIAN",
    isVerified: card.eligible,
    lastLoginAt: null,
    createdAt: STAMP,
    updatedAt: STAMP,
    technicianProfile: {
      id: `prof_${card.technicianId}`,
      userId: card.technicianId,
      bio: card.managersChoice
        ? "Manager's choice — verified Dial a Tech professional."
        : `Verified ${card.tradeName} technician on Dial a Tech.`,
      profilePhoto: PHOTOS[index % PHOTOS.length]!,
      description: `${card.tradeName} • ${card.eligible ? "eligible" : "pending"}`,
      profession: card.tradeName,
      skills: [
        card.tradeName,
        "Home services",
        ...card.oemSpecialties.map((s) => s),
      ],
      oemSpecialties: [...card.oemSpecialties],
      yearsOfExperience: 5 + (index % 8),
      hourlyRate: hourly,
      averageRating: card.valueScore != null ? card.valueScore / 20 : 4.8,
      totalReviews: card.valueScore ?? 12,
      totalCompletedJobs: 40 + index * 7,
      isAvailable: available,
      responseTime: "15",
      isApproved: card.eligible,
      address: "Borrowdale",
      city: "Harare",
      district: "Harare",
      createdAt: STAMP,
      updatedAt: STAMP,
    },
  };
}

export function listDialTechnicians(filters: {
  page?: number | undefined;
  limit?: number | undefined;
  city?: string | undefined;
  profession?: string | undefined;
  isAvailable?: boolean | undefined;
  isApproved?: boolean | undefined;
  minRating?: number | undefined;
  minExperience?: number | undefined;
  maxHourlyRate?: number | undefined;
  oem?: string | undefined;
} = {}): {
  success: true;
  statusCode: number;
  message: string;
  data: Technician[];
  meta: { page: number; limit: number; total: number; totalPage: number };
} {
  ensureDirectory();
  let rows = listTechnicianProfileCards().map(cardToTechnician);
  if (filters.city) {
    const city = filters.city.toLowerCase();
    rows = rows.filter((t) =>
      (t.technicianProfile.city ?? "").toLowerCase().includes(city),
    );
  }
  if (filters.profession) {
    const p = filters.profession.toLowerCase();
    rows = rows.filter((t) =>
      (t.technicianProfile.profession ?? "").toLowerCase().includes(p),
    );
  }
  if (filters.isAvailable !== undefined) {
    rows = rows.filter(
      (t) => t.technicianProfile.isAvailable === filters.isAvailable,
    );
  }
  if (filters.isApproved !== undefined) {
    rows = rows.filter(
      (t) => t.technicianProfile.isApproved === filters.isApproved,
    );
  }
  if (filters.minRating !== undefined) {
    rows = rows.filter(
      (t) => t.technicianProfile.averageRating >= filters.minRating!,
    );
  }
  if (filters.oem) {
    const want = normalizeOemBrand(filters.oem);
    rows = rows.filter((t) =>
      t.technicianProfile.oemSpecialties.some(
        (s) => normalizeOemBrand(s) === want,
      ),
    );
  }
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;
  const total = rows.length;
  const start = (page - 1) * limit;
  return {
    success: true,
    statusCode: 200,
    message: "ok",
    data: rows.slice(start, start + limit),
    meta: {
      page,
      limit,
      total,
      totalPage: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export function getDialTechnicianById(id: string): {
  success: boolean;
  message: string;
  data: { technician: Technician } | null;
} {
  ensureDirectory();
  const found = listDialTechnicians({ limit: 50 }).data.find((t) => t.id === id);
  if (!found) {
    return { success: false, message: "not found", data: null };
  }
  return { success: true, message: "ok", data: { technician: found } };
}
