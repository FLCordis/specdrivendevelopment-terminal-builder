import type { GeneratedFile } from "@sdd/engine";

export interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNode[];
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1; // pastas primeiro
      return a.name.localeCompare(b.name);
    })
    .map((n) => ({ ...n, children: sortNodes(n.children) }));
}

export function buildTree(files: GeneratedFile[]): TreeNode[] {
  const roots: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let level = roots;
    let acc = "";

    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isFile = i === parts.length - 1;
      let node = level.find((n) => n.name === part && n.isFile === isFile);
      if (!node) {
        node = { name: part, path: acc, isFile, children: [] };
        level.push(node);
      }
      level = node.children;
    });
  }

  return sortNodes(roots);
}
