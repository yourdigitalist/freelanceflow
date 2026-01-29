import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Sparkles, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function UpgradeBanner({ collapsed }) {
  if (collapsed) return null;

  return (
    <Link 
      to={createPageUrl('BillingSettings')}
      className="mx-3 mb-4 block group"
    >
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#9B63E9] to-[#8A52D8] p-4 transition-all duration-200 hover:shadow-lg hover:shadow-[#9B63E9]/30">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-8 -mt-8" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-6 -mb-6" />
        
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Sparkles className={cn("w-5 h-5 text-white")} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Upgrade to Business</p>
            <p className="text-white/80 text-xs">Unlock premium features</p>
          </div>
          <ArrowRight className={cn("w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity")} />
        </div>
      </div>
    </Link>
  );
}