export const ENV = {
  appId: process.env.VITE_APP_ID ?? "hotel-tv-system",
  cookieSecret: process.env.JWT_SECRET ?? "hotel-tv-system-secret",
  isProduction: process.env.NODE_ENV === "production",
};
