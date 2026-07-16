"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectState } from "@sdd/engine";
import { getProject, updateProject } from "../lib/projects";
import type { Project } from "../lib/db";
import { setPath } from "../lib/set-path";

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [state, setState] = useState<ProjectState | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<ProjectState | null>(null);

  useEffect(() => {
    let active = true;
    getProject(id).then((p) => {
      if (!active) return;
      setProject(p ?? null);
      setState(p?.state ?? null);
      latest.current = p?.state ?? null;
      setLoading(false);
    });
    return () => {
      active = false;
      if (timer.current) {
        clearTimeout(timer.current);
        if (latest.current) void updateProject(id, { state: latest.current }); // flush
      }
    };
  }, [id]);

  const scheduleSave = useCallback(
    (next: ProjectState) => {
      latest.current = next;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void updateProject(id, { state: next });
      }, 400);
    },
    [id],
  );

  const update = useCallback(
    (path: string, value: unknown) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = setPath(prev, path, value);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const updateList = useCallback(
    (path: string, index: number, key: string, value: unknown) => {
      update(`${path}.${index}.${key}`, value);
    },
    [update],
  );

  return { project, state, update, updateList, loading };
}
