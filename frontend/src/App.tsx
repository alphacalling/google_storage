import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./components/auth-provider";
import { ReactQueryProvider } from "./components/react-query-provider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./components/home-page";
// import HomePage from "./pages/HomePage";
// import AnotherPage from "./pages/AnotherPage";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ReactQueryProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* <Route path="/another" element={<AnotherPage />} /> */}
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        <Toaster />
      </ReactQueryProvider>
    </ThemeProvider>
  );
}


// import { useEffect, useState } from "react";
// import { PublicClientApplication } from "@azure/msal-browser";
// import { BrowserRouter as Router } from "react-router-dom";
// import { MsalProvider } from "@azure/msal-react";
// import { msalConfig } from "./config/msalConfig";
// import { VITE_AZURE_TENANT_ID, VITE_AZURE_CLIENT_ID } from "./config/env";
// import { ReactQueryProvider } from "./components/react-query-provider";
// import { AuthProvider } from "./components/auth-provider";
// import { Toaster } from "./components/ui/toaster";
// import { ThemeProvider } from "./components/theme-provider";
// import HomePage from "./components/home-page";

// const App = () => {
//   const tenantId = VITE_AZURE_TENANT_ID as string;
//   const clientId = VITE_AZURE_CLIENT_ID as string;

//   const [pca] = useState(
//     () => new PublicClientApplication(msalConfig(tenantId, clientId))
//   );
//   const [isMsalReady, setIsMsalReady] = useState(false);

//   useEffect(() => {
//     const init = async () => {
//       await pca.initialize(); // 👈 required
//       const response = await pca.handleRedirectPromise();

//       if (response) {
//         pca.setActiveAccount(response.account);
//       } else {
//         const accounts = pca.getAllAccounts();
//         if (accounts.length > 0) {
//           pca.setActiveAccount(accounts[0]);
//         }
//       }
//       setIsMsalReady(true);
//     };

//     init();
//   }, [pca]);

//   if (!isMsalReady) return <div>Loading authentication...</div>;
//   return (
//     <div>
//       <MsalProvider instance={pca}>
//         <ThemeProvider
//           attribute="class"
//           defaultTheme="system"
//           enableSystem
//           disableTransitionOnChange
//         >
//           <Router>
//             <ReactQueryProvider>
//               <AuthProvider><HomePage /></AuthProvider>
//             </ReactQueryProvider>
//           </Router>
//           <Toaster />
//         </ThemeProvider>
//       </MsalProvider>
//     </div>
//   );
// };

// export default App;
