import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  storagePut: vi.fn(),
}));

vi.mock("server/storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("./env", () => ({
  ENV: { forgeApiUrl: "https://forge.example/", forgeApiKey: "test-key" },
}));

import { generateImage } from "./imageGeneration";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("generateImage", () => {
  it("envia geração com sinal de limite e salva o resultado no armazenamento", async () => {
    const payload = Buffer.from("imagem-de-teste").toString("base64");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ image: { b64Json: payload, mimeType: "image/png" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    mocks.storagePut.mockResolvedValue({ key: "generated/test.png", url: "/manus-storage/generated/test.png" });

    await expect(generateImage({ prompt: "Fundo editorial" })).resolves.toEqual({ url: "/manus-storage/generated/test.png" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://forge.example/images.v1.ImageService/GenerateImage",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^generated\//), expect.any(Buffer), "image/png");
  });

  it("retorna erro seguro quando a geração excede o limite de tempo", async () => {
    const timeoutError = Object.assign(new Error("tempo excedido"), { name: "TimeoutError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

    await expect(generateImage({ prompt: "Fundo editorial" })).rejects.toThrow("A geração visual excedeu o tempo de resposta");
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });
});
