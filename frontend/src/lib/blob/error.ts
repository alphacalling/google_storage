import { NextResponse } from "next/server";

/**
 * Map Azure blob errors to HTTP responses.
 * @param error - error thrown from storage SDK
 * @param defaultMessage - fallback message if error type is unknown
 */
export function handleBlobError(error: unknown, defaultMessage: string) {
  console.error("Blob API error:", error);
  const err = error as any;
  const code = err?.code ?? err?.details?.errorCode;

  if (code === "ContainerNotFound" || err?.statusCode === 404) {
    return NextResponse.json({ error: "Container not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      error: defaultMessage,
      details: err?.message ?? "Unknown error",
    },
    { status: 503 },
  );
}
