import { ENV } from "./env";

export type LlmModelCatalog = { data: Array<{ id: string }> };

/**
 * Resolve qual modelo de texto usar: o preferido via LLM_MODEL (padrão gpt-5-mini)
 * quando disponível no catálogo do provedor, senão o primeiro modelo listado.
 * Permite trocar de provedor/modelo (inclusive gratuitos compatíveis com OpenAI)
 * apenas por variável de ambiente, sem alterar código.
 */
export const pickPreferredLlmModel = (catalog: LlmModelCatalog): string | undefined =>
  catalog.data.find(item => item.id === ENV.preferredLlmModel)?.id ?? catalog.data[0]?.id;
