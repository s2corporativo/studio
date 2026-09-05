import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./env", () => ({ ENV: { forgeApiKey: "test-api-key", forgeApiUrl: "https://forge.example.test" } }));

import { invokeLLM } from "./llm";

describe("invokeLLM", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("envia max_completion_tokens quando solicitado para chamadas GPT com raciocínio", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "test",
      created: 0,
      model: "gpt-5-mini",
      choices: [{ index: 0, message: { role: "assistant", content: "{}" }, finish_reason: "stop" }],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await invokeLLM({
      model: "gpt-5-mini",
      maxCompletionTokens: 1200,
      reasoning: { effort: "minimal" },
      messages: [{ role: "user", content: "teste" }],
    });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.max_completion_tokens).toBe(1200);
    expect(payload.max_tokens).toBeUndefined();
  });
});
