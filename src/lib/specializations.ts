const STORAGE_KEY = "clinic_specializations";

const DEFAULT_SPECIALIZATIONS = [
  "General Medicine",
  "Pediatrics",
  "Child Specialist",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Gynecology",
  "ENT Specialist",
  "Ophthalmology",
  "Psychiatry",
  "Urology",
  "Gastroenterology",
  "Pulmonology",
  "Endocrinology",
  "Nephrology",
  "Oncology",
  "Rheumatology",
  "Family Medicine",
  "Emergency Medicine",
  "Radiology",
  "Pathology",
  "Anesthesiology",
  "General Surgery",
  "Plastic Surgery",
  "Neurosurgery",
  "Pediatric Surgery",
  "Dental Surgery",
];

/**
 * Initialize LocalStorage with default specializations if empty
 */
export function initializeSpecializations(): void {
  if (typeof window === "undefined") return;

  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const sorted = [...DEFAULT_SPECIALIZATIONS].sort();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  }
}

/**
 * Get all specializations from LocalStorage
 */
export function getSpecializations(): string[] {
  if (typeof window === "undefined") return DEFAULT_SPECIALIZATIONS;

  initializeSpecializations();
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : DEFAULT_SPECIALIZATIONS;
}

/**
 * Filter specializations by search term
 */
export function filterSpecializations(searchTerm: string): string[] {
  const all = getSpecializations();
  if (!searchTerm.trim()) return all;

  const lower = searchTerm.toLowerCase();
  return all.filter((spec) => spec.toLowerCase().includes(lower));
}

/**
 * Add a new specialization to LocalStorage
 * Avoids duplicates and maintains alphabetical order
 */
export function addSpecialization(specialization: string): void {
  if (typeof window === "undefined") return;

  const trimmed = specialization.trim();
  if (!trimmed) return;

  const all = getSpecializations();

  // Check if already exists (case-insensitive)
  if (all.some((spec) => spec.toLowerCase() === trimmed.toLowerCase())) {
    return;
  }

  // Add and sort
  const updated = [...all, trimmed].sort();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Clear all specializations (for reset/testing)
 */
export function clearSpecializations(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Reset to default specializations
 */
export function resetToDefaults(): void {
  if (typeof window === "undefined") return;
  const sorted = [...DEFAULT_SPECIALIZATIONS].sort();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
}
