import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from "@/lib/utils";
import TaskItem from './TaskItem';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function TaskBoard({ tasks, taskStatuses, onDragEnd, onEditTask, onDeleteTask, onAddTask, projectId }) {
  const [creatingInColumn, setCreatingInColumn] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const queryClient = useQueryClient();
  const columns = taskStatuses.sort((a, b) => a.order - b.order);
  
  const getColumnTasks = (statusId) => {
    const filtered = tasks.filter(task => 
      (task.status_id === statusId || task.status === statusId) && !task.parent_task_id
    );
    return filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const handleInlineCreate = async (statusId) => {
    if (!newTaskTitle.trim()) {
      setCreatingInColumn(null);
      setNewTaskTitle('');
      return;
    }
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newTask = {
      id: tempId,
      title: newTaskTitle.trim(),
      project_id: projectId,
      status_id: statusId,
      priority: 'medium',
      order: getColumnTasks(statusId).length,
    };
    
    queryClient.setQueryData(['tasks', projectId], (old) => [...(old || []), newTask]);
    
    setNewTaskTitle('');
    setCreatingInColumn(null);
    
    // Create on server
    try {
      await base44.entities.Task.create(newTask);
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    } catch (error) {
      // Revert on error
      queryClient.setQueryData(['tasks', projectId], (old) => 
        old.filter(t => t.id !== tempId)
      );
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "rounded-2xl overflow-hidden min-h-[400px] transition-all",
                  snapshot.isDraggingOver ? "bg-emerald-50 ring-2 ring-emerald-400" : "bg-slate-50"
                )}
              >
                <div 
                  className="h-3" 
                  style={{ backgroundColor: column.color || '#94A3B8' }}
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-700">{column.name}</h3>
                    <span className="text-sm text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                      {getColumnTasks(column.id).length}
                    </span>
                  </div>
                <div className="space-y-3 min-h-[300px]">
                  {getColumnTasks(column.id).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(snapshot.isDragging && "opacity-70")}
                        >
                          <TaskItem
                            task={task}
                            tasks={tasks}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  </div>
                  {creatingInColumn === column.id ? (
                    <Input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onBlur={() => handleInlineCreate(column.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineCreate(column.id);
                        if (e.key === 'Escape') { setCreatingInColumn(null); setNewTaskTitle(''); }
                      }}
                      placeholder="Task title..."
                      autoFocus
                      className="mt-2"
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCreatingInColumn(column.id)}
                      className="w-full justify-start text-slate-500 hover:text-slate-700 hover:bg-white/60 mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add task
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}