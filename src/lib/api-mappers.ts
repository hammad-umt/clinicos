import type {
  Bill,
  BillStatus,
  ClinicInfo,
  ClinicUpdateRequest,
  DashboardStats,
  Department,
  Doctor,
  Gender,
  Patient,
  PatientCreateRequest,
  Prescription,
  PrescriptionCreateRequest,
  PrescriptionItem,
  Token,
  TokenStatus,
  Visit,
  VisitCreateRequest,
} from "@/types";

export const GENDER_TO_API: Record<Gender, number> = {
  Male: 0,
  Female: 1,
  Other: 2,
};

export const GENDER_FROM_API: Record<number, Gender> = {
  0: "Male",
  1: "Female",
  2: "Other",
};

const TOKEN_STATUS_FROM_API: Record<number, TokenStatus> = {
  0: "Pending",
  1: "InProgress",
  2: "Completed",
  3: "NoShow",
};

export function toApiId(id: string | number): number {
  const value =
    typeof id === "number"
      ? id
      : typeof id === "string"
      ? id.trim() === ""
        ? NaN
        : Number(id)
      : NaN;

  return Number.isFinite(value) ? value : NaN;
}

export function toId(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

export function getDtoValue<T = unknown>(
  dto: Record<string, unknown> | null | undefined,
  ...fields: string[]
): T | undefined {
  if (!dto) return undefined;

  const normalizedKeyMap = Object.keys(dto).reduce<Record<string, string>>(
    (map, key) => ({ ...map, [key.toLowerCase()]: key }),
    {}
  );

  for (const field of fields) {
    const normalized = field.toLowerCase();
    const matchedKey = normalizedKeyMap[normalized];
    if (matchedKey && matchedKey in dto) {
      return dto[matchedKey] as T;
    }
  }

  return undefined;
}

export function mapPatient(dto: Record<string, unknown> | null | undefined): Patient {
  if (!dto) {
    return {
      id: "",
      name: "",
      phone: "",
      gender: "Other",
      age: 0,
      dateOfBirth: "",
      address: undefined,
      createdAt: undefined,
    };
  }

  const genderValue = dto.gender;
  const gender =
    typeof genderValue === "number"
      ? GENDER_FROM_API[genderValue] ?? "Other"
      : (genderValue as Gender) ?? "Other";

  return {
    id: toId(dto.id as number),
    name: (dto.name as string) ?? "",
    phone: (dto.phone as string) ?? "",
    gender,
    age: dto.age as number | undefined,
    dateOfBirth: "",
    address: (dto.address as string) ?? undefined,
    createdAt: (dto.registeredAt as string) ?? undefined,
  };
}

export function mapPatientCreate(data: PatientCreateRequest) {
  return {
    name: data.name,
    phone: data.phone,
    age: data.age ?? calculateAgeFromDob(data.dateOfBirth),
    gender: GENDER_TO_API[data.gender],
    address: data.address,
  };
}

function calculateAgeFromDob(dateOfBirth?: string): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function buildPatientSearchBody(query: string) {
  const trimmed = query.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length >= 7) {
    return { phoneNumber: trimmed, name: null };
  }
  return { name: trimmed, phoneNumber: null };
}

export function mapDoctor(dto: Record<string, unknown> | null | undefined): Doctor {
  if (!dto) {
    return {
      id: "",
      name: "",
      email: "",
      phone: "",
      specialization: "",
      departmentId: "",
      departmentName: undefined,
      consultationFee: 0,
      isActive: true,
    };
  }

  return {
    id: toId(dto.id as number),
    name: (dto.name as string) ?? "",
    email: (dto.email as string) ?? "",
    phone: (dto.phone as string) ?? "",
    specialization: (dto.specialization as string) ?? "",
    departmentId: toId(
      getDtoValue<number>(dto, "departmentId", "DepartmentId") ??
        (dto.departmentId as number)
    ),
    consultationFee: (dto.consultationFee as number) ?? 0,
    departmentName: (dto.departmentName as string) ?? undefined,
    isActive: (dto.isActive as boolean) ?? true,
  };
}

export function mapDepartment(dto: Record<string, unknown> | null | undefined): Department {
  if (!dto) {
    return {
      id: "",
      name: "",
      description: undefined,
    };
  }

  return {
    id: toId(dto.id as number),
    name: (dto.name as string) ?? "",
    description: undefined,
  };
}

