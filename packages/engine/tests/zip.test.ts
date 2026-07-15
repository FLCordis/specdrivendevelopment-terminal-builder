import { describe, it, expect } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { packageZip } from "../src/zip.js";

const pkg = {
  files: [
    { path: "CLAUDE.md", content: "# oi" },
    { path: "docs/superpowers/specs/roadmap.md", content: "# roadmap" },
  ],
  warnings: [],
};

describe("packageZip", () => {
  it("produz um zip com as mesmas entradas e conteúdo", () => {
    const bytes = packageZip(pkg);
    expect(bytes).toBeInstanceOf(Uint8Array);
    const entries = unzipSync(bytes);
    expect(Object.keys(entries).sort()).toEqual([
      "CLAUDE.md",
      "docs/superpowers/specs/roadmap.md",
    ]);
    expect(strFromU8(entries["CLAUDE.md"])).toBe("# oi");
  });
});
