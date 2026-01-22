import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Search, LayoutGrid, List } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import ClientCard from '../components/clients/ClientCard';
import ClientDialog from '../components/clients/ClientDialog';
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

export default function Clients() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteClient, setDeleteClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDialogOpen(false);
      setEditingClient(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDeleteClient(null);
    },
  });

  const handleSave = async (data) => {
    if (editingClient) {
      await updateMutation.mutateAsync({ id: editingClient.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const getProjectCount = (clientId) => projects.filter(p => p.client_id === clientId).length;

  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Clients"
        description="Manage your client relationships"
        actionLabel="Add Client"
        onAction={() => {
          setEditingClient(null);
          setDialogOpen(true);
        }}
      />

      {/* Search and View Toggle */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
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

      {/* Clients Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/60 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-slate-200 rounded" />
                  <div className="w-16 h-3 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-100 rounded" />
                <div className="w-2/3 h-3 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClients.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                projectCount={getProjectCount(client.id)}
                onEdit={handleEdit}
                onDelete={setDeleteClient}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredClients.map(client => (
                <div key={client.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                    style={{ backgroundColor: client.avatar_color || '#10b981' }}
                  >
                    {client.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{client.name}</div>
                    <div className="text-sm text-slate-500 truncate">{client.email}</div>
                  </div>
                  <div className="text-sm text-slate-600">
                    {getProjectCount(client.id)} projects
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(client)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteClient(client)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start managing projects and invoices."
          actionLabel="Add Client"
          onAction={() => {
            setEditingClient(null);
            setDialogOpen(true);
          }}
        />
      )}

      {/* Client Dialog */}
      <ClientDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingClient(null);
        }}
        client={editingClient}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteClient?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteClient.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}