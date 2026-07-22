import Dexie, { type Table } from "dexie";
import type { ProjectState } from "@sdd/engine";

export interface Project {
  id: string;
  name: string;
  state: ProjectState;
  createdAt: number;
  updatedAt: number;
}

/** Registro chave-valor para configurações globais (ex.: config de IA). */
export interface Setting {
  key: string;
  value: unknown;
}

class SddDatabase extends Dexie {
  projects!: Table<Project, string>;
  settings!: Table<Setting, string>;
  constructor() {
    super("sdd-terminal");
    this.version(1).stores({ projects: "id, updatedAt" });
    this.version(2).stores({ projects: "id, updatedAt", settings: "key" });
  }
}

export const db = new SddDatabase();
