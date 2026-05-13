import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const WEEKS = 10;
export type HoursPerWeek = 3 | 4 | 5;

export type Department = "calworks" | "sss";

export const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: "calworks", label: "CalWORKs" },
  { value: "sss", label: "Student Support Services" },
];

export const DEPARTMENT_CAPS: Record<Department, number> = {
  calworks: 110,
  sss: 110,
};

export const TOTAL_CAP = Object.values(DEPARTMENT_CAPS).reduce(
  (a, b) => a + b,
  0,
);

export const departmentLabel = (d: Department) =>
  DEPARTMENTS.find((x) => x.value === d)?.label ?? d;

export interface Submission {
  id: string;
  timestamp: string;
  department: Department;
  counselorName: string;
  projectTitle: string;
  projectDescription: string;
  measurableOutcomes: string;
  extendsAcademicYear: boolean;
  continuedBy?: "same" | "reassigned" | null;
  hoursPerWeek: HoursPerWeek;
}

export const totalHours = (hpw: HoursPerWeek) => hpw * WEEKS;
