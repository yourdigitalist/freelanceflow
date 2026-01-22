import React, { useState } from 'react';
import { Calendar, Clock, MoreHorizontal, Pencil, Trash2, ChevronDown, ChevronRight, CheckSquare, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const priorityColors = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

export default function TaskItem({ task, tasks, onEdit, onDelete, isDragging }) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const subtasks = tasks?.filter(t => t.parent_task_id === task.id) || [];
  const completedSubtasks = subtasks.filter(t => t.status === 'completed' || t.status_id === '6971e7543803687d3a132544').length;
  
  return (
    <div 
      className={cn(
        "bg-white rounded-xl p-4 shadow-sm border border-slate-200/60 transition-all cursor-grab active:cursor-grabbing group",
        isDragging && "shadow-lg ring-2 ring-emerald-500"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-slate-900 text-sm line-clamp-2">{task.title}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task)} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={cn("text-xs font-medium", priorityColors[task.priority])}>
          {task.priority}
        </Badge>
        {task.due_date && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            {format(new Date(task.due_date), 'MMM d')}
          </span>
        )}
        {task.estimated_hours && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            {task.estimated_hours}h
          </span>
        )}
        {task.comments && task.comments.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <MessageSquare className="w-3 h-3" />
            {task.comments.length}
          </span>
        )}
        {subtasks.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSubtasks(!showSubtasks);
            }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <CheckSquare className="w-3 h-3" />
            {completedSubtasks}/{subtasks.length}
            {showSubtasks ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
      </div>

      {showSubtasks && subtasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          {subtasks.map(subtask => (
            <div key={subtask.id} className="flex items-start gap-2 text-xs">
              <CheckSquare className={cn("w-3 h-3 mt-0.5 flex-shrink-0", 
                (subtask.status === 'completed' || subtask.status_id === '6971e7543803687d3a132544') 
                  ? "text-emerald-600" 
                  : "text-slate-300"
              )} />
              <span className={cn(
                "text-slate-600 flex-1",
                (subtask.status === 'completed' || subtask.status_id === '6971e7543803687d3a132544') && "line-through text-slate-400"
              )}>
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}