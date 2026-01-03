// Lightweight API helpers for frontend
// Fetch trails/peaks with optional search query from peaks-hikes-service

import type { TrailDto } from "../types/trails";
import type { PeakDto } from "../types/peaks";

export type LineStringGeometryDto = {
  type: "LineString";
  coordinates: number[][]; // [lon, lat][]
};

export type PointGeometryDto = {
  type: "Point";
  coordinates: number[]; // [lon, lat]
};

export type GeometryDto = LineStringGeometryDto | PointGeometryDto;

export async function fetchTrails(baseUrl: string, searchQuery?: string): Promise<TrailDto[]> {
  let url = `${baseUrl}/peaks-hikes/gettrails`;
  if (searchQuery && searchQuery.trim() !== "") {
    url += `?query=${encodeURIComponent(searchQuery)}`;
  }
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Trails fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchPeaks(baseUrl: string, searchQuery?: string): Promise<PeakDto[]> {
  let url = `${baseUrl}/peaks-hikes/getpeaks`;
  if (searchQuery && searchQuery.trim() !== "") {
    url += `?query=${encodeURIComponent(searchQuery)}`;
  }
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Peaks fetch failed: ${res.status}`);
  return res.json();
}

// Re-export PeakDto for consumers that import from lib/api
export type { PeakDto };

