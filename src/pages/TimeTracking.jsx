import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Calendar, Search, Pencil, Trash2, DollarSign } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import TimeEntryDialog from '../components/time/TimeEntryDialog';
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

export default function TimeTracking() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteEntry, setDeleteEntry] = useState(null);
  const [projectFilter, setProjectFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ['timeEntries', user?.email],
    queryFn: () => base44.entities.TimeEntry.filter({ created_by: user.email }, '-date'),
    enabled: !!user?.email,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: () => base44.entities.Project.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TimeEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      setDialogOpen(false);
      setEditingEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TimeEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      setDeleteEntry(null);
    },
  });

  const handleSave = async (data) => {
    if (editingEntry) {
      await updateMutation.mutateAsync({ id: editingEntry.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const getProjectName = (projectId) => projects.find(p => p.id === projectId)?.name || 'Unknown';
  const getTaskName = (taskId) => tasks.find(t => t.id === taskId)?.title;

  const filterByPeriod = (entry) => {
    if (periodFilter === 'all') return true;
    const entryDate = parseISO(entry.date);
    const now = new Date();
    
    if (periodFilter === 'week') {
      return isWithinInterval(entryDate, { start: startOfWeek(now), end: endOfWeek(now) });
    }
    if (periodFilter === 'month') {
      return isWithinInterval(entryDate, { start: startOfMonth(now), end: endOfMonth(now) });
    }
    return true;
  };

  const filteredEntries = timeEntries
    .filter(entry => projectFilter === 'all' || entry.project_id === projectFilter)
    .filter(filterByPeriod);

  const totalHours = filteredEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  const billableHours = filteredEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.hours || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Time Tracking"
        description="Log and manage your billable hours"
        actionLabel="Log Time"
        onAction={() => {
          setEditingEntry(null);
          setDialogOpen(true);
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-200/60">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Clock className="w-4 h-4" />
            Total Hours
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/60">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <DollarSign className="w-4 h-4" />
            Billable Hours
          </div>
          <p className="text-2xl font-bold text-emerald-600">{billableHours.toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Calendar className="w-4 h-4" />
            Entries
          </div>
          <p className="text-2xl font-bold text-slate-900">{filteredEntries.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Time Entries Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="animate-pulse p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      ) : filteredEntries.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map(entry => (
                <TableRow key={entry.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">
                    {format(parseISO(entry.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">{getProjectName(entry.project_id)}</p>
                      {entry.task_id && (
                        <p className="text-xs text-slate-500">{getTaskName(entry.task_id)}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-slate-600 max-w-xs truncate">{entry.description || '—'}</p>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{entry.hours}h</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {entry.billable && (
                        <Badge className="bg-emerald-100 text-emerald-700">Billable</Badge>
                      )}
                      {entry.billed && (
                        <Badge className="bg-blue-100 text-blue-700">Billed</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingEntry(entry);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteEntry(entry)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Clock}
          title="No time entries yet"
          description="Start logging your time to track billable hours for your projects."
          actionLabel="Log Time"
          onAction={() => {
            setEditingEntry(null);
            setDialogOpen(true);
          }}
        />
      )}

      {/* Time Entry Dialog */}
      <TimeEntryDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingEntry(null);
        }}
        entry={editingEntry}
        projects={projects}
        tasks={tasks}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete time entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {deleteEntry?.hours}h entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteEntry.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}