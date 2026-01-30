import React from 'react';
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";

const statusColors = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function InvoiceRenderer({ invoice, client, project, businessInfo, invoiceSettings, currencySymbol }) {
  return (
    <div className="p-8 bg-white" style={{ width: '794px', minHeight: '1123px' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {businessInfo.business_logo && (
            <img 
              src={businessInfo.business_logo} 
              alt="Business logo" 
              className="h-12 mb-3 object-contain"
              crossOrigin="anonymous"
            />
          )}
          {businessInfo.business_name && (
            <h2 className="text-lg font-semibold text-slate-900 mb-1">{businessInfo.business_name}</h2>
          )}
          {businessInfo.business_address && (
            <p className="text-sm text-slate-600 whitespace-pre-line mb-2">{businessInfo.business_address}</p>
          )}
          {(businessInfo.business_email || businessInfo.business_phone) && (
            <p className="text-sm text-slate-600">
              {businessInfo.business_email}
              {businessInfo.business_email && businessInfo.business_phone && ' | '}
              {businessInfo.business_phone}
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
          <p className="font-semibold text-slate-900">
            {[client?.first_name, client?.last_name].filter(Boolean).join(' ') || client?.company || 'Client'}
          </p>
          {client?.company && client?.first_name && <p className="text-slate-600">{client.company}</p>}
          <p className="text-slate-600">{client?.email}</p>
          {[client?.street, client?.city, client?.state, client?.zip, client?.country].filter(Boolean).length > 0 && (
            <p className="text-slate-600 mt-1">
              {[client?.street, client?.street2, 
                [client?.city, client?.state, client?.zip].filter(Boolean).join(', '),
                client?.country].filter(Boolean).join(', ')}
            </p>
          )}
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
              {invoice.show_item_column && (
                <th className="text-left py-3 text-sm font-medium text-slate-500">Description</th>
              )}
              {invoice.show_quantity_column && (
                <th className="text-right py-3 text-sm font-medium text-slate-500 w-20">Qty</th>
              )}
              {invoice.show_rate_column && (
                <th className="text-right py-3 text-sm font-medium text-slate-500 w-24">Rate</th>
              )}
              <th className="text-right py-3 text-sm font-medium text-slate-500 w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items?.map((item, index) => (
              <tr key={index} className="border-b border-slate-100">
                {invoice.show_item_column && (
                  <td className="py-3 text-slate-900">{item.description}</td>
                )}
                {invoice.show_quantity_column && (
                  <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                )}
                {invoice.show_rate_column && (
                  <td className="py-3 text-right text-slate-600">{currencySymbol}{item.rate?.toFixed(2)}</td>
                )}
                <td className="py-3 text-right font-medium text-slate-900">{currencySymbol}{item.amount?.toFixed(2)}</td>
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
            <span className="font-medium text-slate-900">{currencySymbol}{invoice.subtotal?.toFixed(2)}</span>
          </div>
          {invoice.tax_rate > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-slate-600">{invoice.tax_name || 'Tax'} ({invoice.tax_rate}%)</span>
              <span className="font-medium text-slate-900">{currencySymbol}{invoice.tax_amount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 border-t border-slate-200 mt-2">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="font-bold text-xl text-[#9B63E9]">{currencySymbol}{invoice.total?.toFixed(2)}</span>
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
  );
}