// app/api/avatar/route.ts
import { toFacehashHandler } from "facehash/next";

export const { GET } = toFacehashHandler();
