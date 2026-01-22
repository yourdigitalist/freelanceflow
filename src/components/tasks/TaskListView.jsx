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
import { Pencil, Trash2, MessageSquare, Plus, GripVertical, ArrowUpDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useQueryClient } from '@tanstack/react-query';

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

export default function TaskListView({ tasks, taskStatuses, onEditTask, onDeleteTask, onAddTask, projectId }) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [sortBy, setSortBy] = useState(() => localStorage.getItem(`taskListSort_${projectId}`) || 'order');
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem(`taskListSortOrder_${projectId}`) || 'asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const queryClient = useQueryClient();

  const getStatusOrder = (statusId) => {
    const status = taskStatuses.find(s => s.id === statusId);
    return status?.order || 999;
  };

  const getPriorityOrder = (priority) => {
    const order = { low: 1, medium: 2, high: 3 };
    return order[priority] || 0;
  };

  const getStatusName = (statusId) => {
    const status = taskStatuses.find(s => s.id === statusId);
    return status?.name || 'Unknown';
  };

  const getStatusColor = (statusId) => {
    const status = taskStatuses.find(s => s.id === statusId);
    return status?.color || '#94A3B8';
  };

  let topLevelTasks = tasks.filter(t => !t.parent_task_id);

  // Apply filters
  if (filterStatus !== 'all') {
    topLevelTasks = topLevelTasks.filter(t => t.status_id === filterStatus);
  }
  if (filterPriority !== 'all') {
    topLevelTasks = topLevelTasks.filter(t => t.priority === filterPriority);
  }

  // Apply sorting
  if (sortBy !== 'order') {
    topLevelTasks = [...topLevelTasks].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'due_date') {
        aVal = aVal ? new Date(aVal).getTime() : Infinity;
        bVal = bVal ? new Date(bVal).getTime() : Infinity;
      } else if (sortBy === 'title') {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      } else if (sortBy === 'status_id') {
        aVal = getStatusOrder(aVal);
        bVal = getStatusOrder(bVal);
      } else if (sortBy === 'priority') {
        aVal = getPriorityOrder(aVal);
        bVal = getPriorityOrder(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  } else {
    // Sort by order field
    topLevelTasks = [...topLevelTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

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
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    setEditingCell(null);
    setEditValue('');
  };

  const handleStatusChange = async (task, newStatusId) => {
    // Optimistic update
    queryClient.setQueryData(['tasks', projectId], (old) => 
      old.map(t => t.id === task.id ? { ...t, status_id: newStatusId } : t)
    );
    
    await base44.entities.Task.update(task.id, { status_id: newStatusId });
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
  };

  const handlePriorityChange = async (task, newPriority) => {
    // Optimistic update
    queryClient.setQueryData(['tasks', projectId], (old) => 
      old.map(t => t.id === task.id ? { ...t, priority: newPriority } : t)
    );
    
    await base44.entities.Task.update(task.id, { priority: newPriority });
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newTask = {
      id: tempId,
      title: newTaskTitle.trim(),
      project_id: projectId,
      status_id: taskStatuses[0]?.id,
      priority: 'medium',
      order: topLevelTasks.length,
    };
    
    queryClient.setQueryData(['tasks', projectId], (old) => [...(old || []), newTask]);
    
    setCreatingTask(false);
    setNewTaskTitle('');
    
    try {
      await base44.entities.Task.create(newTask);
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    } catch (error) {
      queryClient.setQueryData(['tasks', projectId], (old) => 
        old.filter(t => t.id !== tempId)
      );
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    if (sourceIndex === destIndex) return;
    
    // Reset to manual order when dragging
    setSortBy('order');
    localStorage.setItem(`taskListSort_${projectId}`, 'order');
    
    const reordered = Array.from(topLevelTasks);
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, moved);
    
    // Optimistic update
    queryClient.setQueryData(['tasks', projectId], (old) => {
      return old.map(task => {
        const idx = reordered.findIndex(t => t.id === task.id);
        if (idx !== -1) {
          return { ...task, order: idx };
        }
        return task;
      });
    });
    
    // Update order for all affected tasks in background
    const updates = reordered.map((task, index) => 
      base44.entities.Task.update(task.id, { order: index })
    );
    Promise.all(updates).then(() => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    });
  };

  const toggleSort = (field) => {
    const newSortOrder = sortBy === field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc';
    setSortBy(field);
    setSortOrder(newSortOrder);
    localStorage.setItem(`taskListSort_${projectId}`, field);
    localStorage.setItem(`taskListSortOrder_${projectId}`, newSortOrder);
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {taskStatuses.map(status => (
              <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[35%]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-semibold hover:bg-transparent"
                    onClick={() => toggleSort('title')}
                  >
                    Title
                    {sortBy === 'title' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="w-[15%]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-semibold hover:bg-transparent"
                    onClick={() => toggleSort('status_id')}
                  >
                    Status
                    {sortBy === 'status_id' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="w-[12%]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-semibold hover:bg-transparent"
                    onClick={() => toggleSort('priority')}
                  >
                    Priority
                    {sortBy === 'priority' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="w-[12%]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-semibold hover:bg-transparent"
                    onClick={() => toggleSort('estimated_hours')}
                  >
                    Est. Hours
                    {sortBy === 'estimated_hours' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="w-[14%]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 font-semibold hover:bg-transparent"
                    onClick={() => toggleSort('due_date')}
                  >
                    Due Date
                    {sortBy === 'due_date' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="w-[12%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <Droppable droppableId="task-list">
            {(provided) => (
              <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                {topLevelTasks.length === 0 && !creatingTask ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                      No tasks yet. Create your first task to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {topLevelTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={sortBy !== 'order'}>
                        {(provided, snapshot) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "group transition-colors",
                              snapshot.isDragging && "opacity-50 bg-slate-100",
                              editingCell?.taskId === task.id ? "bg-emerald-50/30" : "hover:bg-slate-50"
                            )}
                          >
                            <TableCell {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                              {sortBy === 'order' && <GripVertical className="w-4 h-4 text-slate-400" />}
                            </TableCell>
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
                                  <Badge className={cn("font-normal", priorityColors[task.priority || 'medium'])}>
                                    {priorityLabels[task.priority || 'medium']}
                                  </Badge>
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
                        )}
                      </Draggable>
                    ))}
                    {creatingTask && (
                      <TableRow className="bg-emerald-50/30">
                        <TableCell></TableCell>
                        <TableCell colSpan={6}>
                          <Input
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onBlur={handleCreateTask}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleCreateTask();
                              if (e.key === 'Escape') { setCreatingTask(false); setNewTaskTitle(''); }
                            }}
                            placeholder="Task title..."
                            autoFocus
                            className="h-8"
                          />
                        </TableCell>
                      </TableRow>
                    )}
                    {provided.placeholder}
                  </>
                )}
              </TableBody>
            )}
          </Droppable>
        </Table>
      </div>
    </DragDropContext>
    
    {!creatingTask && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCreatingTask(true)}
        className="w-full justify-start text-slate-500 hover:text-slate-700 hover:bg-white border border-dashed border-slate-200 hover:border-slate-300 rounded-xl"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add task
      </Button>
    )}
  </div>
  );
}