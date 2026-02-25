import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { subscriptionsRouter } from "./routers/subscriptions";
import { publicProcedure, router } from "./_core/trpc";
import { tvChannelsRouter } from "./routers/tvChannels";
import { roomsRouter } from "./routers/rooms";
import { menuItemsRouter } from "./routers/menuItems";
import { backgroundImagesRouter } from "./routers/backgroundImages";
import { guestInfoRouter } from "./routers/guestInfo";
import { mediaUploadRouter } from "./routers/mediaUpload";
import { settingsRouter } from "./routers/settings";
import { localizationRouter } from "./routers/localization";
import { publicApiRouter } from "./routers/publicApi";
import { analyticsRouter } from "./routers/analytics";
import { activityLogsRouter } from "./routers/activityLogs";
import { hotelsRouter } from "./routers/hotels";
import { syncRouter } from "./routers/sync";
import { devicesRouter } from "./routers/devices";
import { authRouter } from "./routers/auth";
import { pairingRouter } from "./routers/pairing";
import { tvAppsRouter } from "./routers/tvApps";
import { guestServicesRouter } from "./routers/guestServices";
import { wakeUpCallsRouter } from "./routers/wakeUpCalls";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  subscriptions: subscriptionsRouter,
  auth: authRouter,
  pairing: pairingRouter,

  // Hotel TV System routers
  hotels: hotelsRouter,
  tvChannels: tvChannelsRouter,
  rooms: roomsRouter,
  menuItems: menuItemsRouter,
  backgroundImages: backgroundImagesRouter,
  guestInfo: guestInfoRouter,
  mediaUpload: mediaUploadRouter,
  settings: settingsRouter,
  localization: localizationRouter,
  publicApi: publicApiRouter,
  analytics: analyticsRouter,
  activityLogs: activityLogsRouter,
  sync: syncRouter,
  devices: devicesRouter,
  tvApps: tvAppsRouter,
  guestServices: guestServicesRouter,
  wakeUpCalls: wakeUpCallsRouter,
});

export type AppRouter = typeof appRouter;
