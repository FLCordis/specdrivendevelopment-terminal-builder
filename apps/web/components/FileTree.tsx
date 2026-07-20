"use client";
import type { TreeNode } from "../lib/file-tree";

export function FileTree({
  nodes, selectedPath, onSelect, depth = 0,
}: {
  nodes: TreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth?: number;
}) {
  return (
    <ul className={`tree${depth ? " tree--nested" : ""}`}>
      {nodes.map((node) => (
        <li key={`${node.isFile ? "f" : "d"}:${node.path}`}>
          {node.isFile ? (
            <button
              type="button"
              onClick={() => onSelect(node.path)}
              className={`tree__file${node.path === selectedPath ? " is-active" : ""}`}
            >
              {node.name}
            </button>
          ) : (
            <>
              <span className="tree__folder">{node.name}</span>
              <FileTree
                nodes={node.children} selectedPath={selectedPath}
                onSelect={onSelect} depth={depth + 1}
              />
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
