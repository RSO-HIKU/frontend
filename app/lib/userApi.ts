import { getServiceUrl } from "./appConfig";

export type UserProfileDto = {
  id: string;
  username: string;
  email?: string;
    age?: number;
    fullName?: string;
    bio?: string;

};

export async function fetchUserProfile(userId: string): Promise<UserProfileDto> {
  const baseUrl = getServiceUrl("user-service");
  const res = await fetch(`${baseUrl}/user-service/user/${encodeURIComponent(userId)}`);
 
  if (!res.ok) throw new Error(`User fetch failed: ${res.status}`);
  return res.json();
}
export async function updateUserProfile(userId: string, data: Partial<UserProfileDto>): Promise<UserProfileDto> {
  const baseUrl = getServiceUrl("user-service");
  const res = await fetch(`${baseUrl}/user-service/user/${encodeURIComponent(userId)}`, {
    method: "PATCH", // <--- change to PATCH
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`User update failed: ${res.status}`);
  return res.json();
}
export async function fetchFollowers(userId: string): Promise<UserProfileDto[]> {
  const baseUrl = getServiceUrl("user-service");
  const res = await fetch(`${baseUrl}/user-service/user/${userId}/followers`);
  if (!res.ok) throw new Error("Failed to fetch followers");
  console.log("Fetched followers response:", res);
  return res.json();
}

export async function fetchFollowing(userId: string): Promise<UserProfileDto[]> {
  const baseUrl = getServiceUrl("user-service");
  const res = await fetch(`${baseUrl}/user-service/user/${userId}/following`);
  if (!res.ok) throw new Error("Failed to fetch following");
  return res.json();
}
