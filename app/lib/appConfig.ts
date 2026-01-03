// AppConfig.ts

export const AppConfig = {
  environment: process.env.NODE_ENV || "development",
  services: {
    "user-service": "http://localhost:8083",
    "social-feed-service": "http://localhost:8091",
  } as const, // make keys readonly literals
};

// Type for service names
export type ServiceName = keyof typeof AppConfig.services;

// Helper function with proper typing
export const getServiceUrl = (serviceName: ServiceName): string => {
  return AppConfig.services[serviceName];
};

export const appConfig = {
  env: process.env.EXPO_PUBLIC_ENV ?? "dev",
  keycloak: {
    url: process.env.EXPO_PUBLIC_KEYCLOAK_URL!,      // e.g. http://localhost:8080/auth (dev)
    realm: process.env.EXPO_PUBLIC_KEYCLOAK_REALM!,  // e.g. hiku-dev
    clientId: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID ?? "hiku-web",
  },
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL!, // e.g. http://127.0.0.1:63053
};
