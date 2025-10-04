import { useAuth } from "./auth-provider";
import { useState } from "react";

export function LoginView() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center transition-transform duration-200 hover:scale-[1.02]">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              UniDrive
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Access your Azure Blob Storage files in one place
            </p>
          </div>

          {/* Microsoft Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 font-medium py-3 px-4 rounded-xl transition-all duration-200
              ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#0078D4] hover:bg-[#005A9E]"} 
              text-white shadow-md hover:shadow-lg`}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="0" y="0" width="10" height="10" fill="#F25022" />
              <rect x="14" y="0" width="10" height="10" fill="#7FBA00" />
              <rect x="0" y="14" width="10" height="10" fill="#00A4EF" />
              <rect x="14" y="14" width="10" height="10" fill="#FFB900" />
            </svg>
            {loading ? "Signing in..." : "Sign in with Microsoft"}
          </button>
        </div>
      </div>
    </div>
  );
}
