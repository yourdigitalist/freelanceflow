import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Search, DollarSign, Clock, AlertCircle, CheckCircle, Filter, Pencil, Trash2, Eye, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
import InvoiceDialog from '../components/invoices/InvoiceDialog';
import InvoicePreview from '../components/invoices/InvoicePreview';
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
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const statusIcons = {
  draft: FileText,
  sent: Clock,
  paid: CheckCircle,
  overdue: AlertCircle,
  cancelled: FileText,
};

export default function Invoices() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', user?.email],
    queryFn: () => base44.entities.Invoice.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.email],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: () => base44.entities.Project.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries', user?.email],
    queryFn: () => base44.entities.TimeEntry.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDialogOpen(false);
      setEditingInvoice(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDeleteInvoice(null);
    },
  });

  const handleSave = async (data) => {
    if (editingInvoice) {
      await updateMutation.mutateAsync({ id: editingInvoice.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return 'Unknown';
    return [client.first_name, client.last_name].filter(Boolean).join(' ') || client.company || 'Unnamed Client';
  };
  const getProjectName = (projectId) => projects.find(p => p.id === projectId)?.name;

  const unbilledTime = timeEntries.filter(t => !t.billed && t.billable);

  const filteredInvoices = invoices.filter(inv => {
    // Status filter
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    
    // Date filters
    if (inv.issue_date) {
      const issueDate = parseISO(inv.issue_date);
      const year = issueDate.getFullYear().toString();
      const month = (issueDate.getMonth() + 1).toString();
      
      if (yearFilter !== 'all' && year !== yearFilter) return false;
      if (monthFilter !== 'all' && month !== monthFilter) return false;
    }
    
    return true;
  });

  // Get unique years from invoices
  const availableYears = [...new Set(
    invoices
      .filter(inv => inv.issue_date)
      .map(inv => parseISO(inv.issue_date).getFullYear().toString())
  )].sort().reverse();

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const totalPending = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Client', 'Project', 'Issue Date', 'Due Date', 'Subtotal', 'Tax Rate', 'Tax Amount', 'Total', 'Status', 'Notes', 'Payment Terms'];
    const rows = filteredInvoices.map(invoice => [
      invoice.invoice_number || '',
      getClientName(invoice.client_id),
      getProjectName(invoice.project_id) || '',
      invoice.issue_date || '',
      invoice.due_date || '',
      invoice.subtotal || 0,
      invoice.tax_rate || 0,
      invoice.tax_amount || 0,
      invoice.total || 0,
      invoice.status || '',
      (invoice.notes || '').replace(/"/g, '""'),
      (invoice.payment_terms || '').replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Invoices"
        description="Create and manage client invoices"
        actionLabel="New Invoice"
        onAction={() => {
          setEditingInvoice(null);
          setDialogOpen(true);
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-200/60">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <FileText className="w-4 h-4" />
            Total Invoices
          </div>
          <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/60">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Clock className="w-4 h-4" />
            Pending
          </div>
          <p className="text-2xl font-bold text-amber-600">${totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/60">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <CheckCircle className="w-4 h-4" />
            Collected
          </div>
          <p className="text-2xl font-bold text-[#9B63E9]">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/60">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <AlertCircle className="w-4 h-4" />
            Overdue
          </div>
          <p className="text-2xl font-bold text-red-600">
            {invoices.filter(inv => inv.status === 'overdue').length}
          </p>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {months.map(month => (
              <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={filteredInvoices.length === 0}
          className="ml-auto"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="animate-pulse divide-y divide-slate-100">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="h-5 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-32 bg-slate-100 rounded" />
                <div className="h-4 w-20 bg-slate-100 rounded" />
                <div className="ml-auto h-6 w-20 bg-slate-200 rounded" />
                <div className="h-6 w-16 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredInvoices.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map(invoice => {
                const StatusIcon = statusIcons[invoice.status];
                return (
                  <TableRow key={invoice.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{getClientName(invoice.client_id)}</TableCell>
                    <TableCell>{getProjectName(invoice.project_id) || '—'}</TableCell>
                    <TableCell>
                      {invoice.issue_date ? format(parseISO(invoice.issue_date), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      {invoice.due_date ? format(parseISO(invoice.due_date), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${invoice.total?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("flex items-center gap-1 w-fit", statusColors[invoice.status])}>
                        <StatusIcon className="w-3 h-3" />
                        {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewInvoice(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingInvoice(invoice);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteInvoice(invoice)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice to start billing clients."
          actionLabel="New Invoice"
          onAction={() => {
            setEditingInvoice(null);
            setDialogOpen(true);
          }}
        />
      )}

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingInvoice(null);
        }}
        invoice={editingInvoice}
        clients={clients}
        projects={projects}
        unbilledTime={unbilledTime}
        initialData={null}
        onSave={handleSave}
      />

      {/* Invoice Preview */}
      <InvoicePreview
        open={!!previewInvoice}
        onOpenChange={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
        client={clients.find(c => c.id === previewInvoice?.client_id)}
        project={projects.find(p => p.id === previewInvoice?.project_id)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteInvoice} onOpenChange={() => setDeleteInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice {deleteInvoice?.invoice_number}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteInvoice.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}