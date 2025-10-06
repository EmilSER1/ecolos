import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "";
  return new Intl.NumberFormat("ru-RU").format(n);
}
