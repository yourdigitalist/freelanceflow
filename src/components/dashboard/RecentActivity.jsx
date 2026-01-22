import React from 'react';
import { Clock, FileText, CheckCircle, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const activityIcons = {
  time: Clock,
  invoice: FileText,
  task: CheckCircle,
  project: Plus,
};

export default function RecentActivity({ activities = [] }) {
  if (!activities.length) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">No recent activity</p>
          <p className="text-xs text-slate-400 mt-1">Start tracking time to see updates here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activityIcons[activity.type] || Clock;
          return (
            <div key={index} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{activity.description}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}