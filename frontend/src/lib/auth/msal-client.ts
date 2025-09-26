import { type Configuration, LogLevel } from "@azure/msal-browser"

export function buildMsalConfig(args: {
  clientId: string
  tenantId: string
  redirectUri: string
  postLogoutRedirectUri?: string
}): Configuration {
  return {
    auth: {
      clientId: args.clientId,
      authority: `https://login.microsoftonline.com/${args.tenantId}`,
      redirectUri: args.redirectUri,
      postLogoutRedirectUri: args.postLogoutRedirectUri ?? args.redirectUri,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: true,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return
          switch (level) {
            case LogLevel.Error:
              console.error("MSAL Error:", message)
              break
            case LogLevel.Warning:
              console.warn("MSAL Warning:", message)
              break
            case LogLevel.Info:
              console.info("MSAL Info:", message)
              break
          }
        },
        logLevel: LogLevel.Info,
      },
    },
  }
}

export function buildLoginRequest(clientId: string) {
  return {
    scopes: [
      "User.Read",
      "Files.ReadWrite.All",
      `api://${clientId}/access_as_user`,
    ],
  }
}

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphDriveEndpoint: "https://graph.microsoft.com/v1.0/me/drive",
}
