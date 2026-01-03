import type { TrailDto } from "../types/trails";
import type { PeakDto } from "../types/peaks";

export type LineStringGeometryDto = {
  type: "LineString";
  coordinates: number[][];
};

export type PointGeometryDto = {
  type: "Point";
  coordinates: number[];
};

export type GeometryDto = LineStringGeometryDto | PointGeometryDto;

type GetTokenFn = () => Promise<string | null> | string | null;

function withQuery(url: string, searchQuery?: string) {
  if (searchQuery && searchQuery.trim() !== "") {
    return `${url}?query=${encodeURIComponent(searchQuery)}`;
  }
  return url;
}

async function authFetch(url: string, getToken?: GetTokenFn) {
  const headers: Record<string, string> = {};
  if (getToken) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { method: "GET", headers });
  return res;
}

export function createApi(baseUrl: string, getToken?: GetTokenFn) {
  return {
    async fetchTrails(searchQuery?: string): Promise<TrailDto[]> {
      const url = withQuery(`${baseUrl}/peaks-hikes/gettrails`, searchQuery);
      const res = await authFetch(url, getToken);
      if (!res.ok) throw new Error(`Trails fetch failed: ${res.status}`);
      return res.json();
    },

    async fetchPeaks(searchQuery?: string): Promise<PeakDto[]> {
      const url = withQuery(`${baseUrl}/peaks-hikes/getpeaks`, searchQuery);
      const res = await authFetch(url, getToken);
      if (!res.ok) throw new Error(`Peaks fetch failed: ${res.status}`);
      return res.json();
    },
  };
}

// Re-export PeakDto for consumers that import from lib/api
export type { PeakDto };
