import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const priorityColors = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function TaskListView({ tasks, taskStatuses, onEditTask, onDeleteTask }) {
  const topLevelTasks = tasks.filter(t => !t.parent_task_id);

  const getStatusName = (statusId) => {
    const status = taskStatuses.find(s => s.id === statusId);
    return status?.name || 'Unknown';
  };

  const getStatusColor = (statusId) => {
    const status = taskStatuses.find(s => s.id === statusId);
    return status?.color || '#94A3B8';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Estimated Hours</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topLevelTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                No tasks yet. Create your first task to get started.
              </TableCell>
            </TableRow>
          ) : (
            topLevelTasks.map((task) => (
              <TableRow key={task.id} className="hover:bg-slate-50">
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getStatusColor(task.status_id) }}
                    />
                    <span className="text-sm">{getStatusName(task.status_id)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", priorityColors[task.priority || 'medium'])}>
                    {priorityLabels[task.priority || 'medium']}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.estimated_hours ? `${task.estimated_hours}h` : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditTask(task)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteTask(task)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}