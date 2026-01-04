import { getServiceUrl } from "./appConfig";

export type UserProfileDto = {
  id: string;
  username: string;
  email?: string;
    age?: number;
    fullName?: string;
    bio?: string;

};
const API_URL = getServiceUrl("/api/user");

export async function fetchUserProfile(userId: string): Promise<UserProfileDto> {
  const res = await fetch(`${API_URL}/user/${encodeURIComponent(userId)}`);
 
  if (!res.ok) throw new Error(`User fetch failed: ${res.status}`);
  return res.json();
}
export async function updateUserProfile(userId: string, data: Partial<UserProfileDto>): Promise<UserProfileDto> {
  const res = await fetch(`${API_URL}/user/${encodeURIComponent(userId)}`, {
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
  const res = await fetch(`${API_URL}/user/${encodeURIComponent(userId)}/followers`);
  if (!res.ok) throw new Error("Failed to fetch followers");
  console.log("Fetched followers response:", res);
  return res.json();
}

export async function fetchFollowing(userId: string): Promise<UserProfileDto[]> {
  const res = await fetch(`${API_URL}/user/${encodeURIComponent(userId)}/following`);
  if (!res.ok) throw new Error("Failed to fetch following");
  return res.json();
}


export const searchUsers = async (query: string): Promise<UserProfileDto[]> => {
  const response = await fetch(`${API_URL}/user/search?search=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Failed to search users");
  return await response.json();
};

export const followUser = async (followerId: string, followingId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/user/${followerId}/follow/${followingId}`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to follow user");
};

export const unfollowUser = async (followerId: string, followingId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/user/${followerId}/follow/${followingId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to unfollow user");
};

