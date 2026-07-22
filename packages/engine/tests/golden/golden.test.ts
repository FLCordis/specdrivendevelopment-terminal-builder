import { describe, it, expect } from "vitest";
import { generate } from "../../src/compose";
import { FIXTURES } from "./fixtures";

describe("golden files", () => {
  for (const [name, state] of Object.entries(FIXTURES)) {
    it(`árvore estável para a fixture ${name}`, async () => {
      const pkg = generate(state);
      // ordena por caminho para snapshot determinístico
      const sorted = [...pkg.files].sort((a, b) =>
        a.path.localeCompare(b.path),
      );
      for (const file of sorted) {
        const snapPath = `__golden__/${name}/${file.path}.snap`;
        await expect(file.content).toMatchFileSnapshot(snapPath);
      }
    });
  }
});