export function mapToken(dto: Record<string, unknown> | null | undefined): Token {
  // Handle null or undefined response
  if (!dto) {
    return {
      id: "",
      tokenNumber: 0,
      patientId: "",
      patientName: "",
      doctorId: "",
      doctorName: undefined,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
  }

  const statusValue = dto.status;
  let status: TokenStatus = "Pending";

  if (typeof statusValue === "number") {
    status = TOKEN_STATUS_FROM_API[statusValue] ?? "Pending";
  } else if (typeof statusValue === "string") {
    const normalized = statusValue.replace(/\s+/g, "");
    if (
      normalized === "Pending" ||
      normalized === "Waiting"
    ) {
      status = "Pending";
    } else if (normalized === "InProgress") {
      status = "InProgress";
    } else if (normalized === "Completed" || normalized === "Done") {
      status = "Completed";
    } else if (normalized === "NoShow" || normalized === "Skipped") {
      status = "NoShow";
    }
  }

  return {
    id: toId(getDtoValue<number>(dto, "id", "Id")),
    tokenNumber: getDtoValue<number>(dto, "tokenNumber", "TokenNumber") ?? 0,
    patientId: toId(getDtoValue<number>(dto, "patientId", "PatientId")),
    patientName: getDtoValue<string>(dto, "patientName", "PatientName") ?? "",
    doctorId: toId(getDtoValue<number>(dto, "doctorId", "DoctorId")),
    doctorName: getDtoValue<string>(dto, "doctorName", "DoctorName") ?? undefined,
    status,
    createdAt:
      getDtoValue<string>(dto, "createdAt", "CreatedAt") ??
      new Date().toISOString(),
  };
}

export function mapTokenStatusToApi(status: TokenStatus): string {
  const map: Record<TokenStatus, string> = {
    Pending: "Waiting",
    InProgress: "InProgress",
    Completed: "Done",
    NoShow: "Skipped",
  };
  return map[status];
}

export function mapVisit(dto: Record<string, unknown> | null | undefined): Visit {
  if (!dto) {
    return {
      id: "",
      patientId: "",
      patientName: undefined,
      doctorId: "",
      doctorName: undefined,
      tokenId: undefined,
      chiefComplaint: "",
      diagnosis: undefined,
      notes: undefined,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: toId(getDtoValue<number>(dto, "id", "Id")),
    patientId: toId(getDtoValue<number>(dto, "patientId", "PatientId")),
    patientName: getDtoValue<string>(dto, "patientName", "PatientName") ?? undefined,
    doctorId: toId(getDtoValue<number>(dto, "doctorId", "DoctorId")),
    doctorName: getDtoValue<string>(dto, "doctorName", "DoctorName") ?? undefined,
    tokenId: getDtoValue<number>(dto, "tokenId", "TokenId")
      ? toId(getDtoValue<number>(dto, "tokenId", "TokenId"))
      : undefined,
    chiefComplaint:
      getDtoValue<string>(dto, "chiefComplaint", "ChiefComplaint") ?? "",
    diagnosis: getDtoValue<string>(dto, "diagnosis", "Diagnosis") ?? undefined,
    notes: getDtoValue<string>(dto, "notes", "Notes") ?? undefined,
    createdAt:
      getDtoValue<string>(dto, "visitDate", "VisitDate") ??
      getDtoValue<string>(dto, "createdAt", "CreatedAt") ??
      "",
  };
}

export function mapVisitCreate(data: VisitCreateRequest) {
  const tokenId = data.tokenId ? toApiId(data.tokenId) : NaN;
  const chiefComplaint = data.notes?.trim()
    ? `${data.chiefComplaint}\n\nNotes: ${data.notes.trim()}`
    : data.chiefComplaint;

  return {
    patientId: toApiId(data.patientId),
    doctorId: toApiId(data.doctorId),
    tokenId,
    chiefComplaint,
    diagnosis: data.diagnosis ?? "",
  };
}


export function mapPrescription(dto: Record<string, unknown> | null | undefined): Prescription {
  if (!dto) {
    return {
      id: "",
      visitId: "",
      items: [],
      notes: undefined,
      createdAt: new Date().toISOString(),
    };
  }

  const medicines = (dto.medicines as Record<string, unknown>[] | undefined) ?? [];
  const items: PrescriptionItem[] = medicines.map((m) => ({
    medicine: (m.medicineName as string) ?? (m.medicine as string) ?? "",
    dosage: (m.dosage as string) ?? "",
    frequency: (m.frequency as string) ?? "",
    duration: (m.duration as string) ?? "",
    instructions: (m.instructions as string) ?? undefined,
  }));

  return {
    id: toId(dto.id as number),
    visitId: toId(dto.visitId as number),
    items,
    notes: (dto.instructions as string) ?? undefined,
    followUpDate:
      getDtoValue<string>(dto, "followUpDate", "FollowUpDate") ?? undefined,
    patientName:
      getDtoValue<string>(dto, "patientName", "PatientName") ?? undefined,
    doctorName:
      getDtoValue<string>(dto, "doctorName", "DoctorName") ?? undefined,
    createdAt:
      getDtoValue<string>(dto, "issuedAt", "IssuedAt") ??
      new Date().toISOString(),
  };
}

function toFutureFollowUpDate(dateStr?: string): string {
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 7);
  fallback.setHours(12, 0, 0, 0);

  if (!dateStr?.trim()) {
    return fallback.toISOString();
  }

  const parsed = new Date(`${dateStr.trim()}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return fallback.toISOString();
  }

  if (parsed <= new Date()) {
    parsed.setDate(parsed.getDate() + 1);
  }

  return parsed.toISOString();
}

export function mapPrescriptionCreate(data: PrescriptionCreateRequest) {
  const instructions =
    data.notes?.trim() ||
    "Take medicines as prescribed. Follow dosage and duration carefully.";

  return {
    visitId: toApiId(data.visitId),
    instructions,
    followUpDate: toFutureFollowUpDate(data.followUpDate),
    medicines: data.items.map((item) => ({
      medicineName: item.medicine,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
    })),
  };
}

export function mapBill(
  dto: Record<string, unknown> | null | undefined,
  visitId?: string
): Bill {
  if (!dto) {
    return {
      id: "",
      visitId: visitId ?? "",
      patientName: "",
      doctorName: undefined,
      consultationFee: 0,
      extraCharges: 0,
      discount: 0,
      totalAmount: 0,
      paymentMethod: undefined,
      isPaid: false,
      status: "Unpaid",
      createdAt: new Date().toISOString(),
    };
  }

  const isPaid = Boolean(dto.isPaid);
  return {
    id: toId(dto.id as number),
    visitId: visitId ?? toId(getDtoValue<number>(dto, "visitId", "VisitId")),
    patientName: (dto.patientName as string) ?? "",
    doctorName: (dto.doctorName as string) ?? undefined,
    consultationFee: (dto.consultationFee as number) ?? 0,
    extraCharges: (dto.extraCharges as number) ?? 0,
    discount: (dto.discount as number) ?? 0,
    totalAmount: (dto.totalAmount as number) ?? 0,
    paymentMethod: (dto.paymentMethod as string) ?? undefined,
    isPaid,
    status: (isPaid ? "Paid" : "Unpaid") as BillStatus,
    createdAt: (dto.createdAt as string) ?? new Date().toISOString(),
  };
}

export function mapDashboardStats(dto: Record<string, unknown>): DashboardStats {
  return {
    todayPatients: (dto.todayPatients as number) ?? 0,
    totalPatients: (dto.totalPatients as number) ?? 0,
    totalDoctors: (dto.totalDoctors as number) ?? 0,
    todayRevenue: (dto.todayRevenue as number) ?? 0,
    pendingTokens: (dto.pendingTokens as number) ?? 0,
    recentTokens: [],
  };
}

export function mapClinic(dto: Record<string, unknown> | null | undefined): ClinicInfo {
  if (!dto) {
    return {
      id: "",
      name: "",
      address: "",
      phone: "",
      email: "",
      city: "Lahore",
      openingHours: "",
      logo: undefined,
      openTime: "",
      closeTime: "",
    };
  }

  const openTime = (dto.openTime as string) ?? "";
  const closeTime = (dto.closeTime as string) ?? "";
  return {
    id: toId(dto.id as number),
    name: (dto.name as string) ?? "",
    address: (dto.address as string) ?? "",
    phone: (dto.phone as string) ?? "",
    email: (dto.email as string) ?? "",
    city: "Lahore",
    openingHours:
      openTime && closeTime ? `${openTime.slice(0, 5)} - ${closeTime.slice(0, 5)}` : "",
    logo: (dto.logo as string) ?? undefined,
    openTime,
    closeTime,
  };
}

export function mapClinicUpdate(data: ClinicUpdateRequest) {
  const [openTime = "09:00:00", closeTime = "21:00:00"] =
    data.openingHours?.split("-").map((part) => `${part.trim()}:00`) ?? [];

  return {
    name: data.name,
    logo: data.logo,
    address: data.address,
    phone: data.phone,
    openTime: data.openTime ?? openTime,
    closeTime: data.closeTime ?? closeTime,
  };
}

export function mapArray<T>(
  data: unknown,
  mapper: (item: Record<string, unknown>) => T
): T[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => mapper(item as Record<string, unknown>));
}

export function mapNullable<T>(
  data: unknown,
  mapper: (item: Record<string, unknown>) => T
): T | null {
  if (!data || typeof data !== "object") return null;
  return mapper(data as Record<string, unknown>);
}
