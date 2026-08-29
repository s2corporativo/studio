export const STUDIO_STORAGE_PREFIX = "social-studio/";

export function normalizeStudioStorageKey(value: string) {
  const key = value.replace(/^\/+/, "");
  if (!key.startsWith(STUDIO_STORAGE_PREFIX)) {
    throw new Error("Storage key fora do namespace permitido.");
  }
  if (key.includes("\\") || key.includes("\0")) {
    throw new Error("Storage key inválida.");
  }
  const segments = key.split("/");
  if (segments.some(segment => segment === ".." || segment === "." || segment.length === 0)) {
    throw new Error("Storage key inválida.");
  }
  return key;
}

export function isValidStudioKey(value: string) {
  try {
    normalizeStudioStorageKey(value);
    return true;
  } catch {
    return false;
  }
}

export function safeHttpsUrl(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
