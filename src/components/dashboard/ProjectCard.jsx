import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Calendar, Clock, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const statusColors = {
  planning: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-rose-100 text-rose-700",
};

const statusLabels = {
  planning: "Planning",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
  on_hold: "On Hold",
};

export default function ProjectCard({ project, client, totalHours = 0, taskCount = 0 }) {
  return (
    <Link
      to={createPageUrl(`ProjectDetail?id=${project.id}`)}
      className="block bg-white rounded-2xl p-6 border border-slate-200/60 hover:border-slate-300/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm"
          style={{ backgroundColor: project.color || '#10b981' }}
        >
          {project.name?.charAt(0)?.toUpperCase()}
        </div>
        <Badge className={cn("font-medium", statusColors[project.status])}>
          {statusLabels[project.status]}
        </Badge>
      </div>

      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
        {project.name}
      </h3>
      <p className="text-sm text-slate-500 mt-1">{client?.name || 'No client'}</p>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
        {project.due_date && (
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(project.due_date), 'MMM d')}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>{totalHours.toFixed(1)}h</span>
        </div>
        <div className="ml-auto text-sm text-slate-500">
          {taskCount} tasks
        </div>
      </div>
    </Link>
  );
}