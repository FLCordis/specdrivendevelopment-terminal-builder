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
    <ul style={{ listStyle: "none", padding: 0, margin: 0, marginLeft: depth ? 12 : 0 }}>
      {nodes.map((node) => (
        <li key={node.path}>
          {node.isFile ? (
            <button
              type="button"
              onClick={() => onSelect(node.path)}
              style={{
                background: node.path === selectedPath ? "#004d14" : "none",
                color: "#00ff41", border: "none", cursor: "pointer",
                fontFamily: "inherit", textAlign: "left", width: "100%", padding: 2,
              }}
            >
              {node.name}
            </button>
          ) : (
            <>
              <span style={{ color: "#00bb30" }}>{node.name}</span>
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
