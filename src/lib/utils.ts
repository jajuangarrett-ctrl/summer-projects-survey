import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const WEEKS = 10;
export const HOUR_CAP = 110;
export type HoursPerWeek = 3 | 4 | 5;

export interface Submission {
  id: string;
  timestamp: string;
  counselorName: string;
  projectTitle: string;
  projectDescription: string;
  measurableOutcomes: string;
  extendsAcademicYear: boolean;
  continuedBy?: "same" | "reassigned" | null;
  hoursPerWeek: HoursPerWeek;
}

export const totalHours = (hpw: HoursPerWeek) => hpw * WEEKS;
