import { describe, it, expect } from "vitest";
import type { GeneratedFile } from "../src/types";

describe("toolchain", () => {
  it("compila tipos e roda o vitest", () => {
    const f: GeneratedFile = { path: "a.md", content: "hi" };
    expect(f.path).toBe("a.md");
  });
});
