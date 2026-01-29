import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Users, 
  FolderKanban, 
  Clock, 
  DollarSign,
  ArrowRight,
  Plus,
  Eye,
  FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import StatCard from '../components/dashboard/StatCard';
import ProjectCard from '../components/dashboard/ProjectCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import AuthGuard from '../components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries', user?.email],
    queryFn: () => base44.entities.TimeEntry.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', user?.email],
    queryFn: () => base44.entities.Invoice.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', user?.email],
    queryFn: () => base44.entities.ReviewRequest.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  // Calculate stats
  const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'review');
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const unbilledHours = timeEntries.filter(e => !e.billed && e.billable).reduce((sum, e) => sum + (e.hours || 0), 0);
  const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Recent activities
  const recentActivities = timeEntries
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5)
    .map(entry => {
      const project = projects.find(p => p.id === entry.project_id);
      return {
        type: 'time',
        description: `${entry.hours}h logged on ${project?.name || 'Unknown project'}`,
        date: entry.created_date,
      };
    });

  // Get task counts per project
  const getProjectTaskCount = (projectId) => tasks.filter(t => t.project_id === projectId).length;
  const getProjectHours = (projectId) => timeEntries.filter(t => t.project_id === projectId).reduce((sum, e) => sum + (e.hours || 0), 0);

  const pendingReviews = reviews.filter(r => r.status === 'pending').length;
  const approvedReviews = reviews.filter(r => r.status === 'approved').length;

  return (
    <AuthGuard requireOnboarding={true}>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl('TimeTracking')}>
            <Button variant="outline" className="border-slate-200">
              <Clock className="w-4 h-4 mr-2" />
              Log Time
            </Button>
          </Link>
          <Link to={createPageUrl('Projects')}>
            <Button className="bg-[#9B63E9] hover:bg-[#8A52D8] shadow-lg shadow-[#9B63E9]/20">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Clients"
          value={clients.filter(c => c.status === 'active').length}
          subtitle={`${clients.length} total`}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects.length}
          subtitle={`${projects.length} total`}
          icon={FolderKanban}
          color="purple"
        />
        <StatCard
          title="Hours This Month"
          value={totalHours.toFixed(1)}
          subtitle={`${unbilledHours.toFixed(1)}h unbilled`}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Pending Payment"
          value={`$${pendingAmount.toLocaleString()}`}
          subtitle={`${pendingInvoices.length} invoices`}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Active Projects</h2>
            <Link to={createPageUrl('Projects')} className="text-sm text-[#9B63E9] hover:text-[#8A52D8] font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {activeProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeProjects.slice(0, 4).map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  client={clients.find(c => c.id === project.client_id)}
                  totalHours={getProjectHours(project.id)}
                  taskCount={getProjectTaskCount(project.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/60 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <FolderKanban className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">No active projects yet</p>
              <Link to={createPageUrl('Projects')}>
                <Button className="mt-4 bg-[#9B63E9] hover:bg-[#8A52D8]">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivity activities={recentActivities} />
        </div>
      </div>

      {/* Reviews and Invoices Summary */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card className="border-[#9B63E9]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#9B63E9]" />
                Review Requests
              </CardTitle>
              <Link to={createPageUrl('ReviewRequests')} className="text-sm text-[#9B63E9] hover:text-[#8A52D8] font-medium flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{reviews.length}</p>
                <p className="text-sm text-slate-500">Total reviews</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{pendingReviews} pending</Badge>
                <Badge variant="default" className="bg-green-100 text-green-700">{approvedReviews} approved</Badge>
              </div>
            </div>
            <div className="space-y-2">
              {reviews.slice(0, 3).map(review => (
                <Link key={review.id} to={createPageUrl(`ReviewRequestDetail?id=${review.id}`)} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded px-2 transition-colors">
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
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#9B63E9]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#9B63E9]" />
                Recent Invoices
              </CardTitle>
              <Link to={createPageUrl('Invoices')} className="text-sm text-[#9B63E9] hover:text-[#8A52D8] font-medium flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
                <p className="text-sm text-slate-500">Total invoices</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{invoices.filter(i => i.status === 'sent').length} sent</Badge>
                <Badge variant="default" className="bg-green-100 text-green-700">{invoices.filter(i => i.status === 'paid').length} paid</Badge>
              </div>
            </div>
            <div className="space-y-2">
              {invoices.slice(0, 3).map(invoice => (
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
    </AuthGuard>
  );
}