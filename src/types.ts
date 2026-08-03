export interface Project {
  id?: number;
  title: string;
  clientName: string;
  scriptVersion: string;
  date: string;
  shootingDay: string;
  callTime?: string;
  location: string;
  director: string;
  producer: string;
  dp: string;
  ad: string;
  sound: string;
  gaffer: string;
  equipmentNotes?: string;
  status?: 'active' | 'completed';
  // Tahap 1: Core Storytelling (Premis & Pesan)
  premise?: string;
  mainCharacter?: string;
  mainConflict?: string;
  emotionalMessage?: string;
  // Tahap 2: Sinopsis / Outline Alur
  synopsis?: string;
  outlineBeginning?: string;
  outlineMiddle?: string;
  outlineEnd?: string;
}

export interface Scene {
  id?: number;
  projectId: number;
  sceneNumber: string;
  locationType: 'INT' | 'EXT' | 'INT/EXT';
  time: 'DAY' | 'NIGHT' | 'DAWN' | 'DUSK';
  actionText: string;
  order: number;
}

export interface Shot {
  id?: number;
  sceneId: number;
  projectId: number;
  shotType: string;
  cameraAngle: string;
  movement: string;
  focalLength: string;
  frameRate: string;
  rig: string;
  lightingNotes: string;
  audioNotes: string;
  audioBlob?: ArrayBuffer | null;
  imageBlob?: ArrayBuffer | null;
  order: number;
  taken?: boolean;
}
