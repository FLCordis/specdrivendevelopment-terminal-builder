import { zipSync, strToU8 } from "fflate";
import type { GeneratedPackage } from "./types";

export function packageZip(pkg: GeneratedPackage): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const file of pkg.files) {
    entries[file.path] = strToU8(file.content);
  }
  return zipSync(entries);
}
