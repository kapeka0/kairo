import { auth } from "@/lib/auth";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import {
  getAddressTagsByPortfolioId,
  upsertAddressTag,
} from "@/lib/db/data/address-tags";
import { validateRequest } from "@/lib/utils/api-validation";
import { portfolioIdParamSchema } from "@/lib/validations/api";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const upsertTagBodySchema = z.object({
  address: z.string().min(1),
  tag: z.string().min(1).max(64),
});

async function getAuthAndPortfolio(
  rawParams: { portfolioId: string },
  userId: string,
) {
  const paramValidation = validateRequest(portfolioIdParamSchema, rawParams);
  if (!paramValidation.success) return { error: paramValidation.response };

  const { portfolioId } = paramValidation.data;
  const portfolioExists = await existsPortfolioByIdAndUserId(
    portfolioId,
    userId,
  );
  if (!portfolioExists) {
    return {
      error: NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 },
      ),
    };
  }
  return { portfolioId };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawParams = await params;
    const result = await getAuthAndPortfolio(rawParams, session.user.id);
    if (result.error) return result.error;

    const tags = await getAddressTagsByPortfolioId(result.portfolioId!);
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Error fetching address tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch address tags" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawParams = await params;
    const result = await getAuthAndPortfolio(rawParams, session.user.id);
    if (result.error) return result.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const bodyValidation = validateRequest(upsertTagBodySchema, body);
    if (!bodyValidation.success) return bodyValidation.response;

    const { address, tag } = bodyValidation.data;
    await upsertAddressTag(result.portfolioId!, address, tag);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error upserting address tag:", error);
    return NextResponse.json(
      { error: "Failed to save address tag" },
      { status: 500 },
    );
  }
}
