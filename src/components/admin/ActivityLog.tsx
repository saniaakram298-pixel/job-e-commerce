'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/client';
import { Activity, Package, ShoppingCart, User, MessageSquare, Settings, AlertCircle } from 'lucide-react';

interface ActivityLog {
  _id: string;
  action: string;
  actor: string;
  actorEmail?: string;
  type: 'order' | 'product' | 'review' | 'user' | 'system';
  details: string;
  timestamp: string;
  ip?: string;
}

interface ActivityLogComponentProps {
  darkMode?: boolean;
}

const ActivityLogComponent: React.FC<ActivityLogComponentProps> = ({ darkMode = false }) => {
  const [filterType, setFilterType] = useState<'all' | ActivityLog['type']>('all');

  const { data: logs = [], isLoading } = useQuery<ActivityLog[], Error>({
    queryKey: ['admin-activity-logs', filterType],
    queryFn: async () => {
      const res = await api.get('/admin/activity-logs', true);
      const allLogs = res?.data ?? res ?? [];
      
      if (filterType !== 'all') {
        return allLogs.filter((log: ActivityLog) => log.type === filterType);
      }
      return allLogs;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4" />;
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'review':
        return <MessageSquare className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'order':
        return 'bg-blue-500/10 text-blue-600';
      case 'product':
        return 'bg-purple-500/10 text-purple-600';
      case 'review':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'user':
        return 'bg-green-500/10 text-green-600';
      case 'system':
        return 'bg-gray-500/10 text-gray-600';
      default:
        return 'bg-neutral-500/10 text-neutral-600';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#0F0F0F] border-neutral-900' : 'bg-white border-neutral-200 shadow-sm'}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <Activity className="w-5 h-5 text-[#E5A93A]" />
          Activity Log
        </h3>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'order', 'product', 'review', 'user', 'system'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition ${
                filterType === filter
                  ? darkMode
                    ? 'bg-[#E5A93A]/20 text-[#E5A93A] border border-[#E5A93A]/30'
                    : 'bg-[#E5A93A]/10 text-[#8C6219] border border-[#E5A93A]/30'
                  : darkMode
                  ? 'text-neutral-500 border border-neutral-800 hover:text-[#E5A93A]'
                  : 'text-gray-600 border border-neutral-200 hover:text-[#8C6219]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`h-16 rounded-lg animate-pulse ${darkMode ? 'bg-neutral-900' : 'bg-gray-100'}`}
            />
          ))}
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div
              key={log._id || index}
              className={`flex gap-3 p-3 rounded-lg border transition ${darkMode ? 'border-neutral-800 bg-black/20 hover:border-[#E5A93A]/50' : 'border-neutral-200 bg-neutral-50 hover:border-[#E5A93A]'}`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(log.type)}`}>
                {getActivityIcon(log.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {log.action}
                    </p>
                    <p className={`text-xs truncate ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                      by {log.actor} {log.actorEmail && `(${log.actorEmail})`}
                    </p>
                    <p className={`text-sm mt-1 line-clamp-2 ${darkMode ? 'text-neutral-400' : 'text-gray-700'}`}>
                      {log.details}
                    </p>
                  </div>
                  <div className={`text-[10px] uppercase tracking-wider whitespace-nowrap ml-2 ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                    {getTimeAgo(log.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`flex items-center justify-center h-32 ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>
          <p>No activity logs yet</p>
        </div>
      )}
    </div>
  );
};

export default ActivityLogComponent;
