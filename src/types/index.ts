export type UserRole = "Admin" | "Receptionist" | "Doctor";

export type TokenStatus =
  | "Pending"
  | "InProgress"
  | "Completed"
  | "NoShow";

export type BillStatus = "Paid" | "Unpaid";

export type Gender = "Male" | "Female" | "Other";

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  doctorId?: string;
  exp: number;
  iat: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  fullName?: string;
  email?: string;
  role?: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  gender: Gender;
  age?: number;
  address?: string;
  dateOfBirth?: string;
  cnic?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  registeredAt?: string;
  createdAt?: string;
}

export interface PatientCreateRequest {
  name: string;
  phone: string;
  gender: Gender;
  age?: number;
  address?: string;
  dateOfBirth?: string;
  cnic?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  consultationFee: number;
  departmentId: string;
  departmentName?: string;
  isActive: boolean;
}

export interface DoctorCreateRequest {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  consultationFee?: number;
  departmentId: string;
  password?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Token {
  id: string;
  tokenNumber: number;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName?: string;
  status: TokenStatus;
  createdAt: string;
}

export interface TokenCreateRequest {
  patientId: string;
  doctorId: string;
}

export interface Visit {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  tokenId?: string;
  chiefComplaint: string;
  diagnosis?: string;
  notes?: string;
  createdAt: string;
}

export interface VisitCreateRequest {
  patientId: string;
  doctorId: string;
  tokenId?: string;
  chiefComplaint: string;
  diagnosis?: string;
  notes?: string;
}

export interface PrescriptionItem {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  visitId: string;
  items: PrescriptionItem[];
  notes?: string;
  createdAt: string;
}

export interface PrescriptionCreateRequest {
  visitId: string;
  items: PrescriptionItem[];
  notes?: string;
  followUpDate?: string;
}

export interface Bill {
  id: string;
  visitId?: string;
  patientName: string;
  doctorName?: string;
  consultationFee: number;
  extraCharges?: number;
  discount?: number;
  totalAmount: number;
  paymentMethod?: string;
  isPaid: boolean;
  status?: BillStatus;
  createdAt: string;
}

export interface BillCreateRequest {
  visitId: string;
  extraCharges?: number;
  discount?: number;
  paymentMethod?: string;
  isPaid?: boolean;
}

export interface DashboardStats {
  todayPatients?: number;
  todayRevenue: number;
  totalPatients: number;
  totalDoctors: number;
  pendingTokens?: number;
  recentTokens?: Token[];
}

export interface ClinicInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  openingHours?: string;
  logo?: string;
  openTime?: string;
  closeTime?: string;
}

export interface ClinicUpdateRequest {
  name: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  openingHours?: string;
  logo?: string;
  openTime?: string;
  closeTime?: string;
}

export interface ApiError {
  status: number;
  data?: { message?: string };
}
