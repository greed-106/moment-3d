"use client";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "加载中..." }: LoadingScreenProps) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-stone-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-stone-600">{message}</p>
      </div>
    </div>
  );
}