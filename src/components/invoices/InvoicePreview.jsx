import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const statusColors = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function InvoicePreview({ open, onOpenChange, invoice, client, project }) {
  const { data: invoiceSettings } = useQuery({
    queryKey: ['invoiceSettings'],
    queryFn: async () => {
      const list = await base44.entities.InvoiceSettings.list();
      return list[0] || null;
    },
  });

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Invoice Preview</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 p-8 bg-white border border-slate-200 rounded-xl">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {invoiceSettings?.business_logo && (
                <img 
                  src={invoiceSettings.business_logo} 
                  alt="Business logo" 
                  className="h-12 mb-3 object-contain"
                />
              )}
              {invoiceSettings?.business_name && (
                <h2 className="text-lg font-semibold text-slate-900 mb-1">{invoiceSettings.business_name}</h2>
              )}
              {invoiceSettings?.business_address && (
                <p className="text-sm text-slate-600 whitespace-pre-line mb-2">{invoiceSettings.business_address}</p>
              )}
              {(invoiceSettings?.business_email || invoiceSettings?.business_phone) && (
                <p className="text-sm text-slate-600">
                  {invoiceSettings.business_email}
                  {invoiceSettings.business_email && invoiceSettings.business_phone && ' | '}
                  {invoiceSettings.business_phone}
                </p>
              )}
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">INVOICE</h1>
              <p className="text-slate-500">{invoice.invoice_number}</p>
              <Badge className={cn("text-sm mt-2", statusColors[invoice.status])}>
                {invoice.status?.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Dates and Client Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Bill To</h3>
              <p className="font-semibold text-slate-900">{client?.name}</p>
              {client?.company && <p className="text-slate-600">{client.company}</p>}
              <p className="text-slate-600">{client?.email}</p>
              {client?.address && <p className="text-slate-600">{client.address}</p>}
            </div>
            <div className="text-right">
              <div className="mb-3">
                <p className="text-sm text-slate-500">Issue Date</p>
                <p className="font-medium text-slate-900">
                  {invoice.issue_date ? format(parseISO(invoice.issue_date), 'MMMM d, yyyy') : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Due Date</p>
                <p className="font-medium text-slate-900">
                  {invoice.due_date ? format(parseISO(invoice.due_date), 'MMMM d, yyyy') : '—'}
                </p>
              </div>
            </div>
          </div>

          {project && (
            <div className="mb-8 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Project</p>
              <p className="font-medium text-slate-900">{project.name}</p>
            </div>
          )}

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 text-sm font-medium text-slate-500">Description</th>
                  <th className="text-right py-3 text-sm font-medium text-slate-500 w-20">Qty</th>
                  <th className="text-right py-3 text-sm font-medium text-slate-500 w-24">Rate</th>
                  <th className="text-right py-3 text-sm font-medium text-slate-500 w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items?.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-3 text-slate-900">{item.description}</td>
                    <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600">${item.rate?.toFixed(2)}</td>
                    <td className="py-3 text-right font-medium text-slate-900">${item.amount?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-900">${invoice.subtotal?.toFixed(2)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Tax ({invoice.tax_rate}%)</span>
                  <span className="font-medium text-slate-900">${invoice.tax_amount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-t border-slate-200 mt-2">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-xl text-emerald-600">${invoice.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes and Payment Terms */}
          {(invoice.notes || invoice.payment_terms || invoiceSettings?.invoice_footer) && (
            <div className="border-t border-slate-200 pt-6 space-y-4">
              {invoice.notes && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Notes</h4>
                  <p className="text-slate-600 text-sm">{invoice.notes}</p>
                </div>
              )}
              {invoice.payment_terms && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Payment Terms</h4>
                  <p className="text-slate-600 text-sm">{invoice.payment_terms}</p>
                </div>
              )}
              {invoiceSettings?.invoice_footer && (
                <div className="text-center pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">{invoiceSettings.invoice_footer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}