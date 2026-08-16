import { cookies } from "next/headers";
import {
  getSessionFromToken,
  sessionCookieName,
} from "../auth/session";

/** Navbar shape copied from FixItNow — filled from DialSession, never body userId. */
export type TechNavbarUser = {
  success: boolean;
  message: string;
  data?: {
    profile?: {
      id: string;
      name: string;
      email: string;
      phone: string;
      activeStatus: string;
      role: string;
      isVerified: boolean;
      lastLoginAt: string | null;
      userStatus: string | null;
      createdAt: string;
      updatedAt: string;
      technicianProfile?: null;
    };
  };
};

export async function getTechNavbarUser(): Promise<TechNavbarUser> {
  const jar = await cookies();
  const session = getSessionFromToken(jar.get(sessionCookieName())?.value);
  if (!session) {
    return { success: false, message: "unauthenticated" };
  }
  const role =
    session.role === "technician"
      ? "TECHNICIAN"
      : session.role === "ops_admin"
        ? "ADMIN"
        : "CUSTOMER";
  return {
    success: true,
    message: "ok",
    data: {
      profile: {
        id: session.userId,
        name: session.email.split("@")[0] || "Customer",
        email: session.email,
        phone: "",
        activeStatus: "ACTIVE",
        role,
        isVerified: true,
        lastLoginAt: null,
        userStatus: "ACTIVE",
        createdAt: "",
        updatedAt: "",
        technicianProfile: null,
      },
    },
  };
}
