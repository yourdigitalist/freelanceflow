import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Eye } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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

export default function InvoiceDialog({ 
  open, 
  onOpenChange, 
  invoice, 
  clients = [], 
  projects = [], 
  unbilledTime = [],
  initialData = null,
  onSave 
}) {
  const [formData, setFormData] = useState({
    invoice_number: '',
    client_id: '',
    project_id: '',
    status: 'draft',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    line_items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    tax_rate: 0,
    tax_name: '',
    notes: '',
    payment_terms: 'Payment due within 30 days.',
    show_item_column: true,
    show_quantity_column: true,
    show_rate_column: true,
  });
  const [saving, setSaving] = useState(false);

  // Fetch invoice settings
  const { data: invoiceSettings } = useQuery({
    queryKey: ['invoiceSettings'],
    queryFn: async () => {
      const list = await base44.entities.InvoiceSettings.list();
      return list[0] || null;
    },
  });

  const { data: taxRates = [] } = useQuery({
    queryKey: ['taxRates'],
    queryFn: () => base44.entities.TaxRate.list(),
  });

  const [showEditWarning, setShowEditWarning] = useState(false);

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number || '',
        client_id: invoice.client_id || '',
        project_id: invoice.project_id || '',
        status: invoice.status || 'draft',
        issue_date: invoice.issue_date || format(new Date(), 'yyyy-MM-dd'),
        due_date: invoice.due_date || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        line_items: invoice.line_items || [{ description: '', quantity: 1, rate: 0, amount: 0 }],
        tax_rate: invoice.tax_rate || 0,
        tax_name: invoice.tax_name || '',
        notes: invoice.notes || '',
        payment_terms: invoice.payment_terms || 'Payment due within 30 days.',
        show_item_column: invoice.show_item_column !== undefined ? invoice.show_item_column : true,
        show_quantity_column: invoice.show_quantity_column !== undefined ? invoice.show_quantity_column : true,
        show_rate_column: invoice.show_rate_column !== undefined ? invoice.show_rate_column : true,
      });
      if (invoice.status === 'sent' && open) {
        setShowEditWarning(true);
      }
    } else {
      const nextNumber = `INV-${String(Date.now()).slice(-6)}`;
      const defaultTax = taxRates.find(t => t.id === invoiceSettings?.default_tax_rate_id);
      setFormData({
        invoice_number: nextNumber,
        client_id: initialData?.client_id || '',
        project_id: initialData?.project_id || '',
        status: 'draft',
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        line_items: initialData?.line_items || [{ description: '', quantity: 1, rate: 0, amount: 0 }],
        tax_rate: defaultTax?.rate || 0,
        tax_name: defaultTax?.name || '',
        notes: '',
        payment_terms: invoiceSettings?.default_payment_terms || 'Payment due within 30 days.',
        show_item_column: true,
        show_quantity_column: true,
        show_rate_column: true,
      });
      setShowEditWarning(false);
    }
  }, [invoice, initialData, invoiceSettings, taxRates, open]);

  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].rate || 0);
    }
    setFormData({ ...formData, line_items: newItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [...formData.line_items, { description: '', quantity: 1, rate: 0, amount: 0 }],
    });
  };

  const removeLineItem = (index) => {
    if (formData.line_items.length > 1) {
      setFormData({
        ...formData,
        line_items: formData.line_items.filter((_, i) => i !== index),
      });
    }
  };

  const [importMode, setImportMode] = useState(null);

  const importUnbilledTime = async (mode = 'combined') => {
    if (!formData.project_id) return;
    
    const projectTime = unbilledTime.filter(t => t.project_id === formData.project_id && t.billable && !t.billed);
    const project = projects.find(p => p.id === formData.project_id);
    const rate = project?.hourly_rate || 0;
    
    if (projectTime.length === 0) return;

    let newItems = [];
    
    if (mode === 'combined') {
      const totalHours = projectTime.reduce((sum, t) => sum + (t.hours || 0), 0);
      newItems = [{
        description: `Professional services - ${totalHours} hours`,
        quantity: totalHours,
        rate: rate,
        amount: totalHours * rate,
      }];
    } else {
      // Fetch task names for each time entry
      const taskIds = [...new Set(projectTime.filter(t => t.task_id).map(t => t.task_id))];
      const tasks = taskIds.length > 0 
        ? await Promise.all(taskIds.map(id => base44.entities.Task.filter({ id }).then(res => res[0])))
        : [];
      const taskMap = Object.fromEntries(tasks.filter(Boolean).map(t => [t.id, t]));
      
      newItems = projectTime.map(t => ({
        description: t.task_id && taskMap[t.task_id] ? taskMap[t.task_id].title : (t.description || 'Professional services'),
        quantity: t.hours || 0,
        rate: rate,
        amount: (t.hours || 0) * rate,
      }));
    }
    
    setFormData({
      ...formData,
      line_items: [...formData.line_items.filter(item => item.description), ...newItems],
    });
    setImportMode(null);
  };

  const importProjectBudget = () => {
    if (!formData.project_id) return;
    
    const project = projects.find(p => p.id === formData.project_id);
    
    if (project && project.billing_type === 'fixed' && project.budget) {
      const newItem = {
        description: `Fixed Project Fee: ${project.name}`,
        quantity: 1,
        rate: project.budget,
        amount: project.budget,
      };
      setFormData({
        ...formData,
        line_items: [...formData.line_items.filter(item => item.description), newItem],
      });
    }
  };

  const subtotal = formData.line_items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = subtotal * (formData.tax_rate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Generate public token if creating new invoice
    const dataToSave = {
      ...formData,
      subtotal,
      tax_amount: taxAmount,
      total,
    };

    if (!invoice) {
      const publicToken = crypto.randomUUID() + '-' + Date.now();
      const appUrl = window.location.origin;
      dataToSave.public_token = publicToken;
      dataToSave.public_url = `${appUrl}/PublicInvoice?token=${publicToken}`;
    }

    await onSave(dataToSave);
    setSaving(false);
  };

  const clientProjects = projects.filter(p => p.client_id === formData.client_id);
  const selectedProject = projects.find(p => p.id === formData.project_id);
  const canImportBudget = selectedProject?.billing_type === 'fixed' && selectedProject?.budget;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoice_number">Invoice Number *</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value, project_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {[client.first_name, client.last_name].filter(Boolean).join(' ') || client.company || 'Unnamed Client'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {clientProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issue_date">Issue Date *</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Line Items</Label>
              <div className="flex gap-2">
                {formData.project_id && canImportBudget && (
                  <Button type="button" variant="outline" size="sm" onClick={importProjectBudget}>
                    Import Project Budget
                  </Button>
                )}
                {formData.project_id && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setImportMode('prompt')}>
                    Import Billable Hours
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2 items-center px-3 text-sm font-medium text-slate-600">
                <div className="flex-1 flex items-center gap-2">
                  Item
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, show_item_column: !formData.show_item_column })}
                    className={`p-1 rounded hover:bg-slate-100 transition-colors ${formData.show_item_column ? 'text-[#9B63E9]' : 'text-slate-400'}`}
                    title={formData.show_item_column ? 'Hide Item column' : 'Show Item column'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-20 flex items-center gap-2">
                  Quantity
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, show_quantity_column: !formData.show_quantity_column })}
                    className={`p-1 rounded hover:bg-slate-100 transition-colors ${formData.show_quantity_column ? 'text-[#9B63E9]' : 'text-slate-400'}`}
                    title={formData.show_quantity_column ? 'Hide Quantity column' : 'Show Quantity column'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-24 flex items-center gap-2">
                  Rate
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, show_rate_column: !formData.show_rate_column })}
                    className={`p-1 rounded hover:bg-slate-100 transition-colors ${formData.show_rate_column ? 'text-[#9B63E9]' : 'text-slate-400'}`}
                    title={formData.show_rate_column ? 'Hide Rate column' : 'Show Rate column'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-24 text-right">Amount</div>
                <div className="w-9"></div>
              </div>
              {formData.line_items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-24 flex items-center justify-end font-medium text-slate-700">
                    ${item.amount.toFixed(2)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addLineItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Line Item
              </Button>
            </div>

          </div>

          {/* Totals */}
          <div className="flex flex-col items-end gap-2 p-4 bg-slate-50 rounded-lg">
            <div className="flex justify-between w-full max-w-xs">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-full max-w-xs items-center gap-2">
              <span className="text-slate-600">Tax</span>
              <Select
                value={formData.tax_name}
                onValueChange={(value) => {
                  const selectedTax = taxRates.find(t => t.name === value);
                  setFormData({
                    ...formData,
                    tax_rate: selectedTax?.rate || 0,
                    tax_name: selectedTax?.name || ''
                  });
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="No Tax" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Tax</SelectItem>
                  {taxRates.map((tax) => (
                    <SelectItem key={tax.id} value={tax.name}>
                      {tax.name} ({tax.rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="font-medium w-24 text-right">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-full max-w-xs pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="font-bold text-lg text-[#9B63E9]">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes for the client..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Textarea
              id="payment_terms"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              placeholder="Payment instructions..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#9B63E9] hover:bg-[#8A52D8]">
              {saving ? 'Saving...' : (invoice ? 'Save Changes' : 'Create Invoice')}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Edit Warning Dialog */}
      <AlertDialog open={showEditWarning} onOpenChange={setShowEditWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Invoice Already Sent</AlertDialogTitle>
            <AlertDialogDescription>
              This invoice has already been sent to the client. Any changes you make will not be reflected in the version they received unless you send it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowEditWarning(false)}>
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Mode Dialog */}
      <AlertDialog open={importMode === 'prompt'} onOpenChange={() => setImportMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Billable Hours</AlertDialogTitle>
            <AlertDialogDescription>
              How would you like to import the billable hours?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => importUnbilledTime('combined')}>
              Combined (One Item)
            </AlertDialogAction>
            <AlertDialogAction onClick={() => importUnbilledTime('separate')}>
              Separate Items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}