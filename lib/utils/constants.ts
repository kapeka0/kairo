import { client_env } from "../env/client";

export const BASE_IMAGE_URL = client_env.NEXT_PUBLIC_URL + "/api/avatar?name=";


// Updating this list requires updating the `currencies` enum in `lib/db/schema.ts` and the `currency` field in the `portfolio` table
export const CURRENCIES = [
     { value: "USD", label: "USD - US Dollar", symbol: "$" },
     { value: "EUR", label: "EUR - Euro", symbol: "€" },
     { value: "GBP", label: "GBP - British Pound", symbol: "£" },
     { value: "JPY", label: "JPY - Japanese Yen", symbol: "¥" },
     { value: "CNY", label: "CNY - Chinese Yuan", symbol: "¥" },
   ] as const;
