export async function authFetch(url: string, options: RequestInit = {}, getToken?: () => Promise<string | null>) {
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