import { auth } from "@/lib/auth";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { deleteAddressTag } from "@/lib/db/data/address-tags";
import { validateRequest } from "@/lib/utils/api-validation";
import { portfolioIdParamSchema } from "@/lib/validations/api";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string; address: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { portfolioId: rawPortfolioId, address } = await params;
    const paramValidation = validateRequest(portfolioIdParamSchema, {
      portfolioId: rawPortfolioId,
    });
    if (!paramValidation.success) return paramValidation.response;

    const { portfolioId } = paramValidation.data;

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

    await deleteAddressTag(portfolioId, decodeURIComponent(address));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting address tag:", error);
    return NextResponse.json(
      { error: "Failed to delete address tag" },
      { status: 500 },
    );
  }
}
