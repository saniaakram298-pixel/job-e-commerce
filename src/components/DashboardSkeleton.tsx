'use client';

import React from 'react';

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-neutral-200 rounded-xl animate-pulse ${className}`} />
  );
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-neutral-200 rounded animate-pulse ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Card Skeleton */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <SkeletonText lines={3} className="mb-4" />
          </div>
          <SkeletonCard className="w-24 h-10" />
        </div>
      </div>

      {/* Search Bar Skeleton */}
      <SkeletonCard className="w-full h-12 rounded-2xl" />

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-xl border border-neutral-200 bg-white">
            <SkeletonText lines={2} className="mb-4" />
            <SkeletonCard className="h-8" />
          </div>
        ))}
      </div>

      {/* Revenue Chart Skeleton */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <SkeletonText className="mb-4" />
        <SkeletonCard className="w-full h-64" />
      </div>

      {/* Two Column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-6">
            <SkeletonText className="mb-4" />
            <SkeletonCard className="w-full h-64" />
          </div>
        ))}
      </div>

      {/* Best Sellers Skeleton */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <SkeletonText className="mb-4" />
        <SkeletonCard className="w-full h-80" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="w-full p-6 rounded-xl border border-neutral-200 bg-white">
      <div className="flex justify-between items-start mb-4">
        <SkeletonText lines={1} className="w-24" />
        <SkeletonCard className="w-6 h-6" />
      </div>
      <SkeletonCard className="h-8 w-1/3" />
    </div>
  );
}

export function TabContentSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-6">
          <SkeletonText lines={2} className="mb-4" />
          <SkeletonCard className="w-full h-48" />
        </div>
      ))}
    </div>
  );
}
