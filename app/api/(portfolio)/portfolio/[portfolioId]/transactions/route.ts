import { auth } from "@/lib/auth";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { getPortfolioTransactions } from "@/lib/server/transactions";
import { devLog } from "@/lib/utils";
import { parseSearchParams, validateRequest } from "@/lib/utils/api-validation";
import { portfolioIdParamSchema } from "@/lib/validations/api";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(1000),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawParams = await params;
    const paramValidation = validateRequest(portfolioIdParamSchema, rawParams);

    if (!paramValidation.success) {
      return paramValidation.response;
    }

    const queryValidation = await parseSearchParams(
      transactionsQuerySchema,
      request.nextUrl.searchParams,
    );

    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { portfolioId } = paramValidation.data;
    const { page, pageSize } = queryValidation.data as {
      page: number;
      pageSize: number;
    };

    const portfolioExists = await existsPortfolioByIdAndUserId(
      portfolioId,
      session.user.id,
    );

    if (!portfolioExists) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 },
      );
    }

    const payload = await getPortfolioTransactions(portfolioId, page, pageSize);

    devLog("[Transaction route] Returning paginated transactions:", {
      total: payload.transactions.length,
      page,
      pageSize,
      totalPages: payload.totalPages,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
