// import { useMsal } from "@azure/msal-react";
// import {
//   InteractionRequiredAuthError,
//   type SilentRequest,
// } from "@azure/msal-browser";
// import { graphScopes } from "@/config/msalConfig";

// export const useMsalAuth = () => {
//   const { instance, accounts } = useMsal();

// const login = async () => {
//   instance.loginRedirect({ scopes: graphScopes });
// };


//   const logoutMsal = async () => {
//     await instance.logoutRedirect();
//   };

//   const acquireGraphToken = async (): Promise<string> => {
//     const request: SilentRequest = {
//       scopes: graphScopes,
//       account: accounts[0],
//     };

//     try {
//       const res = await instance.acquireTokenSilent(request);
//       return res.accessToken;
//     } catch (e) {
//       if (e instanceof InteractionRequiredAuthError) {
//         // This will redirect to Microsoft login page if silent fails
//         await instance.acquireTokenRedirect({ scopes: graphScopes });
//         // After redirect back, MSAL stores the token in cache
//         throw new Error("Redirecting to Microsoft login...");
//       }
//       throw e;
//     }
//   };

//   const isSignedInToMsal = accounts.length > 0;

//   return { login, logoutMsal, acquireGraphToken, isSignedInToMsal };
// };