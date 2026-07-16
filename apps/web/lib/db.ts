import Dexie, { type Table } from "dexie";
import type { ProjectState } from "@sdd/engine";

export interface Project {
  id: string;
  name: string;
  state: ProjectState;
  createdAt: number;
  updatedAt: number;
}

class SddDatabase extends Dexie {
  projects!: Table<Project, string>;
  constructor() {
    super("sdd-terminal");
    this.version(1).stores({ projects: "id, updatedAt" });
  }
}

export const db = new SddDatabase();
