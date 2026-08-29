import { and, asc, eq, ne } from "drizzle-orm";
import { externalConnections, type ExternalConnection } from "../drizzle/externalConnectionsSchema";
import { getDb } from "./db";

export type ExternalConnectionProvider = "facebook" | "linkedin";
export type ExternalConnectionPublic = Omit<ExternalConnection, "accessTokenCiphertext"> & { hasProtectedToken: true };
function toPublic(connection: ExternalConnection): ExternalConnectionPublic { const { accessTokenCiphertext: _protected, ...rest } = connection; return { ...rest, hasProtectedToken: true }; }

export async function listExternalConnections(userId: number, provider: ExternalConnectionProvider) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível."); const rows = await db.select().from(externalConnections).where(and(eq(externalConnections.userId, userId), eq(externalConnections.provider, provider))).orderBy(asc(externalConnections.accountName)); return rows.map(toPublic); }
export async function getExternalConnection(userId: number, provider: ExternalConnectionProvider, externalAccountId: string) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível."); const [row] = await db.select().from(externalConnections).where(and(eq(externalConnections.userId, userId), eq(externalConnections.provider, provider), eq(externalConnections.externalAccountId, externalAccountId))).limit(1); return row ?? null; }
export async function getExternalConnectionById(userId: number, provider: ExternalConnectionProvider, id: number) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível."); const [row] = await db.select().from(externalConnections).where(and(eq(externalConnections.id, id), eq(externalConnections.userId, userId), eq(externalConnections.provider, provider))).limit(1); return row ?? null; }

export async function upsertExternalConnection(userId: number, values: Omit<typeof externalConnections.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt"> & { provider: ExternalConnectionProvider }) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível.");
  await db.insert(externalConnections).values({ ...values, userId }).onDuplicateKeyUpdate({ set: { socialProfileId: values.socialProfileId, accountName: values.accountName, accessTokenCiphertext: values.accessTokenCiphertext, tokenExpiresAt: values.tokenExpiresAt, permissions: values.permissions, metadataJson: values.metadataJson, state: values.state, lastError: values.lastError, connectedAt: values.connectedAt, updatedAt: new Date() } });
  const row = await getExternalConnection(userId, values.provider, values.externalAccountId); if (!row) throw new Error("Não foi possível persistir a conexão externa."); return toPublic(row);
}

async function chooseExternalAccount(userId: number, provider: ExternalConnectionProvider, externalAccountId: string, notFoundMessage: string) {
  const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível."); const selected = await getExternalConnection(userId, provider, externalAccountId); if (!selected) throw new Error(notFoundMessage);
  await db.transaction(async tx => {
    await tx.update(externalConnections).set({ state: "disconnected", updatedAt: new Date() }).where(and(eq(externalConnections.userId, userId), eq(externalConnections.provider, provider), ne(externalConnections.externalAccountId, externalAccountId)));
    await tx.update(externalConnections).set({ state: "connected", lastError: null, connectedAt: new Date(), updatedAt: new Date() }).where(and(eq(externalConnections.userId, userId), eq(externalConnections.provider, provider), eq(externalConnections.externalAccountId, externalAccountId)));
  });
  const connected = await getExternalConnection(userId, provider, externalAccountId); if (!connected) throw new Error("Não foi possível selecionar a conta externa."); return toPublic(connected);
}

export function chooseFacebookPage(userId: number, externalAccountId: string) { return chooseExternalAccount(userId, "facebook", externalAccountId, "Página do Facebook não encontrada para esta conta."); }
export function chooseLinkedInOrganization(userId: number, externalAccountId: string) { return chooseExternalAccount(userId, "linkedin", externalAccountId, "Organização do LinkedIn não encontrada para esta conta."); }

async function getConnectedExternalAccount(userId: number, provider: ExternalConnectionProvider) { const db = await getDb(); if (!db) throw new Error("Banco de dados indisponível."); const [row] = await db.select().from(externalConnections).where(and(eq(externalConnections.userId, userId), eq(externalConnections.provider, provider), eq(externalConnections.state, "connected"))).limit(1); return row ?? null; }
export function getConnectedFacebookPage(userId: number) { return getConnectedExternalAccount(userId, "facebook"); }
export function getConnectedLinkedInOrganization(userId: number) { return getConnectedExternalAccount(userId, "linkedin"); }
