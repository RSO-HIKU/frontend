export type PeakGeometryDto = {
  type: "Point";
  coordinates: number[]; // [lon, lat]
};

export type PeakDto = {
  id: number;
  name: string;
  territory?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  elevationM?: number | null;
  geometry: PeakGeometryDto;
};

export type PeakFeature = {
  type: "Feature";
  geometry: PeakGeometryDto;
  properties: { name: string; color?: string; elevation?: number; territory?: string };
};

export type LogbookEntry = {
  id: number;
  peakId?: number;
  peakName: string;
  elevation?: number;
  territory?: string;
  addedAt: string;
  notes?: string;
};
