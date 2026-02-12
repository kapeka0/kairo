import { BASE_IMAGE_URL } from "./constants";

export function debugLog(...args: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("[DEBUG]", ...args);
  }
}

export function getProfilePicBySeed(seed: string) {
  return BASE_IMAGE_URL + seed;
}
