import { TRPCError } from "@trpc/server";

export function badRequest(message: string, cause?: unknown): never {
  throw new TRPCError({ code: "BAD_REQUEST", message, cause });
}

export function notFound(message: string, cause?: unknown): never {
  throw new TRPCError({ code: "NOT_FOUND", message, cause });
}

export function conflict(message: string, cause?: unknown): never {
  throw new TRPCError({ code: "CONFLICT", message, cause });
}

export function forbidden(message: string, cause?: unknown): never {
  throw new TRPCError({ code: "FORBIDDEN", message, cause });
}
