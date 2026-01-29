import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, DollarSign, FileText, TrendingUp, Eye } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.asServiceRole.entities.User.list(),
    enabled: user?.role === 'admin',
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.asServiceRole.entities.Project.list(),
    enabled: user?.role === 'admin',
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['allClients'],
    queryFn: () => base44.asServiceRole.entities.Client.list(),
    enabled: user?.role === 'admin',
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['allInvoices'],
    queryFn: () => base44.asServiceRole.entities.Invoice.list(),
    enabled: user?.role === 'admin',
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.asServiceRole.entities.ReviewRequest.list(),
    enabled: user?.role === 'admin',
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be an admin to view this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  const pendingRevenue = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  const overdueInvoices = invoices.filter(inv => 
    inv.status === 'overdue'
  ).length;

  const pendingReviews = reviews.filter(r => r.status === 'pending').length;
  const approvedReviews = reviews.filter(r => r.status === 'approved').length;

  const stats = [
    { 
      label: 'Total Users', 
      value: allUsers.length, 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'Active Projects', 
      value: projects.filter(p => p.status === 'in_progress').length, 
      icon: FolderKanban, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    { 
      label: 'Total Clients', 
      value: clients.length, 
      icon: Users, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    { 
      label: 'Total Revenue', 
      value: `$${totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      label: 'Pending Revenue', 
      value: `$${pendingRevenue.toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    { 
      label: 'Overdue Invoices', 
      value: overdueInvoices, 
      icon: FileText, 
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
  ];

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-2">Overview of platform usage and metrics</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-[#9B63E9]/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-[#9B63E9]/20">
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>
                {pendingReviews} pending • {approvedReviews} approved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reviews.slice(0, 5).map(review => (
                  <div key={review.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <Eye className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{review.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(review.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      review.status === 'approved' ? 'default' : 
                      review.status === 'rejected' ? 'destructive' : 
                      'secondary'
                    }>
                      {review.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#9B63E9]/20">
            <CardHeader>
              <CardTitle>Invoice Overview</CardTitle>
              <CardDescription>
                {invoices.filter(i => i.status === 'paid').length} paid • {invoices.filter(i => i.status === 'sent').length} sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.slice(0, 5).map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{invoice.invoice_number}</p>
                        <p className="text-xs text-slate-500">
                          ${invoice.total?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      invoice.status === 'paid' ? 'default' : 
                      invoice.status === 'overdue' ? 'destructive' : 
                      'secondary'
                    }>
                      {invoice.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}