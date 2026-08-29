# Provedores de IA — opção gratuita vs. paga

O Social Studio conversa com a IA por uma API **compatível com OpenAI** (`/v1/chat/completions` e `/v1/models`). Isso significa que o provedor de texto pode ser trocado **somente por variáveis de ambiente**, sem alterar código:

| Variável | Função |
|---|---|
| `BUILT_IN_FORGE_API_URL` | URL base do provedor (padrão: Manus Forge) |
| `BUILT_IN_FORGE_API_KEY` | Chave de API do provedor |
| `LLM_MODEL` | Modelo de texto preferido (padrão: `gpt-5-mini`). Se o provedor não oferecer esse id, o sistema usa automaticamente o primeiro modelo do catálogo do provedor |

## Opções gratuitas compatíveis (texto)

Funcionam como *drop-in* porque expõem os mesmos caminhos `/v1/chat/completions` e `/v1/models`:

1. **Groq** — `BUILT_IN_FORGE_API_URL=https://api.groq.com/openai`, `LLM_MODEL=llama-3.3-70b-versatile`. Camada gratuita generosa e muito rápida; limites de requisições por minuto.
2. **OpenRouter (modelos `:free`)** — `BUILT_IN_FORGE_API_URL=https://openrouter.ai/api`, `LLM_MODEL` com sufixo `:free`. Vários modelos gratuitos; limites diários baixos.

> A API OpenAI-compatível do Google Gemini usa caminho de URL diferente (`/v1beta/openai/...`) e **não** é drop-in com a configuração atual.

## Limitações importantes das opções gratuitas

- **Geração de imagem não é coberta.** As artes usam o `ImageService` do Forge (GPT Image 2, protocolo Connect). Provedores gratuitos de texto não substituem isso; trocar o gerador de imagem exigiria desenvolvimento novo, e as alternativas gratuitas de imagem têm qualidade visivelmente inferior para arte institucional.
- **Saída estruturada obrigatória.** Todo o sistema depende de `json_schema` estrito (rascunhos, Brand Guardian, agentes). Modelos gratuitos falham com mais frequência nesse contrato, o que aparece para o usuário como "a IA não retornou uma resposta estruturada".
- **Multimodal.** O Brand Guardian envia imagens ao modelo. Nem todo modelo gratuito aceita imagem com boa qualidade de análise.
- **Limites e privacidade.** Camadas gratuitas têm rate limits e, em alguns provedores, os dados podem ser usados para treinamento. Para conteúdo jurídico de escritório, avaliar os termos antes de ativar.

## Recomendação

Para **produção** deste sistema (conteúdo jurídico com compliance OAB, avaliação multimodal de arte e publicação externa), a IA **paga é a escolha correta**: consistência no JSON estrito, suporte a imagem no Brand Guardian e qualidade superior nas artes. O custo por post é baixo (centavos por geração de texto; a arte em qualidade alta é o item mais caro).

Uso recomendado da opção gratuita: ambiente de **teste/homologação** ou redução de custo nas rotinas de texto de baixo risco (classificação de inbox, radar), mantendo a geração de artes e o Brand Guardian no provedor pago.
