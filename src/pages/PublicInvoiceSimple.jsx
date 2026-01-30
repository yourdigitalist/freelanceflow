import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PublicInvoiceSimple() {
  const [invoice, setInvoice] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(null);
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
          setBusinessInfo(response.data.businessInfo || null);
        } else {
          setError(response.data?.error || 'Invoice not found');
        }
      } catch (err) {
        // Debug: 404 body = our "Invoice not found" vs API route not found
        console.error('Invoice fetch error:', err.response?.status, err.response?.data, err);
        const msg = err.response?.data?.error || err.message || 'Failed to load invoice';
        setError(msg);
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

  const hasBusinessInfo = businessInfo && (
    businessInfo.business_name ||
    businessInfo.business_logo ||
    businessInfo.business_address ||
    businessInfo.business_email ||
    businessInfo.business_phone
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {businessInfo?.business_logo ? (
              <img 
                src={businessInfo.business_logo} 
                alt={businessInfo.business_name || 'Business logo'} 
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9B63E9] to-[#8A52D8] flex items-center justify-center shadow-lg shadow-[#9B63E9]/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Invoice</p>
              <p className="font-semibold text-slate-900">{invoice.invoice_number}</p>
            </div>
          </div>
          {invoice.public_image_url && (
            <Button onClick={handleDownload} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          )}
        </div>
      </header>

      {/* Company info + Invoice Image */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Company info section */}
          {hasBusinessInfo && (
            <div className="p-6 sm:p-8 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  {businessInfo.business_logo && (
                    <img 
                      src={businessInfo.business_logo} 
                      alt={businessInfo.business_name || 'Business logo'} 
                      className="h-14 mb-3 object-contain"
                    />
                  )}
                  {businessInfo.business_name && (
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">{businessInfo.business_name}</h2>
                  )}
                  {businessInfo.business_address && (
                    <p className="text-sm text-slate-600 whitespace-pre-line">{businessInfo.business_address}</p>
                  )}
                  <div className="mt-2 space-y-0.5 text-sm text-slate-600">
                    {businessInfo.business_email && <p>{businessInfo.business_email}</p>}
                    {businessInfo.business_phone && <p>{businessInfo.business_phone}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice PNG image */}
          {invoice.public_image_url ? (
            <img 
              src={invoice.public_image_url} 
              alt={`Invoice ${invoice.invoice_number}`}
              className="w-full h-auto block"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-500">Invoice preview is being generated...</p>
              <p className="text-sm text-slate-400 mt-2">Please check back in a moment or contact the sender.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-lg mt-12">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          {businessInfo?.invoice_footer ? (
            <p className="text-sm text-slate-600 mb-4">{businessInfo.invoice_footer}</p>
          ) : null}
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