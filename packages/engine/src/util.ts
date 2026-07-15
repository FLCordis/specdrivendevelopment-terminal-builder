export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function orClarify(value: string, label: string): string {
  const v = (value ?? "").trim();
  return v ? v : `[NEEDS CLARIFICATION: ${label}]`;
}

export function bullets(items: string[], label: string): string {
  if (!items || items.length === 0) {
    return `- ${orClarify("", label)}`;
  }
  return items.map((i) => `- ${i}`).join("\n");
}
