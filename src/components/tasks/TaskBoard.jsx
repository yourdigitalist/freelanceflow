import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from "@/lib/utils";
import TaskItem from './TaskItem';

export default function TaskBoard({ tasks, taskStatuses, onDragEnd, onEditTask, onDeleteTask }) {
  const columns = taskStatuses.sort((a, b) => a.order - b.order);
  
  const getColumnTasks = (statusId) => tasks.filter(task => 
    (task.status_id === statusId || task.status === statusId) && !task.parent_task_id
  );

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
                  <h3 className="font-semibold text-slate-700">{column.name}</h3>
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
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}