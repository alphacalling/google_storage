"use client"

import { useAuth } from "./auth-provider"

export function LoginView() {
  const { login } = useAuth()
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">UniDrive</h1>
            <p className="text-gray-600 dark:text-gray-300">Access your Azure Blob Storage files in one place</p>
          </div>
          <button
            onClick={login}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.64 12.204c0-.639-.057-1.252-.164-1.841H12v3.481h6.526c-.281 1.481-1.146 2.737-2.441 3.578v2.96h3.957c2.312-2.13 3.598-5.262 3.598-8.178z" />
              <path d="M12 24c3.24 0 5.956-1.075 7.941-2.907l-3.957-2.96c-1.075.72-2.448 1.146-3.984 1.146-3.065 0-5.658-2.067-6.584-4.844H1.423v3.058C3.407 21.35 7.353 24 12 24z" />
              <path d="M5.416 14.435c-.24-.72-.375-1.487-.375-2.435s.135-1.715.375-2.435V6.507H1.423C.52 8.312 0 10.104 0 12s.52 3.688 1.423 5.493l3.993-3.058z" />
              <path d="M12 4.75c1.727 0 3.278.593 4.497 1.759l3.37-3.37C17.956 1.14 15.24 0 12 0 7.353 0 3.407 2.65 1.423 6.507l3.993 3.058C6.342 6.817 8.935 4.75 12 4.75z" />
            </svg>
            Sign in with Microsoft
          </button>
        </div>
      </div>
    </div>
  )
}
