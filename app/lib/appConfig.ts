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
