import { NextResponse } from "next/server";

export type ErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "PAYLOAD_TOO_LARGE";

export function apiError(status: number, code: ErrorCode, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status }
  );
}

export function notFound() {
  return apiError(404, "NOT_FOUND", "Not found");
}

export function unauthenticated() {
  return apiError(401, "UNAUTHENTICATED", "Not authenticated");
}
