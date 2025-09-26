"use client";
import { devLog } from "@/lib/utils/dev-log";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { buildMsalConfig, buildLoginRequest } from "@/lib/auth/msal-client";
import { LoadingSpinner } from "./loading-spinner";

interface AuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: (forBlob?: boolean) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [msalInstance, setMsalInstance] =
    useState<PublicClientApplication | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loginRequest, setLoginRequest] = useState<{ scopes: string[] }>({
    scopes: ["User.Read"],
  });

  useEffect(() => {
    const init = async () => {
      try {
        devLog("🚀 Loading auth config from environment...");

        const clientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID;
        const tenantId = import.meta.env.VITE_AZURE_AD_TENANT_ID;

        const origin = window.location.origin;

        setDebugInfo({
          origin,
          hasClientId: !!clientId,
          hasTenantId: !!tenantId,
          hasStorageConnection: false,
          hasContainerPrefix: false,
          hasAccountName: false,
          hasAccountKey: false,
        });

        if (!clientId || !tenantId) {
          throw new Error(
            "Azure AD environment variables are not set. Please configure NEXT_PUBLIC_AZURE_AD_CLIENT_ID and NEXT_PUBLIC_AZURE_AD_TENANT_ID."
          );
        }

        devLog("✅ Config validation passed, loading MSAL...");
        const { PublicClientApplication } = await import("@azure/msal-browser");

        const instance = new PublicClientApplication(
          buildMsalConfig({
            clientId,
            tenantId,
            redirectUri: origin,
            postLogoutRedirectUri: origin,
          })
        );

        setLoginRequest(buildLoginRequest(clientId));

        await instance.initialize();
        devLog("✅ MSAL initialized successfully");
        setMsalInstance(instance);

        const result = await instance.handleRedirectPromise();
        if (result?.account) {
          devLog(
            "🎉 User authenticated via redirect:",
            result.account.username
          );
          setUser(result.account);
          setIsAuthenticated(true);
        } else {
          const accounts = instance.getAllAccounts();
          if (accounts.length) {
            devLog("✅ Using existing account:", accounts[0].username);
            setUser(accounts[0]);
            setIsAuthenticated(true);
          } else {
            devLog("ℹ️ No existing accounts found");
          }
        }
      } catch (err) {
        console.error("💥 MSAL init error:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Login
  const login = async () => {
    if (!msalInstance) {
      setError("MSAL not initialized");
      return;
    }
    try {
      setError(null);
      devLog("🔐 Starting login redirect...");
      await msalInstance.loginRedirect(loginRequest);
    } catch (err) {
      console.error("💥 Login failed:", err);
      setError(
        `Login failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  // Logout
  const logout = async () => {
    if (!msalInstance) return;
    try {
      devLog("👋 Logging out...");
      await msalInstance.logoutRedirect();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Get access token
  const getAccessToken = async (forBlob = false): Promise<string> => {
    if (!msalInstance || !user) throw new Error("Not authenticated");
    const scopes = forBlob
      ? [
          `api://${
            msalInstance.getConfiguration().auth.clientId
          }/access_as_user`,
        ]
      : loginRequest.scopes;
    try {
      const response = await msalInstance.acquireTokenSilent({
        scopes,
        account: user,
      });
      return response.accessToken;
    } catch (err) {
      console.error("Token acquisition failed:", err);
      throw err;
    }
  };

  /** --------------------------
   * NEW: Sync logged-in user with backend
   * -------------------------- */
  useEffect(() => {
    const syncUserWithBackend = async (account: AccountInfo) => {
      if (!account || !msalInstance) return;

      try {
        // Acquire ID token
        const response = await msalInstance.acquireTokenSilent({
          account,
          scopes: ["openid", "profile", "email", "User.Read"],
        });

        const idToken = response?.idToken;
        if (!idToken) return;

        // Send token to backend to insert/update user
        const res = await fetch("/api/v1/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        const data = await res.json();
        devLog("📤 Backend user sync:", data);
      } catch (err) {
        console.error("❌ Error syncing user to backend:", err);
      }
    };

    if (user) syncUserWithBackend(user);
  }, [user, msalInstance]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Initializing authentication...
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Check console for detailed logs
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Configuration Error
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Unable to initialize authentication
              </p>
            </div>
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
              <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">
                Authentication Error
              </h3>
              <p className="text-red-700 dark:text-red-400 text-sm font-mono mb-3">
                {error}
              </p>
              {debugInfo && (
                <div className="text-xs text-red-600 dark:text-red-500">
                  <p className="font-semibold mb-1">Debug Info:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Origin: {debugInfo.origin}</li>
                    <li>
                      Client ID:{" "}
                      {debugInfo.hasClientId ? "✅ Set" : "❌ Missing"}
                    </li>
                    <li>
                      Tenant ID:{" "}
                      {debugInfo.hasTenantId ? "✅ Set" : "❌ Missing"}
                    </li>
                    <li>
                      Storage Connection:{" "}
                      {debugInfo.hasStorageConnection ? "✅ Set" : "❌ Missing"}
                    </li>
                    <li>
                      Container Prefix:{" "}
                      {debugInfo.hasContainerPrefix ? "✅ Set" : "❌ Missing"}
                    </li>
                    <li>
                      Account Name:{" "}
                      {debugInfo.hasAccountName ? "✅ Set" : "❌ Missing"}
                    </li>
                    <li>
                      Account Key:{" "}
                      {debugInfo.hasAccountKey ? "✅ Set" : "❌ Missing"}
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Retry
            </button>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <p>🔧 Check browser console (F12) for detailed logs</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// "use client"
// import { devLog } from "@/lib/utils/dev-log"

// import type React from "react"
// import { createContext, useContext, useEffect, useState } from "react"
// import type { PublicClientApplication, AccountInfo } from "@azure/msal-browser"
// import { buildMsalConfig, buildLoginRequest } from "@/lib/auth/msal-client"
// import { LoadingSpinner } from "./loading-spinner"

// interface AuthContextType {
//   isAuthenticated: boolean
//   user: AccountInfo | null
//   login: () => Promise<void>
//   logout: () => Promise<void>
//   getAccessToken: (forBlob?: boolean) => Promise<string>
// }

// const AuthContext = createContext<AuthContextType | null>(null)

// export function useAuth() {
//   const context = useContext(AuthContext)
//   if (!context) {
//     throw new Error("useAuth must be used within AuthProvider")
//   }
//   return context
// }

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null)
//   const [isAuthenticated, setIsAuthenticated] = useState(false)
//   const [user, setUser] = useState<AccountInfo | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [debugInfo, setDebugInfo] = useState<any>(null)
//   const [loginRequest, setLoginRequest] = useState<{ scopes: string[] }>({
//     scopes: ["User.Read"],
//   })

//   useEffect(() => {
//     const init = async () => {
//       try {
//         devLog("🚀 Loading auth config from environment...")

//         const clientId = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID
//         const tenantId = process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID
//         const origin = window.location.origin

//         setDebugInfo({
//           origin,
//           hasClientId: !!clientId,
//           hasTenantId: !!tenantId,
//           hasStorageConnection: false,
//           hasContainerPrefix: false,
//           hasAccountName: false,
//           hasAccountKey: false,
//         })

//         if (!clientId || !tenantId) {
//           throw new Error("Azure AD environment variables are not set. Please configure NEXT_PUBLIC_AZURE_AD_CLIENT_ID and NEXT_PUBLIC_AZURE_AD_TENANT_ID.")
//         }

//         devLog("✅ Config validation passed, loading MSAL...")

//         const { PublicClientApplication } = await import("@azure/msal-browser")

//         const instance = new PublicClientApplication(
//           buildMsalConfig({
//             clientId,
//             tenantId,
//             redirectUri: origin,
//             postLogoutRedirectUri: origin,
//           }),
//         )

//         setLoginRequest(buildLoginRequest(clientId))

//         await instance.initialize()
//         devLog("✅ MSAL initialized successfully")
//         setMsalInstance(instance)

//         // 3. Handle redirect / existing sessions
//         const result = await instance.handleRedirectPromise()
//         if (result?.account) {
//           devLog("🎉 User authenticated via redirect:", result.account.username)
//           setUser(result.account)
//           setIsAuthenticated(true)
//         } else {
//           const accounts = instance.getAllAccounts()
//           if (accounts.length) {
//             devLog("✅ Using existing account:", accounts[0].username)
//             setUser(accounts[0])
//             setIsAuthenticated(true)
//           } else {
//             devLog("ℹ️ No existing accounts found")
//           }
//         }
//       } catch (err) {
//         console.error("💥 MSAL init error:", err)
//         setError(err instanceof Error ? err.message : String(err))
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     init()
//   }, [])

//   const login = async () => {
//     if (!msalInstance) {
//       setError("MSAL not initialized")
//       return
//     }

//     try {
//       setError(null)
//       devLog("🔐 Starting login redirect...")
//       await msalInstance.loginRedirect(loginRequest)
//     } catch (error) {
//       console.error("💥 Login failed:", error)
//       setError(`Login failed: ${error instanceof Error ? error.message : String(error)}`)
//     }
//   }

//   const logout = async () => {
//     if (!msalInstance) return

//     try {
//       devLog("👋 Logging out...")
//       await msalInstance.logoutRedirect()
//       setUser(null)
//       setIsAuthenticated(false)
//     } catch (error) {
//       console.error("Logout failed:", error)
//     }
//   }

//   const getAccessToken = async (forBlob = false): Promise<string> => {
//     if (!msalInstance || !user) {
//       throw new Error("Not authenticated")
//     }

//     const scopes = forBlob
//       ? [`api://${msalInstance.getConfiguration().auth.clientId}/access_as_user`]
//       : loginRequest.scopes

//     try {
//       const response = await msalInstance.acquireTokenSilent({
//         scopes,
//         account: user,
//       })
//       return response.accessToken
//     } catch (error) {
//       console.error("Token acquisition failed:", error)
//       throw error
//     }
//   }

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <LoadingSpinner />
//           <p className="mt-4 text-gray-600 dark:text-gray-400">Initializing authentication...</p>
//           <p className="mt-2 text-xs text-gray-500">Check console for detailed logs</p>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-slate-900 dark:to-slate-800">
//         <div className="max-w-md w-full mx-4">
//           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
//             <div className="mb-8">
//               <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                 <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
//                   <path
//                     fillRule="evenodd"
//                     d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//               </div>
//               <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Configuration Error</h1>
//               <p className="text-gray-600 dark:text-gray-300">Unable to initialize authentication</p>
//             </div>

//             <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
//               <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">Authentication Error</h3>
//               <p className="text-red-700 dark:text-red-400 text-sm font-mono mb-3">{error}</p>

//               {debugInfo && (
//                 <div className="text-xs text-red-600 dark:text-red-500">
//                   <p className="font-semibold mb-1">Debug Info:</p>
//                   <ul className="list-disc list-inside space-y-1">
//                     <li>Origin: {debugInfo.origin}</li>
//                     <li>Client ID: {debugInfo.hasClientId ? "✅ Set" : "❌ Missing"}</li>
//                     <li>Tenant ID: {debugInfo.hasTenantId ? "✅ Set" : "❌ Missing"}</li>
//                     <li>Storage Connection: {debugInfo.hasStorageConnection ? "✅ Set" : "❌ Missing"}</li>
//                     <li>Container Prefix: {debugInfo.hasContainerPrefix ? "✅ Set" : "❌ Missing"}</li>
//                     <li>Account Name: {debugInfo.hasAccountName ? "✅ Set" : "❌ Missing"}</li>
//                     <li>Account Key: {debugInfo.hasAccountKey ? "✅ Set" : "❌ Missing"}</li>
//                   </ul>
//                 </div>
//               )}
//             </div>

//             <button
//               onClick={() => window.location.reload()}
//               className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
//             >
//               Retry
//             </button>

//             <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
//               <p>🔧 Check browser console (F12) for detailed logs</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <AuthContext.Provider
//       value={{
//         isAuthenticated,
//         user,
//         login,
//         logout,
//         getAccessToken,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   )
// }
