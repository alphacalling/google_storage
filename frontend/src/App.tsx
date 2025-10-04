import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./components/auth-provider";
import { ReactQueryProvider } from "./components/react-query-provider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./components/home-page";
import ProtectedLayout from "./page/ProtectedRoute";
import { LayoutDashboard } from "lucide-react";

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ReactQueryProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedLayout>
                    <LayoutDashboard />
                  </ProtectedLayout>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        <Toaster />
      </ReactQueryProvider>
    </ThemeProvider>
  );
}
