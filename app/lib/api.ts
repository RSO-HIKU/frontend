// Lightweight API helpers for frontend
// Fetch trails with optional search query from peaks-hikes-service

export type GeometryDto = {
  type: "LineString";
  coordinates: number[][]; // [lon, lat]
};

export type TrailDto = {
  id: number;
  name: string;
  lengthKm?: number | null;
  sourceFile?: string | null;
  geometry: GeometryDto;
};

export async function fetchTrails(baseUrl: string, searchQuery?: string): Promise<TrailDto[]> {
  let url = `${baseUrl}/peaks-hikes/gettrails`;
  if (searchQuery && searchQuery.trim() !== "") {
    url += `?query=${encodeURIComponent(searchQuery)}`;
  }
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Trails fetch failed: ${res.status}`);
  return res.json();
}
