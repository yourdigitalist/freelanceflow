import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from "@/lib/utils";
import TaskItem from './TaskItem';

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50' },
  { id: 'review', title: 'Review', color: 'bg-amber-50' },
  { id: 'completed', title: 'Completed', color: 'bg-emerald-50' },
];

export default function TaskBoard({ tasks, onDragEnd, onEditTask, onDeleteTask }) {
  const getColumnTasks = (status) => tasks.filter(task => task.status === status);

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
                  "rounded-2xl p-4 min-h-[400px] transition-colors",
                  column.color,
                  snapshot.isDraggingOver && "ring-2 ring-emerald-500/20"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-700">{column.title}</h3>
                  <span className="text-sm text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                    {getColumnTasks(column.id).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {getColumnTasks(column.id).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <TaskItem
                            task={task}
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
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}