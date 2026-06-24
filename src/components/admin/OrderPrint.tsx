'use client';

import React from 'react';

export default function OrderPrint({ order }: { order?: any }) {
  return (
    <div>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
      >
        Print
      </button>
    </div>
  );
}
