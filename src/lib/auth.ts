import { jwtDecode } from "jwt-decode";
import type { JwtPayload, UserRole } from "@/types";

const DOTNET_ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

const ROLE_ALIASES: Record<string, UserRole> = {
  admin: "Admin",
  administrator: "Admin",
  receptionist: "Receptionist",
  reception: "Receptionist",
  doctor: "Doctor",
  physician: "Doctor",
};

export function normalizeRole(value: unknown): UserRole | null {
  if (Array.isArray(value)) {
    return normalizeRole(value[0]);
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "Admin" || trimmed === "Receptionist" || trimmed === "Doctor") {
    return trimmed;
  }

  return ROLE_ALIASES[trimmed.toLowerCase()] ?? null;
}

export function extractTokenFromLoginResponse(
  response: Record<string, unknown>
): string | null {
  const candidates = [
    response.token,
    response.accessToken,
    response.access_token,
    response.jwt,
    (response.data as Record<string, unknown> | undefined)?.token,
    (response.data as Record<string, unknown> | undefined)?.accessToken,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const decoded = jwtDecode<Record<string, unknown>>(token);

    const role = normalizeRole(
      decoded.role ??
        decoded.Role ??
        decoded.roles ??
        decoded[DOTNET_ROLE_CLAIM]
    );

    if (!role) {
      return null;
    }

    const email =
      (typeof decoded.email === "string" && decoded.email) ||
      (typeof decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ===
        "string" &&
        (decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        ] as string)) ||
      "";

    const name =
      (typeof decoded.name === "string" && decoded.name) ||
      (typeof decoded.unique_name === "string" && decoded.unique_name) ||
      (typeof decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
      ] === "string" &&
        (decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
        ] as string)) ||
      email.split("@")[0] ||
      "User";

    const sub =
      (typeof decoded.sub === "string" && decoded.sub) ||
      (typeof decoded.nameid === "string" && decoded.nameid) ||
      "";

    const doctorId =
      (typeof decoded.doctorId === "string" && decoded.doctorId) ||
      (typeof decoded.DoctorId === "string" && decoded.DoctorId) ||
      (typeof decoded.doctorId === "number" && String(decoded.doctorId)) ||
      (typeof decoded.DoctorId === "number" && String(decoded.DoctorId)) ||
      undefined;

    const exp = typeof decoded.exp === "number" ? decoded.exp : 0;
    const iat = typeof decoded.iat === "number" ? decoded.iat : 0;

    return {
      sub,
      email,
      name,
      role,
      doctorId,
      exp,
      iat,
    };
  } catch {
    return null;
  }
}

export function buildUserFromLogin(
  token: string,
  response?: { fullName?: string | null; email?: string | null; role?: string | null }
): JwtPayload | null {
  const fromJwt = parseJwtPayload(token);
  const role = normalizeRole(response?.role) ?? fromJwt?.role;

  if (!role) {
    return null;
  }

  if (fromJwt) {
    return {
      ...fromJwt,
      role,
      name: response?.fullName ?? fromJwt.name,
      email: response?.email ?? fromJwt.email,
    };
  }

  return {
    sub: response?.email ?? "",
    email: response?.email ?? "",
    name: response?.fullName ?? "User",
    role,
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
  };
}

export function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  return payload.exp * 1000 <= Date.now();
}
