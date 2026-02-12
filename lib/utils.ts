import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function devLog(...args: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("[DEV]", ...args);
  }
}


export const generateUUID = (): string => {
  return uuidv4();
}