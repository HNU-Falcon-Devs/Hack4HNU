import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center select-none">
      <div className="w-8 h-8 border-2 border-emerald-100 border-t-[#006633] rounded-full animate-spin" />
    </div>
  );
}
