/**
 * Donor-shaped loaders for copied FixItNow screens — DIAL SoR underneath.
 */
import { TECH_CATEGORIES, listTechServices } from "./fixitnowCatalogue";
import {
  getDialTechnicianById,
  listDialTechnicians,
} from "./fixitnowTechnicians";

export async function getAllCategories() {
  return {
    success: true as const,
    statusCode: 200,
    message: "ok",
    data: TECH_CATEGORIES,
  };
}

export async function getAllServicesss({
  query,
}: {
  query?: { [key: string]: string | string[] | undefined } | undefined;
} = {}) {
  return listTechServices(query);
}

export async function getAllTechnicians(
  filters: Parameters<typeof listDialTechnicians>[0] = {},
) {
  return listDialTechnicians(filters);
}

export async function getTechnicianById(technicianId: string) {
  return getDialTechnicianById(technicianId);
}
