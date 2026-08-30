// Limite de uso por usuário para operações de IA, com janela deslizante em
// memória. Suficiente para o deploy atual de processo único; numa eventual
// escala horizontal o estado precisaria migrar para armazenamento compartilhado.

type WindowState = { timestamps: number[] };

const buckets = new Map<string, WindowState>();

export type RateLimitRule = { limit: number; windowMs: number };

export const AI_TEXT_LIMIT: RateLimitRule = { limit: 20, windowMs: 10 * 60 * 1000 };
export const AI_IMAGE_LIMIT: RateLimitRule = { limit: 10, windowMs: 10 * 60 * 1000 };

export function consumeRateLimit(userId: number, operation: string, rule: RateLimitRule, now = Date.now()) {
  const key = `${userId}:${operation}`;
  const state = buckets.get(key) ?? { timestamps: [] };
  state.timestamps = state.timestamps.filter(timestamp => now - timestamp < rule.windowMs);
  if (state.timestamps.length >= rule.limit) {
    const oldest = state.timestamps[0]!;
    const retryInMinutes = Math.max(1, Math.ceil((rule.windowMs - (now - oldest)) / 60_000));
    buckets.set(key, state);
    throw new Error(`Limite de geração atingido para proteger o uso de IA (${rule.limit} solicitações a cada ${Math.round(rule.windowMs / 60_000)} minutos). Tente novamente em cerca de ${retryInMinutes} minuto(s).`);
  }
  state.timestamps.push(now);
  buckets.set(key, state);
}

export function resetRateLimits() {
  buckets.clear();
}
