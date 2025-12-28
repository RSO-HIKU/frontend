export type GeometryDto = {
  type: "LineString";
  coordinates: number[][];
};

export type TrailDto = {
  id: number;
  name: string;
  lengthKm?: number | null;
  sourceFile?: string | null;
  geometry: GeometryDto;
};

export type TrailFeature = {
  type: "Feature";
  geometry: GeometryDto;
  properties: { name: string; color?: string; lengthKm?: number };
};

export type TrailFeatureCollection = {
  type: "FeatureCollection";
  features: TrailFeature[];
};
