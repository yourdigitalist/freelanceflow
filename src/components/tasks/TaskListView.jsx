import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, MessageSquare } from 'lucide-react';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';

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

export default function TaskListView({ tasks, taskStatuses, onEditTask, onDeleteTask, onAddTask }) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const topLevelTasks = tasks.filter(t => !t.parent_task_id);

  const getStatusName = (statusId) => {
    const status = taskStatuses.find(s => s.id === statusId);
    return status?.name || 'Unknown';
  };

  const getStatusColor = (statusId) => {
    const status = taskStatuses.find(s => s.id === statusId);
    return status?.color || '#94A3B8';
  };

  const handleCellEdit = (taskId, field, value) => {
    setEditingCell({ taskId, field });
    setEditValue(value || '');
  };

  const handleSaveCell = async (task, field) => {
    let valueToSave = editValue;
    if (field === 'estimated_hours') {
      valueToSave = editValue ? parseFloat(editValue) : null;
    }
    await base44.entities.Task.update(task.id, { [field]: valueToSave });
    setEditingCell(null);
    setEditValue('');
  };

  const handleStatusChange = async (task, newStatusId) => {
    await base44.entities.Task.update(task.id, { status_id: newStatusId });
  };

  const handlePriorityChange = async (task, newPriority) => {
    await base44.entities.Task.update(task.id, { priority: newPriority });
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">Title</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[12%]">Priority</TableHead>
              <TableHead className="w-[12%]">Est. Hours</TableHead>
              <TableHead className="w-[14%]">Due Date</TableHead>
              <TableHead className="w-[12%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {topLevelTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                No tasks yet. Create your first task to get started.
              </TableCell>
            </TableRow>
          ) : (
            topLevelTasks.map((task) => (
              <TableRow key={task.id} className={cn(
                "group transition-colors",
                editingCell?.taskId === task.id ? "bg-emerald-50/30" : "hover:bg-slate-50"
              )}>
                <TableCell 
                  className="font-medium cursor-text hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleCellEdit(task.id, 'title', task.title)}
                >
                  {editingCell?.taskId === task.id && editingCell?.field === 'title' ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveCell(task, 'title')}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveCell(task, 'title')}
                      autoFocus
                      className="h-8 -my-1"
                    />
                  ) : (
                    <span className="block py-1">{task.title}</span>
                  )}
                </TableCell>
                <TableCell className="w-[15%]">
                  <Select
                    value={task.status_id}
                    onValueChange={(value) => handleStatusChange(task, value)}
                  >
                    <SelectTrigger className="h-8 w-full border-0 hover:bg-slate-100/50">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getStatusColor(task.status_id) }}
                        />
                        <span className="truncate">{getStatusName(task.status_id)}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {taskStatuses.map(status => (
                        <SelectItem key={status.id} value={status.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            {status.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="w-[12%]">
                  <Select
                    value={task.priority || 'medium'}
                    onValueChange={(value) => handlePriorityChange(task, value)}
                  >
                    <SelectTrigger className="h-8 w-full border-0 hover:bg-slate-100/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell 
                  className="w-[12%] cursor-text hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleCellEdit(task.id, 'estimated_hours', task.estimated_hours)}
                >
                  {editingCell?.taskId === task.id && editingCell?.field === 'estimated_hours' ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveCell(task, 'estimated_hours')}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveCell(task, 'estimated_hours')}
                      autoFocus
                      className="h-8 -my-1"
                    />
                  ) : (
                    <span className="block py-1">{task.estimated_hours ? `${task.estimated_hours}h` : '—'}</span>
                  )}
                </TableCell>
                <TableCell 
                  className="w-[14%] cursor-text hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleCellEdit(task.id, 'due_date', task.due_date)}
                >
                  {editingCell?.taskId === task.id && editingCell?.field === 'due_date' ? (
                    <Input
                      type="date"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveCell(task, 'due_date')}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveCell(task, 'due_date')}
                      autoFocus
                      className="h-8 -my-1"
                    />
                  ) : (
                    <span className="block py-1">{task.due_date || '—'}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end items-center">
                    {task.comments && task.comments.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {task.comments.length}
                      </span>
                    )}
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
    
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onAddTask && onAddTask(taskStatuses[0]?.id)}
      className="w-full justify-start text-slate-500 hover:text-slate-700 hover:bg-white border border-dashed border-slate-200 hover:border-slate-300 rounded-xl"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add task
    </Button>
  </div>
  );
}