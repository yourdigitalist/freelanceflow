import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Calendar, Clock, Pencil, Trash2, Folder } from 'lucide-react';
import { Button } from "@/components/ui/button";
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

export default function ProjectCard({ project, client, totalHours = 0, taskCount = 0, onEdit, onDelete }) {
  return (
    <div className="relative bg-white rounded-2xl p-6 border border-slate-200/60 hover:border-slate-300/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 group">
      <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="block">
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: project.color || '#10b981' }}
          >
            {project.emoji || '📁'}
          </div>
          <Badge className={cn("font-medium", statusColors[project.status])}>
            {statusLabels[project.status]}
          </Badge>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
          {project.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
          <span>{client ? [client.first_name, client.last_name].filter(Boolean).join(' ') || client.company || 'No client' : 'No client'}</span>
          {project.folder && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Folder className="w-3 h-3" />
                {project.folder}
              </span>
            </>
          )}
        </div>

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

      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                onEdit(project);
              }}
              className="bg-white/90 backdrop-blur-sm hover:bg-white"
            >
              <Pencil className="w-4 h-4 text-slate-500" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                onDelete(project);
              }}
              className="bg-white/90 backdrop-blur-sm hover:bg-white hover:text-red-600"
            >
              <Trash2 className="w-4 h-4 text-slate-500" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}