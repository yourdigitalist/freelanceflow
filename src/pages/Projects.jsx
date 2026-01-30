import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { FolderKanban, Search, Filter, LayoutGrid, List, Folder, Trash2, Pencil } from 'lucide-react';
import { createPageUrl } from '../utils';
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import ProjectCard from '../components/dashboard/ProjectCard';
import ProjectDialog from '../components/projects/ProjectDialog';

export default function Projects() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [folderFilter, setFolderFilter] = useState('all');
  const [deleteProject, setDeleteProject] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: () => base44.entities.Project.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.email],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries', user?.email],
    queryFn: () => base44.entities.TimeEntry.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Create the project
      const newProject = await base44.entities.Project.create(data);
      
      // 2. Get the user's global template statuses (or create defaults if none exist)
      let templateStatuses = await base44.entities.TaskStatus.filter({
        created_by: user.email,
        project_id: null
      }, 'order');
      
      // If no global templates exist, use hardcoded defaults
      if (templateStatuses.length === 0) {
        templateStatuses = [
          { name: 'To Do', key: 'todo', color: '#94a3b8', order: 0, is_done: false },
          { name: 'In Progress', key: 'in_progress', color: '#3b82f6', order: 1, is_done: false },
          { name: 'Review', key: 'review', color: '#f59e0b', order: 2, is_done: false },
          { name: 'Completed', key: 'completed', color: '#10b981', order: 3, is_done: true },
        ];
      }
      
      // 3. Copy statuses to the new project
      await Promise.all(
        templateStatuses.map(status =>
          base44.entities.TaskStatus.create({
            name: status.name,
            key: status.key,
            color: status.color,
            order: status.order,
            is_done: status.is_done || false,
            project_id: newProject.id,
          })
        )
      );
      
      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
      setEditingProject(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteProject(null);
    },
  });

  const handleSave = async (data) => {
    if (editingProject) {
      await updateMutation.mutateAsync({ id: editingProject.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const getProjectTaskCount = (projectId) => tasks.filter(t => t.project_id === projectId).length;
  const getProjectHours = (projectId) => timeEntries.filter(t => t.project_id === projectId).reduce((sum, e) => sum + (e.hours || 0), 0);

  const folders = [...new Set(projects.map(p => p.folder).filter(Boolean))];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesFolder = folderFilter === 'all' || 
      (folderFilter === 'none' ? !project.folder : project.folder === folderFilter);
    return matchesSearch && matchesStatus && matchesFolder;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Projects"
        description="Manage your active and completed projects"
        actionLabel="New Project"
        onAction={() => {
          setEditingProject(null);
          setDialogOpen(true);
        }}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
        <Select value={folderFilter} onValueChange={setFolderFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Folders</SelectItem>
            <SelectItem value="none">No Folder</SelectItem>
            {folders.map(folder => (
              <SelectItem key={folder} value={folder}>{folder}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-white shadow-sm' : ''}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/60 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="w-20 h-6 bg-slate-100 rounded-full" />
              </div>
              <div className="w-32 h-5 bg-slate-200 rounded mb-2" />
              <div className="w-24 h-4 bg-slate-100 rounded mb-4" />
              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <div className="w-16 h-8 bg-slate-100 rounded" />
                <div className="w-16 h-8 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                client={clients.find(c => c.id === project.client_id)}
                totalHours={getProjectHours(project.id)}
                taskCount={getProjectTaskCount(project.id)}
                onEdit={handleEdit}
                onDelete={setDeleteProject}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredProjects.map(project => {
                const client = clients.find(c => c.id === project.client_id);
                const taskCount = getProjectTaskCount(project.id);
                const totalHours = getProjectHours(project.id);
                return (
                  <div key={project.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: project.color || '#10b981' }}
                    >
                      {project.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                        className="font-semibold text-slate-900 hover:text-[#9B63E9] block truncate"
                      >
                        {project.name}
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                        <span>{client ? [client.first_name, client.last_name].filter(Boolean).join(' ') || client.company : 'No Client'}</span>
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
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-slate-900">{taskCount}</div>
                        <div className="text-xs text-slate-500">Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-slate-900">{totalHours.toFixed(1)}h</div>
                        <div className="text-xs text-slate-500">Hours</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEdit(project);
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteProject(project);
                        }}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start tracking tasks and time."
          actionLabel="New Project"
          onAction={() => {
            setEditingProject(null);
            setDialogOpen(true);
          }}
        />
      )}

      {/* Project Dialog */}
      <ProjectDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
        clients={clients}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteProject?.name}" and all its tasks and time entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteProject.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}