import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatNumber } from '@/components/shared/formatNumber';

const statusColors = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function PublicInvoice() {
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get('token');

        if (!token) {
          setError('Invalid invoice link');
          setLoading(false);
          return;
        }

        const response = await base44.functions.invoke('getInvoiceByPublicToken', { token });
        setInvoiceData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Invoice not found');
        setLoading(false);
      }
    };

    loadInvoice();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invoice Not Found</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!invoiceData) return null;

  const { invoice, client, project, businessInfo, numberFormat } = invoiceData;

  const clientName = [client?.first_name, client?.last_name].filter(Boolean).join(' ') || client?.company || 'Client';
  const clientAddress = [
    client?.street,
    client?.street2,
    [client?.city, client?.state, client?.zip].filter(Boolean).join(', '),
    client?.country
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b border-slate-200">
            <div>
              {businessInfo?.business_logo && (
                <img 
                  src={businessInfo.business_logo} 
                  alt="Business logo" 
                  className="h-16 mb-4 object-contain"
                />
              )}
              {businessInfo?.business_name && (
                <h2 className="text-xl font-semibold text-slate-900 mb-2">{businessInfo.business_name}</h2>
              )}
              {businessInfo?.business_address && (
                <p className="text-sm text-slate-600 whitespace-pre-line mb-2">{businessInfo.business_address}</p>
              )}
              <div className="text-sm text-slate-600 space-y-0.5">
                {businessInfo?.business_email && <p>{businessInfo.business_email}</p>}
                {businessInfo?.business_phone && <p>{businessInfo.business_phone}</p>}
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">INVOICE</h1>
              <p className="text-lg text-slate-600 mb-2">{invoice.invoice_number}</p>
              <Badge className={cn("text-sm", statusColors[invoice.status])}>
                {invoice.status?.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Dates and Client Info */}
          <div className="grid sm:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide">Bill To</h3>
              <p className="font-semibold text-lg text-slate-900 mb-1">{clientName}</p>
              {client?.company && client?.first_name && <p className="text-slate-600">{client.company}</p>}
              <p className="text-slate-600">{client?.email}</p>
              {clientAddress && <p className="text-slate-600 mt-1">{clientAddress}</p>}
              {client?.tax_id && <p className="text-slate-600 mt-1">Tax ID: {client.tax_id}</p>}
            </div>
            <div className="sm:text-right space-y-3">
              <div>
                <p className="text-sm text-slate-500 font-medium">Issue Date</p>
                <p className="text-lg text-slate-900">
                  {invoice.issue_date ? format(parseISO(invoice.issue_date), 'MMMM d, yyyy') : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Due Date</p>
                <p className="text-lg text-slate-900">
                  {invoice.due_date ? format(parseISO(invoice.due_date), 'MMMM d, yyyy') : '—'}
                </p>
              </div>
            </div>
          </div>

          {project && (
            <div className="mb-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-sm text-[#9B63E9] font-medium mb-1">Project</p>
              <p className="text-lg font-semibold text-slate-900">{project.name}</p>
            </div>
          )}

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  {invoice.show_item_column && (
                    <th className="text-left py-4 text-sm font-semibold text-slate-700 uppercase tracking-wide">Item</th>
                  )}
                  {invoice.show_quantity_column && (
                    <th className="text-right py-4 text-sm font-semibold text-slate-700 uppercase tracking-wide w-20">Quantity</th>
                  )}
                  {invoice.show_rate_column && (
                    <th className="text-right py-4 text-sm font-semibold text-slate-700 uppercase tracking-wide w-28">Rate</th>
                  )}
                  <th className="text-right py-4 text-sm font-semibold text-slate-700 uppercase tracking-wide w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items?.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    {invoice.show_item_column && (
                      <td className="py-4 text-slate-900">{item.description}</td>
                    )}
                    {invoice.show_quantity_column && (
                      <td className="py-4 text-right text-slate-600">{item.quantity}</td>
                    )}
                    {invoice.show_rate_column && (
                      <td className="py-4 text-right text-slate-600">${formatNumber(item.rate, numberFormat)}</td>
                    )}
                    <td className="py-4 text-right font-semibold text-slate-900">${formatNumber(item.amount, numberFormat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="flex justify-between py-3 text-lg">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">${formatNumber(invoice.subtotal, numberFormat)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between py-3 text-lg">
                  <span className="text-slate-600">Tax ({invoice.tax_rate}%)</span>
                  <span className="font-semibold text-slate-900">${formatNumber(invoice.tax_amount, numberFormat)}</span>
                </div>
              )}
              <div className="flex justify-between py-4 border-t-2 border-slate-300 mt-2">
                <span className="font-bold text-xl text-slate-900">Total</span>
                <span className="font-bold text-2xl text-[#9B63E9]">${formatNumber(invoice.total, numberFormat)}</span>
              </div>
            </div>
          </div>

          {/* Notes and Payment Terms */}
          {(invoice.notes || invoice.payment_terms || businessInfo?.invoice_footer) && (
            <div className="border-t border-slate-200 pt-8 space-y-6">
              {invoice.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Notes</h4>
                  <p className="text-slate-600">{invoice.notes}</p>
                </div>
              )}
              {invoice.payment_terms && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Payment Terms</h4>
                  <p className="text-slate-600">{invoice.payment_terms}</p>
                </div>
              )}
              {businessInfo?.invoice_footer && (
                <div className="text-center pt-6 border-t border-slate-100">
                  <p className="text-sm text-slate-500">{businessInfo.invoice_footer}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Print Button */}
        <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 print:hidden">
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 py-3 bg-[#9B63E9] hover:bg-[#8A52D8] text-white font-semibold rounded-lg transition-colors"
          >
            Print or Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}