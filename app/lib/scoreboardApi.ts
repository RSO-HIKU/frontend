import { appConfig, getServiceUrl } from "./appConfig";

export interface Challenge {
  id: number;
  title: string;
  description: string;
  month: number;
  year: number;
  completed?: boolean;
}

export interface ScoreboardEntry {
  userId: string;
  completedChallenges?: number;
  badgeCount?: number;
}
const API_URL = getServiceUrl("/api/scoreboards-challenges");
const BASE_URL = `${API_URL}/scoreboards-challenges`;

async function authFetch(url: string, options: RequestInit = {}, getToken?: () => Promise<string | null>) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  };

  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, { ...options, headers });
  return response;
}

export const scoreboardApi = {
  async getChallenges(userId?: string, getToken?: () => Promise<string | null>): Promise<Challenge[]> {
    const url = userId 
      ? `${BASE_URL}/challenges?userId=${userId}`
      : `${BASE_URL}/challenges`;
    const res = await authFetch(url, { method: "GET" }, getToken);
    if (!res.ok) throw new Error(`Failed to fetch challenges: ${res.status}`);
    return res.json();
  },

  async completeChallenge(
    userId: string,
    challengeId: number,
    getToken?: () => Promise<string | null>
  ): Promise<any> {
    const url = `${BASE_URL}/challenges/complete`;
    const res = await authFetch(
      url,
      {
        method: "POST",
        body: JSON.stringify({ userId, challengeId }),
      },
      getToken
    );
    if (!res.ok) throw new Error(`Failed to complete challenge: ${res.status}`);
    return res.json();
  },

  async getChallengeScoreboard(
    month?: number,
    year?: number,
    limit: number = 10,
    getToken?: () => Promise<string | null>
  ): Promise<ScoreboardEntry[]> {
    let url = `${BASE_URL}/scoreboard/challenges?limit=${limit}`;
    if (month && year) {
      url += `&month=${month}&year=${year}`;
    }
    const res = await authFetch(url, { method: "GET" }, getToken);
    if (!res.ok) throw new Error(`Failed to fetch challenge scoreboard: ${res.status}`);
    return res.json();
  },

  async getBadgeScoreboard(
    userIds: string[],
    month?: number,
    year?: number,
    getToken?: () => Promise<string | null>
  ): Promise<ScoreboardEntry[]> {
    const url = `${BASE_URL}/scoreboard/badges`;
    const body: any = { userIds };
    if (month) body.month = month;
    if (year) body.year = year;

    const res = await authFetch(
      url,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      getToken
    );
    if (!res.ok) throw new Error(`Failed to fetch badge scoreboard: ${res.status}`);
    return res.json();
  },
};
