import { NextResponse } from "next/server";
import { z } from "zod";

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Validation failed",
            details: errors,
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      ),
    };
  }
}

export async function parseSearchParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  const paramsObject = Object.fromEntries(searchParams.entries());
  return validateRequest(schema, paramsObject);
}
