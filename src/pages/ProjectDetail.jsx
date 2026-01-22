import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ArrowLeft,
  Plus,
  Clock,
  DollarSign,
  Calendar,
  Pencil,
  FileText,
  Trash2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import TaskBoard from '../components/tasks/TaskBoard';
import TaskListView from '../components/tasks/TaskListView';
import TaskDialog from '../components/tasks/TaskDialog';
import ProjectDialog from '../components/projects/ProjectDialog';
import InvoiceDialog from '../components/invoices/InvoiceDialog';
import ProjectStatusManagementDialog from '../components/projects/ProjectStatusManagementDialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [statusManagementOpen, setStatusManagementOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [taskView, setTaskView] = useState('board'); // 'board' or 'list'
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
  });

  const { data: client } = useQuery({
    queryKey: ['client', project?.client_id],
    queryFn: async () => {
      if (!project?.client_id) return null;
      const clients = await base44.entities.Client.filter({ id: project.client_id });
      return clients[0];
    },
    enabled: !!project?.client_id,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: allTaskStatuses = [] } = useQuery({
    queryKey: ['taskStatuses'],
    queryFn: () => base44.entities.TaskStatus.list('order'),
  });

  const { data: statusTemplates = [] } = useQuery({
    queryKey: ['taskStatusTemplates'],
    queryFn: () => base44.entities.TaskStatusTemplate.list(),
  });

  // Get project-specific statuses or fall back to global
  const taskStatuses = allTaskStatuses.filter(s => 
    s.project_id === projectId || (!s.project_id && !allTaskStatuses.some(st => st.project_id === projectId))
  );

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries', projectId],
    queryFn: () => base44.entities.TimeEntry.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create({ ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setTaskDialogOpen(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setTaskDialogOpen(false);
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setDeleteTask(null);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setProjectDialogOpen(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => base44.entities.Project.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
      window.location.href = createPageUrl('Projects');
    },
  });

  const saveStatusesMutation = useMutation({
    mutationFn: async (statuses) => {
      // Delete old project statuses
      const oldProjectStatuses = allTaskStatuses.filter(s => s.project_id === projectId);
      const oldStatusIds = oldProjectStatuses.map(s => s.id);
      
      await Promise.all(oldProjectStatuses.map(s => base44.entities.TaskStatus.delete(s.id)));
      
      // Create new statuses (without id field to avoid conflicts)
      const newStatuses = statuses.map(({ id, ...rest }) => ({
        ...rest,
        project_id: projectId
      }));
      const createdStatuses = await Promise.all(newStatuses.map(s => base44.entities.TaskStatus.create(s)));
      
      // Reassign orphaned tasks to the first new status
      if (createdStatuses.length > 0) {
        const firstNewStatusId = createdStatuses[0].id;
        const orphanedTasks = tasks.filter(t => oldStatusIds.includes(t.status_id));
        await Promise.all(orphanedTasks.map(t => 
          base44.entities.Task.update(t.id, { status_id: firstNewStatusId })
        ));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskStatuses'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setStatusManagementOpen(false);
      toast.success('Statuses updated');
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: ({ name, statuses }) => {
      return base44.entities.TaskStatusTemplate.create({
        name,
        statuses: statuses.map(({ name, key, color, order }) => ({ name, key, color, order })),
        is_default: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskStatusTemplates'] });
      toast.success('Template saved');
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setInvoiceDialogOpen(false);
    },
  });

  const handleTaskSave = async (data, subtasks = []) => {
    if (editingTask && editingTask.id) {
      await updateTaskMutation.mutateAsync({ id: editingTask.id, data });
    } else {
      const parentTask = await createTaskMutation.mutateAsync(data);
      // Create subtasks if any
      if (subtasks.length > 0 && parentTask && parentTask.id) {
        for (const subtask of subtasks) {
          await base44.entities.Task.create({
            ...subtask,
            project_id: projectId,
            parent_task_id: parentTask.id,
            status_id: data.status_id,
          });
        }
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      }
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const taskId = result.draggableId;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task || !task.id) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    const sourceStatusId = result.source.droppableId;
    const destStatusId = result.destination.droppableId;
    
    // If moving to a different status
    if (sourceStatusId !== destStatusId) {
      await updateTaskMutation.mutateAsync({ id: taskId, data: { status_id: destStatusId, order: destIndex } });
    } else {
      // Reordering within the same status
      const statusTasks = tasks.filter(t => t.status_id === sourceStatusId && !t.parent_task_id);
      const reordered = Array.from(statusTasks);
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(destIndex, 0, moved);
      
      // Update order for all affected tasks
      const updates = reordered
        .filter(t => t && t.id)
        .map((task, index) => 
          base44.entities.Task.update(task.id, { order: index })
        );
      await Promise.all(updates);
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  };



  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const unbilledHours = timeEntries.filter(e => !e.billed && e.billable).reduce((sum, e) => sum + (e.hours || 0), 0);

  const handleCreateInvoice = () => {
    const initialInvoiceData = {
      client_id: project.client_id,
      project_id: projectId,
    };

    // If it's a fixed-price project with a budget, add a line item
    if (project.billing_type === 'fixed' && project.budget) {
      initialInvoiceData.line_items = [{
        description: `Fixed Project Fee: ${project.name}`,
        quantity: 1,
        rate: project.budget,
        amount: project.budget,
      }];
    }

    setInvoiceDialogOpen(true);
  };

  if (!project) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-slate-500">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to={createPageUrl('Projects')} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
              style={{ backgroundColor: project.color || '#10b981' }}
            >
              {project.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                <Badge className={cn("font-medium", statusColors[project.status])}>
                  {statusLabels[project.status]}
                </Badge>
              </div>
              <p className="text-slate-500">{client?.name || 'No client'}</p>
              {project.description && (
                <p className="text-sm text-slate-600 mt-2 max-w-2xl">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setProjectDialogOpen(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setDeleteProjectOpen(true)} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={handleCreateInvoice}>
              <FileText className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
            <Link to={createPageUrl(`TimeTracking?project=${projectId}`)}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Clock className="w-4 h-4 mr-2" />
                Log Time
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-slate-200/60">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Clock className="w-4 h-4" />
            Total Hours
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}h</p>
          <p className="text-xs text-slate-500">{unbilledHours.toFixed(1)}h unbilled</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/60">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <DollarSign className="w-4 h-4" />
            {project.billing_type === 'hourly' ? 'Rate' : 'Budget'}
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${project.billing_type === 'hourly' ? project.hourly_rate || 0 : project.budget || 0}
          </p>
          <p className="text-xs text-slate-500">{project.billing_type}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/60">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Calendar className="w-4 h-4" />
            Due Date
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {project.due_date ? format(new Date(project.due_date), 'MMM d') : '—'}
          </p>
          {project.due_date && (
            <p className="text-xs text-slate-500">{format(new Date(project.due_date), 'yyyy')}</p>
          )}
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/60">
          <div className="text-sm text-slate-500 mb-1">Tasks</div>
          <p className="text-2xl font-bold text-slate-900">{tasks.length}</p>
          <p className="text-xs text-slate-500">{tasks.filter(t => t.status === 'completed').length} completed</p>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
          <div className="flex gap-2">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <Button
                variant={taskView === 'board' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTaskView('board')}
                className={cn(
                  "rounded-none",
                  taskView === 'board' ? "bg-emerald-600 hover:bg-emerald-700" : ""
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={taskView === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTaskView('list')}
                className={cn(
                  "rounded-none",
                  taskView === 'list' ? "bg-emerald-600 hover:bg-emerald-700" : ""
                )}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusManagementOpen(true)}
            >
              Edit Statuses
            </Button>
            <Button 
              onClick={() => {
                setEditingTask(null);
                setTaskDialogOpen(true);
              }}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Task
            </Button>
          </div>
        </div>
        <div className="p-6">
          {taskView === 'board' ? (
            <TaskBoard
              tasks={tasks}
              taskStatuses={taskStatuses}
              onDragEnd={handleDragEnd}
              onEditTask={(task) => {
                setEditingTask(task);
                setTaskDialogOpen(true);
              }}
              onDeleteTask={setDeleteTask}
              onAddTask={(statusId) => {
                setEditingTask({ status_id: statusId });
                setTaskDialogOpen(true);
              }}
            />
          ) : (
            <TaskListView
              tasks={tasks}
              taskStatuses={taskStatuses}
              projectId={projectId}
              onEditTask={(task) => {
                setEditingTask(task);
                setTaskDialogOpen(true);
              }}
              onDeleteTask={setDeleteTask}
              onAddTask={(statusId) => {
                setEditingTask({ status_id: statusId });
                setTaskDialogOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        taskStatuses={taskStatuses}
        defaultStatusId={editingTask?.status_id}
        onSave={handleTaskSave}
      />

      {/* Status Management Dialog */}
      <ProjectStatusManagementDialog
        open={statusManagementOpen}
        onOpenChange={setStatusManagementOpen}
        projectId={projectId}
        currentStatuses={taskStatuses}
        templates={statusTemplates}
        onSave={(statuses) => saveStatusesMutation.mutate(statuses)}
        onSaveAsTemplate={(name, statuses) => saveTemplateMutation.mutate({ name, statuses })}
      />

      {/* Project Dialog */}
      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={project}
        clients={clients}
        onSave={(data) => updateProjectMutation.mutateAsync(data)}
      />

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        clients={allClients}
        projects={allProjects}
        unbilledTime={timeEntries.filter(t => !t.billed && t.billable)}
        initialData={{
          client_id: project.client_id,
          project_id: projectId,
          line_items: project.billing_type === 'fixed' && project.budget ? [{
            description: `Fixed Project Fee: ${project.name}`,
            quantity: 1,
            rate: project.budget,
            amount: project.budget,
          }] : [{ description: '', quantity: 1, rate: 0, amount: 0 }],
        }}
        onSave={(data) => createInvoiceMutation.mutateAsync(data)}
      />

      {/* Delete Task Confirmation */}
      <AlertDialog open={!!deleteTask} onOpenChange={() => setDeleteTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTask?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTaskMutation.mutate(deleteTask.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Confirmation */}
      <AlertDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{project?.name}" and all its tasks and time entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteProjectMutation.mutate()}
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}