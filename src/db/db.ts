import Dexie, { type Table } from 'dexie';
import { Project, Scene, Shot } from '../types';

export class PreProductionDB extends Dexie {
  projects!: Table<Project, number>;
  scenes!: Table<Scene, number>;
  shots!: Table<Shot, number>;

  constructor() {
    super('PreProductionDB');
    this.version(1).stores({
      projects: '++id, title, date',
      scenes: '++id, projectId, sceneNumber, order',
      shots: '++id, sceneId, projectId, order'
    });
  }
}

export const db = new PreProductionDB();

// Helper to check if any project exists and return its ID, otherwise return null
export async function ensureDefaultProject() {
  const firstProject = await db.projects.orderBy('id').first();
  return firstProject?.id || null;
}

