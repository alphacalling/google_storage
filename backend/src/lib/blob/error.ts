import { Response } from "express";

/**
 * Map Azure Blob errors to HTTP responses in Express.
 * @param error - error thrown from storage SDK
 * @param defaultMessage - fallback message if error type is unknown
 * @param res - Express Response object
 */
export function handleBlobError(error: unknown, defaultMessage: string, res: Response) {
  console.error("Blob API error:", error);
  const err = error as any;
  const code = err?.code ?? err?.details?.errorCode;

  if (code === "ContainerNotFound" || err?.statusCode === 404) {
    return res.status(404).json({ error: "Container not found" });
  }

  return res.status(503).json({
    error: defaultMessage,
    details: err?.message ?? "Unknown error",
  });
}
