import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PublicInvoiceSimple() {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setError('Invalid invoice link');
        setLoading(false);
        return;
      }

      try {
        const response = await base44.functions.invoke('getInvoiceByPublicToken', { token });
        if (response.data?.invoice) {
          setInvoice(response.data.invoice);
        } else {
          setError('Invoice not found');
        }
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#9B63E9] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invoice Not Found</h1>
          <p className="text-slate-600">{error || 'This invoice link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    if (invoice.public_image_url) {
      const link = document.createElement('a');
      link.href = invoice.public_image_url;
      link.download = `invoice-${invoice.invoice_number}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9B63E9] to-[#8A52D8] flex items-center justify-center shadow-lg shadow-[#9B63E9]/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Invoice</p>
              <p className="font-semibold text-slate-900">{invoice.invoice_number}</p>
            </div>
          </div>
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </header>

      {/* Invoice Image */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {invoice.public_image_url ? (
            <img 
              src={invoice.public_image_url} 
              alt={`Invoice ${invoice.invoice_number}`}
              className="w-full h-auto"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-500">Invoice preview is being generated...</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-lg mt-12">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#9B63E9] to-[#8A52D8] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900">Powered by Flowdesk</span>
          </div>
          <p className="text-xs text-slate-500">Professional invoicing made simple</p>
        </div>
      </footer>
    </div>
  );
}