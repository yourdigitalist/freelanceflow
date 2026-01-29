import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Sparkles, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import NotificationBell from '../notifications/NotificationBell';

export default function UpgradeBanner({ collapsed }) {
  return (
    <div className="space-y-3">
      {/* Notifications */}
      <div className="mx-3">
        {collapsed ? (
          <div className="flex justify-center">
            <NotificationBell />
          </div>
        ) : (
          <Link 
            to={createPageUrl('Notifications')}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <NotificationBell isInline />
            <span>Notifications</span>
          </Link>
        )}
      </div>

      {/* Upgrade Banner */}
      {!collapsed && (
        <Link 
          to={createPageUrl('BillingSettings')}
          className="mx-3 mb-4 block group"
        >
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#f7edff] to-[#ceddf7] px-4 py-3 transition-all duration-200 hover:shadow-md">
            <div className="relative flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/60 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Sparkles className={cn("w-4 h-4 text-[#9B63E9]")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 font-semibold text-sm">Upgrade to Business</p>
              </div>
              <ArrowRight className={cn("w-4 h-4 text-[#9B63E9]")} />
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}