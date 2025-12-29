import { getServiceUrl } from "./appConfig";

export type UserProfileDto = {
  id: string;
  name: string;
  email?: string;

};

export async function fetchUserProfile(userId: string): Promise<UserProfileDto> {
  const baseUrl = getServiceUrl("user-service");
  const res = await fetch(`${baseUrl}/user-service/user/${encodeURIComponent(userId)}`);
 
  if (!res.ok) throw new Error(`User fetch failed: ${res.status}`);
  return res.json();
}
