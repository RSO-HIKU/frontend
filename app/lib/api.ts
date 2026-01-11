import type { TrailDto } from "../types/trails";
import type { PeakDto } from "../types/peaks";
import { getServiceUrl } from "./appConfig";
import { authFetch } from "./authFetch";

export type LineStringGeometryDto = {
  type: "LineString";
  coordinates: number[][];
};

export type PointGeometryDto = {
  type: "Point";
  coordinates: number[];
};

export type GeometryDto = LineStringGeometryDto | PointGeometryDto;

const API_URL = getServiceUrl("/api/peaks-hikes");

export async function fetchTrails(searchQuery?: string, getToken?: () => Promise<string | null>): Promise<TrailDto[]> {
  const url = searchQuery && searchQuery.trim() !== "" 
    ? `${API_URL}/gettrails?query=${encodeURIComponent(searchQuery)}`
    : `${API_URL}/gettrails`;
  
  const res = await authFetch(url, { method: "GET" }, getToken);
  if (!res.ok) throw new Error(`Trails fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchPeaks(searchQuery?: string, getToken?: () => Promise<string | null>): Promise<PeakDto[]> {
  const url = searchQuery && searchQuery.trim() !== "" 
    ? `${API_URL}/getpeaks?query=${encodeURIComponent(searchQuery)}`
    : `${API_URL}/getpeaks`;
  
  const res = await authFetch(url, { method: "GET" }, getToken);
  if (!res.ok) throw new Error(`Peaks fetch failed: ${res.status}`);
  return res.json();
}

// Re-export PeakDto for consumers that import from lib/api
export type { PeakDto };
