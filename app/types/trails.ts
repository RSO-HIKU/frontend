export type GeometryDto = {
  type: "LineString";
  coordinates: number[][];
};

export type PointGeometryDto = {
  type: "Point";
  coordinates: number[];
};

export type TrailDto = {
  id: number;
  name: string;
  lengthKm?: number | null;
  sourceFile?: string | null;
  geometry: GeometryDto;
};

export type PeakDto = {
  id: number;
  name: string;
  territory?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  elevationM?: number | null;
  geometry: PointGeometryDto;
};

export type TrailFeature = {
  type: "Feature";
  geometry: GeometryDto;
  properties: { name: string; color?: string; lengthKm?: number };
};

export type PeakFeature = {
  type: "Feature";
  geometry: PointGeometryDto;
  properties: { 
    id: number;
    name: string;
    territory?: string;
    latitude?: number;
    longitude?: number;
    elevationM?: number;
  };
};

export type TrailFeatureCollection = {
  type: "FeatureCollection";
  features: TrailFeature[];
};

export type PeakFeatureCollection = {
  type: "FeatureCollection";
  features: PeakFeature[];
};
