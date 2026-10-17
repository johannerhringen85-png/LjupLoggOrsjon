export interface DepthPoint {
  id: string;
  lat: number;
  lng: number;
  seconds: number;
  weight_g: number;
  date: string;
  time: string;
  note?: string;
}

export interface CalculatedPoint extends DepthPoint {
  calculatedDepth: number;
}

export type FishSpecies = 'Abborre' | 'Gädda' | 'Gös' | 'Öring' | 'Annan';

export interface FishCatch {
  id: string;
  lat: number;
  lng: number;
  species: FishSpecies;
  length_cm?: number;
  weight_kg?: number;
  depth_m: number;
  date: string;
  time: string;
  lure?: string; // T.ex. Jigg, Vobbler, Dropshot, Spinner
  note?: string;
}

export interface BoatPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
  speedKnots?: number | null;
  timestamp: number;
}

export type MapTileProvider = 'dark' | 'satellite' | 'street' | 'topo';

export interface DepthStats {
  totalPoints: number;
  maxDepth: number;
  minDepth: number;
  avgDepth: number;
  deepSpotsCount: number; // e.g. > 6m
  shallowSpotsCount: number; // e.g. < 2m
}

export interface LakePreset {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  description: string;
}
