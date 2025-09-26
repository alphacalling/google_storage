import { type Configuration, LogLevel } from "@azure/msal-browser";
import { VITE_AZURE_CLIENT_ID } from "./env"

export const msalConfig = (tenantId: string, clientId: string): Configuration => ({
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message) => {
        if (level === LogLevel.Error) console.error(message);
      },
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
    },
  },
});

export const graphScopes = [`api://${VITE_AZURE_CLIENT_ID}/user`];