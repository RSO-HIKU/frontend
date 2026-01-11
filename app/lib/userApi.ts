import { getServiceUrl } from "./appConfig";
import { authFetch } from "./authFetch";

export type UserProfileDto = {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  bio?: string;
};

export type CreateUserDto = {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
};

const API_URL = getServiceUrl("/api/user");

export async function checkUserExists(userId: string, getToken?: () => Promise<string | null>): Promise<boolean> {
  try {
    const res = await authFetch(`${API_URL}/user/${encodeURIComponent(userId)}`, { method: "GET" }, getToken);
    return res.ok;
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false;
  }
}

export async function createUserProfile(userData: CreateUserDto, getToken?: () => Promise<string | null>): Promise<UserProfileDto> {
  try {
    console.log("Creating user with data:", userData);
    const res = await authFetch(`${API_URL}/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
    
      },
      body: JSON.stringify(userData),
    }, getToken);

    console.log("Create user response status:", res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`User creation failed with status ${res.status}:`, errorText);
      throw new Error(`User creation failed: ${res.status}`);
    }

    const user = await res.json();
    console.log("User created successfully:", user);
    return user;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

export async function fetchUserProfile(userId: string, getToken?: () => Promise<string | null>): Promise<UserProfileDto> {
  const res = await authFetch(`${API_URL}/user/${encodeURIComponent(userId)}`, { method: "GET" }, getToken);
 
  if (!res.ok) throw new Error(`User fetch failed: ${res.status}`);
  return res.json();
}
export async function updateUserProfile(userId: string, data: Partial<UserProfileDto>, getToken?: () => Promise<string | null>): Promise<UserProfileDto> {
  const res = await authFetch(`${API_URL}/user/${encodeURIComponent(userId)}`, {
    method: "PATCH", // <--- change to PATCH
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }, getToken);

  if (!res.ok) throw new Error(`User update failed: ${res.status}`);
  return res.json();
}
export async function fetchFollowers(userId: string, getToken?: () => Promise<string | null>): Promise<UserProfileDto[]> {
  const res = await authFetch(`${API_URL}/user/${encodeURIComponent(userId)}/followers`, { method: "GET" }, getToken);
  if (!res.ok) throw new Error("Failed to fetch followers");
  console.log("Fetched followers response:", res);
  return res.json();
}

export async function fetchFollowing(userId: string, getToken?: () => Promise<string | null>): Promise<UserProfileDto[]> {
  const res = await authFetch(`${API_URL}/user/${encodeURIComponent(userId)}/following`, { method: "GET" }, getToken);
  if (!res.ok) throw new Error("Failed to fetch following");
  return res.json();
}


export const searchUsers = async (query: string, getToken?: () => Promise<string | null>): Promise<UserProfileDto[]> => {
  const response = await authFetch(`${API_URL}/user/search?search=${encodeURIComponent(query)}`, { method: "GET" }, getToken);
  if (!response.ok) throw new Error("Failed to search users");
  return await response.json();
};

export const followUser = async (followerId: string, followingId: string, getToken?: () => Promise<string | null>): Promise<void> => {
  const response = await authFetch(`${API_URL}/user/${followerId}/follow/${followingId}`, {
    method: "POST",
  }, getToken);
  if (!response.ok) throw new Error("Failed to follow user");
};

export const unfollowUser = async (followerId: string, followingId: string, getToken?: () => Promise<string | null>): Promise<void> => {
  const response = await authFetch(`${API_URL}/user/${followerId}/follow/${followingId}`, {
    method: "DELETE",
  }, getToken);
  if (!response.ok) throw new Error("Failed to unfollow user");
};

