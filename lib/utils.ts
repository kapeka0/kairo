import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import UserAgent from "user-agents";
import { v4 as uuidv4 } from "uuid";

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
};

export function getRealisticUserAgent(): string {
  const deviceDistribution = [
    { type: "desktop", weight: 70 },
    { type: "mobile", weight: 25 },
    { type: "tablet", weight: 5 },
  ];

  const pickDevice = (): "desktop" | "mobile" | "tablet" => {
    const total = deviceDistribution.reduce((a, b) => a + b.weight, 0);
    const rand = Math.random();

    let acc = 0;
    for (const entry of deviceDistribution) {
      acc += entry.weight / total;
      if (rand <= acc) return entry.type as any;
    }
    return "desktop";
  };

  const deviceCategory = pickDevice();

  const platformMap = {
    desktop: ["Win32", "MacIntel", "Linux x86_64"],
    mobile: ["iPhone", "Android"],
    tablet: ["iPad", "Android"],
  };

  const platformOptions = platformMap[deviceCategory];
  const platform =
    platformOptions[Math.floor(Math.random() * platformOptions.length)];

  const ua = new UserAgent({
    deviceCategory,
    platform,
  });

  return ua.toString();
}
