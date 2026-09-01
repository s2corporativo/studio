import { describe, expect, it } from "vitest";
import { decodeValidatedBase64, detectKnowledgeFile } from "./routers/knowledgeSecurity";

function fakeZipWithEntries(entries: string[]) {
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  const centralParts = entries.map(name => {
    const nameBytes = Buffer.from(name);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(nameBytes.length, 28);
    return Buffer.concat([header, nameBytes]);
  });
  const central = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(central.length, 12);
  eocd.writeUInt32LE(local.length, 16);
  return Buffer.concat([local, central, eocd]);
}

describe("knowledge file validation", () => {
  it("rejects a generic zip", () => {
    const bytes = fakeZipWithEntries(["readme.txt", "data.json"]);
    expect(detectKnowledgeFile(bytes)).toBeNull();
  });

  it("recognizes the required DOCX package structure", () => {
    const bytes = fakeZipWithEntries(["[Content_Types].xml", "_rels/.rels", "word/document.xml", "word/_rels/document.xml.rels"]);
    expect(detectKnowledgeFile(bytes)?.extension).toBe(".docx");
  });

  it("rejects malformed Base64 before decoding the upload", () => {
    expect(() => decodeValidatedBase64("not-a-valid-upload%%%")).toThrow(/Base64 válido/);
    expect(decodeValidatedBase64(Buffer.from("arquivo").toString("base64")).toString()).toBe("arquivo");
  });
});
