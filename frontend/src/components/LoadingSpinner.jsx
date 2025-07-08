import React from "react";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin transition-all duration-500 ease-in-out"></div>
        <p className="text-lg font-semibold text-gray-800 animate-pulse">Loading MICS Connect...</p>
      </div>
    </div>
  );
}
